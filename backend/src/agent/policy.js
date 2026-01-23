/**
 * PRICING POLICY ENGINE
 * 
 * This is the SINGLE SOURCE OF TRUTH for all discount calculations.
 * The AI assistant MUST respect these limits - they cannot be overridden!
 * 
 * Discount Structure:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * BASE TIER DISCOUNTS (loyalty-based):
 *   Bronze: 5%  (entry level)
 *   Silver: 8%  (good customer)
 *   Gold:   12% (VIP customer)
 * 
 * BUNDLE BONUS:
 *   +2% for 2+ items in cart
 * 
 * PENALTIES:
 *   -3% for low stock items (≤3 units)
 *   -0.5% per haggling attempt (max -2%)
 * 
 * MAXIMUM POSSIBLE:
 *   Bronze: 5-7%   (5% base + 2% bundle)
 *   Silver: 8-10%  (8% base + 2% bundle)
 *   Gold:   12-14% (12% base + 2% bundle)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { loadInventory } from "../store/inventoryStore.js";

export function computeOffer({ user, items, userAskedDiscount, attempt, previousDiscount = 0 }) {
  const originalTotal = items.reduce((s, p) => s + p.price, 0);

  // TIER CAP: Base discount based on loyalty tier
  const tierCapPct = user.tier === "gold" ? 0.12 : user.tier === "silver" ? 0.08 : 0.05;
  
  // BUNDLE BONUS: Extra 2% for buying 2+ items (bulk purchase or different items)
  // Applies to: multiple of same item (bulk) OR different items (bundle)
  const bundleBonusPct = items.length >= 2 ? 0.02 : 0;

  // SCARCITY PENALTY: Reduce discount if items are low stock
  const inventory = loadInventory();
  const lowStockSkus = items
    .map((p) => ({ sku: p.sku, stock: inventory.stockBySku[p.sku] ?? 0 }))
    .filter((x) => x.stock > 0 && x.stock <= 3);
  const scarcityPenaltyPct = lowStockSkus.length > 0 ? 0.03 : 0;

  // CALCULATE MAXIMUM DISCOUNT ALLOWED
  const maxDiscountPct = Math.max(0, tierCapPct + bundleBonusPct - scarcityPenaltyPct);
  const maxDiscount = Math.floor(originalTotal * maxDiscountPct);

  // USER'S REQUEST
  const asked = typeof userAskedDiscount === "number" ? userAskedDiscount : null;

  // DYNAMIC HAGGLING STRATEGY: Random starting discount, increase based on negotiation
  let baseDiscount;
  
  if (attempt === 0 || previousDiscount === 0) {
    // First attempt: Random starting discount (20-40% of max)
    // This makes each negotiation unique and realistic
    const randomMultiplier = 0.2 + (Math.random() * 0.2); // 0.2 to 0.4 (20-40%)
    baseDiscount = Math.floor(maxDiscount * randomMultiplier);
    // Ensure minimum discount of at least ₹10 if max is high enough
    if (maxDiscount >= 50 && baseDiscount < 10) {
      baseDiscount = 10;
    }
  } else {
    // Subsequent attempts: Increase based on negotiation
    const remainingDiscount = maxDiscount - previousDiscount;
    
    if (asked !== null && asked > previousDiscount && asked <= maxDiscount) {
      // User asked for specific amount - negotiate towards it
      // Increase by 40-70% of the gap (be generous but not too much)
      const gap = asked - previousDiscount;
      const increasePercent = 0.4 + (Math.random() * 0.3); // 40-70% of gap
      const increaseAmount = Math.floor(gap * increasePercent);
      baseDiscount = Math.min(previousDiscount + increaseAmount, asked);
    } else if (asked !== null && asked > maxDiscount) {
      // User asked for more than max - move towards max
      const gap = maxDiscount - previousDiscount;
      const increasePercent = 0.3 + (Math.random() * 0.3); // 30-60% of remaining gap
      const increaseAmount = Math.floor(gap * increasePercent);
      baseDiscount = Math.min(previousDiscount + increaseAmount, maxDiscount);
    } else {
      // No specific request or user asked for less - increase gradually
      // Increase by 20-35% of remaining discount space
      const increaseMultiplier = 0.2 + (Math.random() * 0.15); // 0.2 to 0.35
      const increaseAmount = Math.floor(remainingDiscount * increaseMultiplier);
      baseDiscount = Math.min(previousDiscount + increaseAmount, maxDiscount);
    }
  }
  
  // ATTEMPT PENALTY: Only apply if user keeps asking after max (rare case)
  const attemptPenalty = attempt > 3 ? Math.min(0.02, (attempt - 3) * 0.005) : 0;
  const penalizedMaxDiscount = Math.max(0, Math.floor(maxDiscount * (1 - attemptPenalty)));

  // FINAL DISCOUNT: 
  // - If user asked for specific amount: Negotiate towards it (up to penalized max)
  // - If no specific request: Use dynamic base discount
  let discountTotal;
  if (asked !== null) {
    // User asked for specific amount
    if (asked <= baseDiscount) {
      // User asked for less than our current offer - give what they asked
      discountTotal = asked;
    } else if (asked <= penalizedMaxDiscount) {
      // User asked for more - negotiate: give between current offer and their request
      // Be generous: give 70-90% of the gap (reward good negotiation)
      const gap = asked - baseDiscount;
      const negotiationPercent = 0.7 + (Math.random() * 0.2); // 70-90% of gap
      const negotiationAmount = Math.floor(gap * negotiationPercent);
      discountTotal = Math.min(baseDiscount + negotiationAmount, asked);
    } else {
      // User asked for more than max - give max
      discountTotal = penalizedMaxDiscount;
    }
  } else {
    // No specific request - use dynamic base discount
    discountTotal = baseDiscount;
  }
  const finalTotal = Math.max(0, originalTotal - discountTotal);

  // ACCEPTED: Did we give them what they asked for?
  const accepted = asked === null ? true : asked <= penalizedMaxDiscount;

  // HAGGLE SCORE: 0-1 scale of how good the deal is
  const haggleScore = clamp(0.1 + discountTotal / Math.max(1, originalTotal), 0.05, 0.95);

  // REASON: Why this discount level?
  let reason = "";
  if (lowStockSkus.length > 0) {
    reason = `Low stock on ${lowStockSkus.map((x) => x.sku).join(", ")} - limited discount.`; 
  } else if (user.tier === "bronze") {
    reason = "Upgrade to Silver (8%) or Gold (12%) tier for higher discounts.";
  } else if (attempt > 3) {
    reason = "Multiple haggle attempts reduce your discount - take this offer!";
  } else {
    reason = `${tierCapPct * 100}% loyalty + ${bundleBonusPct * 100}% bundle bonus applied.`;
  }

  return { originalTotal, finalTotal, discountTotal, accepted, haggleScore, reason };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
