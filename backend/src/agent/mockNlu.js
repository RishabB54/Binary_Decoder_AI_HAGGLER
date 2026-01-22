/**
 * SIMPLE FALLBACK NLU (only used when Gemini API is down)
 * Gemini AI handles the smart parsing - this is just backup!
 */
export function parseIntentMock(message) {
  console.log(`⚠️  [Fallback NLU] Gemini unavailable, using basic parsing for: "${message}"`);
  
  const text = message.trim().toLowerCase();
  
  // Basic matching detection
  const wantMatch =
    text.includes("matching") ||
    text.includes("match") ||
    text.includes("add") ||
    text.includes("bundle");

  // Enhanced discount detection: "250 off", "give me 250off", "₹250 discount", etc.
  const discountPatterns = [
    /(?:give|get|want|need|show)\s+me\s+(\d+)\s*(?:off|discount|rs|rupees?)/i,
    /(\d+)\s*(?:off|discount|rs|rupees?)/i,
    /₹?\s*(\d+)/,
    /give\s+me\s+(\d+)off/i,
    /(\d+)off/i
  ];
  
  let requestedDiscountAmount = null;
  for (const pattern of discountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      requestedDiscountAmount = parseInt(match[1]);
      break;
    }
  }

  // Basic quantity detection (just numbers before product names)
  const numberWords = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };

  let quantity = 1;
  let baseQuery = null;

  // Product list
  const products = ["kurta", "saree", "shirt", "jeans", "hoodie", "shoes", "dupatta", "dress", "top", "blouse"];

  // Check for quantity-only patterns (e.g., "take 4", "4 of those", "i will take 4")
  const quantityOnlyPatterns = [
    /(?:take|get|want|need|will\s+take)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:of\s+those|of\s+them)/i,
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)$/i  // Just a number at end
  ];
  
  for (const pattern of quantityOnlyPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      quantity = numberWords[match[1]] || parseInt(match[1]) || 1;
      // baseQuery stays null - use previous product
      console.log(`📦 [Fallback] Detected quantity-only: ${quantity}`);
      break;
    }
  }
  
  // If no quantity-only match, look for product + quantity or just product
  if (!quantity) {
    for (const product of products) {
      // Try to find "2 kurtas" or "two kurtas"
      const qtyPattern = new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten)\\s+${product}s?`, 'i');
      const qtyMatch = text.match(qtyPattern);
      
      if (qtyMatch) {
        quantity = numberWords[qtyMatch[1]] || parseInt(qtyMatch[1]) || 1;
        baseQuery = product;
        break;
      } else if (text.includes(product)) {
        baseQuery = product;
        quantity = 1;
        break;
      }
    }
  }

  console.log(`📦 [Fallback] Extracted: product="${baseQuery}", qty=${quantity}, match=${wantMatch}`);

  return { baseQuery, quantity, wantMatch, requestedDiscountAmount };
}
