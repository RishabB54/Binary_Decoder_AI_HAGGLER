import { loadInventory } from "../store/inventoryStore.js";

export function computeOffer({ user, items, userAskedDiscount, attempt }) {
  const originalTotal = items.reduce((s, p) => s + p.price, 0);

  const tierCapPct = user.tier === "gold" ? 0.12 : user.tier === "silver" ? 0.08 : 0.05;
  const bundleBonusPct = items.length >= 2 ? 0.02 : 0;

  const inventory = loadInventory();
  const lowStockSkus = items
    .map((p) => ({ sku: p.sku, stock: inventory.stockBySku[p.sku] ?? 0 }))
    .filter((x) => x.stock > 0 && x.stock <= 3);

  const scarcityPenaltyPct = lowStockSkus.length > 0 ? 0.03 : 0;

  const maxDiscountPct = Math.max(0, tierCapPct + bundleBonusPct - scarcityPenaltyPct);
  const maxDiscount = Math.floor(originalTotal * maxDiscountPct);

  const asked = typeof userAskedDiscount === "number" ? userAskedDiscount : null;

  const attemptPenalty = Math.min(0.02, (attempt || 0) * 0.005);
  const penalizedMaxDiscount = Math.max(0, Math.floor(maxDiscount * (1 - attemptPenalty)));

  const discountTotal = asked === null ? Math.min(80, penalizedMaxDiscount) : Math.min(asked, penalizedMaxDiscount);
  const finalTotal = Math.max(0, originalTotal - discountTotal);

  const accepted = asked === null ? true : asked <= penalizedMaxDiscount;

  const haggleScore = clamp(0.1 + discountTotal / Math.max(1, originalTotal), 0.05, 0.95);

  let reason = "";
  if (lowStockSkus.length > 0) {
    reason = `Low stock on ${lowStockSkus.map((x) => x.sku).join(", ")}.`; 
  } else if (user.tier === "bronze") {
    reason = "Upgrade tier for higher discounts.";
  } else {
    reason = "Bundle + loyalty discount applied.";
  }

  return { originalTotal, finalTotal, discountTotal, accepted, haggleScore, reason };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
