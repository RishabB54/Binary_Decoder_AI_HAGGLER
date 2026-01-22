/**
 * Gemini 2.5 Flash API Service (Text-Only)
 * Handles text-based chat and intent extraction for bargaining
 * 
 * Team: binarydecoders
 * Hackday 13
 */

const GEMINI_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";

// Load API keys from environment variables
const GEMINI_TEXT_API_KEY = process.env.GEMINI_TEXT_API_KEY;
const GEMINI_IMAGE_API_KEY = process.env.GEMINI_IMAGE_API_KEY;

// Validate API keys on startup
if (!GEMINI_TEXT_API_KEY) {
  console.warn("⚠️  [Gemini] WARNING: GEMINI_TEXT_API_KEY not set in environment!");
  console.warn("⚠️  [Gemini] Create a .env file with your API keys (see .env.example)");
  console.warn("⚠️  [Gemini] Bot will use fallback mode (no AI responses)");
}

// Log configuration on startup (without exposing keys)
console.log("🔧 [Gemini] Service initialized");
console.log("🔧 [Gemini] API URL:", GEMINI_API_URL);
console.log("🔧 [Gemini] Text API Key:", GEMINI_TEXT_API_KEY ? "✅ Configured" : "❌ Missing");
console.log("🔧 [Gemini] Image API Key:", GEMINI_IMAGE_API_KEY ? "✅ Configured" : "⚠️  Optional");

/**
 * Enhanced chat for bargaining with better context understanding
 * @param {string} userMessage - User's message
 * @param {Object} context - Current shopping context
 * @returns {Promise<string>} AI response
 */
export async function chatWithGemini(userMessage, context = {}) {
  console.log("🤖 [Gemini] Calling API with message:", userMessage);
  
  // Check if API key is available
  if (!GEMINI_TEXT_API_KEY) {
    console.log("⚠️  [Gemini] No API key available, skipping AI call");
    return null; // Will use fallback
  }
  
  // Calculate real constraints based on policy.js
  const tier = context.userTier || "bronze";
  const tierCap = tier === "gold" ? 12 : tier === "silver" ? 8 : 5;
  const bundleBonus = (context.bundleCount || 0) >= 2 ? 2 : 0;
  const maxDiscountPct = tierCap + bundleBonus;
  const currentDiscountPct = context.discountPercent || 0;
  const isAccepted = context.accepted !== false; // true if null or true
  
  // Calculate max discount
  const maxDiscountRs = Math.floor((context.originalTotal || 0) * maxDiscountPct / 100);
  
  // Build cart summary for context
  const cartSummary = context.cartItems && context.cartItems.length > 0
    ? context.cartItems.map(item => `${item.name} × ${item.quantity} (₹${item.subtotal})`).join(", ")
    : "empty";
  
  const quantityChange = context.currentQuantity && context.previousQuantity && context.currentQuantity !== context.previousQuantity
    ? `Quantity changed: ${context.previousQuantity} → ${context.currentQuantity}`
    : "";

  // Handle product not found scenario
  const isProductNotFound = context.requestedProduct && context.requestedProduct !== "unknown" && !context.selectedProduct;
  
  // Pass FULL context - let Gemini be smart!
  let systemPrompt;
  
  if (isProductNotFound) {
    // Product not found - let AI suggest alternatives intelligently
    systemPrompt = `You're a Flipkart Live bargaining agent. User asked for "${context.requestedProduct}" which we don't have.

AVAILABLE PRODUCTS:
${context.availableProducts || "kurta, saree, shirt, jeans, shoes, dupatta, blouse"}

YOUR JOB:
- Be helpful and friendly
- Suggest similar/alternative products intelligently
- Examples:
  * "pants" → "I don't have pants, but I have jeans! Try 'show jeans'"
  * "trousers" → "We have jeans instead! Say 'show jeans'"
  * "dress" → "We have sarees and kurtas! Try 'show saree' or 'show kurta'"
- Make it natural and helpful
- 2-3 sentences, friendly tone

User asked: "${userMessage}"

Respond helpfully:`;
  } else {
    // Normal conversation flow
    systemPrompt = `You're a Flipkart Live bargaining agent in India. Understand context and respond intelligently.

CURRENT CART:
${cartSummary}
Total: ₹${context.originalTotal || 0}
Discount: ₹${context.currentDiscount || 0} (${currentDiscountPct}%)
Final: ₹${context.finalPrice || 0}
${quantityChange ? `\n${quantityChange}` : ''}

USER PROFILE:
- Tier: ${tier.toUpperCase()} (${tierCap}% base discount)
- Bundle bonus: ${bundleBonus > 0 ? `+${bundleBonus}% active (2+ items)` : `+2% if 2+ items`}
- Maximum discount: ${maxDiscountPct}% = ₹${maxDiscountRs}
- Offer status: ${isAccepted ? "✅ ACCEPTED" : "❌ REJECTED"}
${context.reason ? `- Note: ${context.reason}` : ''}
${context.aiBundle ? `- AI Bundle: ${context.aiBundle} - ${context.bundleReason}` : ''}

UNDERSTAND NATURALLY:
- "show me kurta" → Product browsing, show product
- "i will take 4 of those" → Quantity update! Acknowledge 4 items now in cart
- "add matching dupatta" → Bundle request, suggest matching
- "give me 250 off" → Discount negotiation, check if within ₹${maxDiscountRs} limit
- "take 3" / "3 of those" → Quantity update to 3

RESPOND SMARTLY:
- If quantity changed, acknowledge it: "Perfect! You now have ${context.currentQuantity || 1} × ${context.selectedProduct || 'items'} in your cart!"
- If discount requested, negotiate within limits (max ₹${maxDiscountRs})
- If bundle requested, suggest matching items
- If offer rejected, explain limits and suggest alternatives (add items, upgrade tier)
- If offer accepted, be enthusiastic about savings
- Always complete your sentences fully - never cut off mid-thought!

CONSTRAINTS:
- NEVER offer discount > ₹${maxDiscountRs} (${maxDiscountPct}%)
- Be friendly, persuasive, culturally aware (Indian shopping)
- 2-3 sentences, natural and conversational

User: "${userMessage}"

Respond naturally:`;
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": GEMINI_TEXT_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemPrompt + "\n\nUser: " + userMessage
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.8,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Gemini] API Error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't understand that. Can you rephrase?";
    console.log("✅ [Gemini] API Success! Response:", aiResponse.substring(0, 100) + "...");
    return aiResponse;
  } catch (error) {
    console.error("❌ [Gemini] Chat failed:", error.message);
    console.error("❌ [Gemini] Full error:", error);
    return null; // Will fallback to default logic
  }
}

/**
 * Extract intent from user's message using Gemini
 * Better than the mock NLU, understands natural language negotiation
 * @param {string} message - User message
 * @returns {Promise<Object>} Extracted intent
 */
export async function extractIntent(message) {
  // Check if API key is available
  if (!GEMINI_TEXT_API_KEY) {
    console.log("⚠️  [Gemini] No API key for intent extraction, using fallback");
    return null; // Will use mock NLU
  }
  
  const prompt = `Extract user intent from message. Understand context naturally.

EXAMPLES:
{"baseQuery": "kurta", "quantity": 1, "wantMatch": false, "requestedDiscountAmount": null}
{"baseQuery": "jeans", "quantity": 1, "wantMatch": false, "requestedDiscountAmount": null}  // "pants" → "jeans"
{"baseQuery": "kurta", "quantity": 2, "wantMatch": false, "requestedDiscountAmount": null}
{"baseQuery": null, "quantity": 4, "wantMatch": false, "requestedDiscountAmount": null}  // "i will take 4 of those"
{"baseQuery": null, "quantity": 1, "wantMatch": true, "requestedDiscountAmount": null}  // "add matching dupatta"
{"baseQuery": null, "quantity": 1, "wantMatch": false, "requestedDiscountAmount": 250}  // "give me 250 off"

UNDERSTAND NATURALLY:
- "4 of those" / "take 4" / "i want 4" → quantity: 4, baseQuery: null (use previous product)
- "show kurta" → baseQuery: "kurta", quantity: 1
- "i want pants" → baseQuery: "jeans" (pants = jeans)
- "add matching dupatta" → wantMatch: true
- "give me 250 off" → requestedDiscountAmount: 250

PRODUCT SYNONYMS:
- pants/trousers → jeans
- churidar/salwar → kurta
- dress/gown → saree
- footwear/sneakers → shoes
- top/tshirt → shirt

AVAILABLE PRODUCTS: kurta, saree, shirt, jeans, shoes, dupatta, blouse

User: "${message}"

Return JSON only:`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": GEMINI_TEXT_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.2,
          topP: 0.4,
          topK: 16
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`✅ [Gemini] AI extracted intent: ${JSON.stringify(parsed)}`);
      return parsed;
    }

    console.log("⚠️  [Gemini] No valid JSON in response, will use fallback");
    return null; // Will fallback to mock NLU
  } catch (error) {
    console.error("❌ [Gemini] Intent extraction failed:", error.message);
    return null; // Fallback to mock NLU
  }
}
