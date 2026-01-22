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

export function computeOffer({ user, items, userAskedDiscount, attempt }) {
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

  // ATTEMPT PENALTY: Reduce discount for excessive haggling
  // Each attempt reduces max by 0.5%, up to 2% total
  const attemptPenalty = Math.min(0.02, (attempt || 0) * 0.005);
  const penalizedMaxDiscount = Math.max(0, Math.floor(maxDiscount * (1 - attemptPenalty)));

  // FINAL DISCOUNT: Either what they asked (if reasonable) or our max
  // No hard cap - discount scales with cart value
  const discountTotal = asked === null ? penalizedMaxDiscount : Math.min(asked, penalizedMaxDiscount);
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
