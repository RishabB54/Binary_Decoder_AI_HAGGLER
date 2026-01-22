export function parseIntentMock(message) {
  const text = message.trim().toLowerCase();

  const wantMatch =
    text.includes("matching") ||
    text.includes("match") ||
    text.includes("dupatta") ||
    text.includes("combo") ||
    text.includes("bundle");

  const rupeeMatch = text.match(/₹\s*(\d+)/) || text.match(/(\d+)\s*rs/) || text.match(/(\d+)\s*rupees/);
  const requestedDiscountAmount = rupeeMatch ? Number(rupeeMatch[1]) : null;

  let baseQuery = null;
  const showMatch = text.match(/show\s+([a-z\s]+)/);
  if (showMatch && showMatch[1]) {
    baseQuery = showMatch[1].trim();
  } else {
    const wants = ["kurta", "saree", "shirt", "jeans", "hoodie", "shoes", "dupatta", "dress", "top"];
    for (const w of wants) {
      if (text.includes(w)) {
        baseQuery = w;
        break;
      }
    }
  }

  return { baseQuery, wantMatch, requestedDiscountAmount };
}
