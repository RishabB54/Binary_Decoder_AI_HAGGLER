/**
 * MINIMAL FALLBACK NLU (only used when Gemini API is completely down)
 * This is just a safety net - Gemini handles all the intelligence!
 */
export function parseIntentMock(message) {
  console.log(`⚠️  [Fallback NLU] Gemini unavailable, using minimal parsing for: "${message}"`);
  
  const text = message.trim().toLowerCase();
  
  // Minimal detection - just enough to not crash
  const wantMatch = text.includes("matching") || text.includes("add");
  
  // Very basic discount detection
  const discountMatch = text.match(/(\d+)\s*(?:off|discount)/i);
  const requestedDiscountAmount = discountMatch ? parseInt(discountMatch[1]) : null;
  
  // Very basic quantity detection
  const qtyMatch = text.match(/(\d+)/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
  
  // Very basic product detection
  const products = ["kurta", "saree", "shirt", "jeans", "shoes", "dupatta", "blouse", "pants"];
  const baseQuery = products.find(p => text.includes(p)) || null;

  console.log(`📦 [Fallback] Minimal extraction: product="${baseQuery}", qty=${quantity}, discount=${requestedDiscountAmount}`);

  return { baseQuery, quantity, wantMatch, requestedDiscountAmount };
}
