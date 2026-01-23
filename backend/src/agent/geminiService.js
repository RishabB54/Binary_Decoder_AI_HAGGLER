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
 * @param {Array} chatHistory - Previous conversation messages [{role: "user"/"assistant", content: "..."}]
 * @returns {Promise<string>} AI response
 */
export async function chatWithGemini(userMessage, context = {}, chatHistory = []) {
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
    // Build previous deals summary
    const previousDeals = context.previousDeals || [];
    const previousDealsText = previousDeals.length > 0
      ? `\nPREVIOUS DEALS IN THIS SESSION:\n${previousDeals.map((deal, idx) => 
          `${idx + 1}. ${deal.items?.map(i => i.title).join(", ") || "Items"} - ₹${deal.finalTotal || deal.offer?.finalTotal || 0} (discount: ₹${deal.discountTotal || deal.offer?.discountTotal || 0})`
        ).join("\n")}`
      : "";

    // Build product specialty information
    const productInfo = context.productDetails && context.productDetails.length > 0
      ? context.productDetails.map((p, idx) => 
          `Product ${idx + 1}: ${p.name}
  - Brand: ${p.brand}
  - Category: ${p.category}
  - Price: ₹${p.price}
  - Description: ${p.description}
  - Features: ${p.tags.join(", ") || "Premium quality"}
  - Quantity: ${p.quantity}`
        ).join("\n\n")
      : "No product details available";

    // Normal conversation flow - trust Gemini's intelligence!
    systemPrompt = `You're a skilled Flipkart Live bargaining agent in India. You're a professional negotiator who values quality and explains product worth. HAGGLE REALISTICALLY - don't give maximum discount immediately!

PRODUCT DETAILS (EXPLAIN THESE TO JUSTIFY PRICING):
${productInfo}

CURRENT SITUATION:
Cart: ${cartSummary || "empty"}
Original total: ₹${context.originalTotal || 0}
Current discount: ₹${context.currentDiscount || 0} (${currentDiscountPct}%)
Final price: ₹${context.finalPrice || 0}
${quantityChange ? `\n${quantityChange}` : ''}
${previousDealsText}

USER PROFILE:
- Loyalty tier: ${tier.toUpperCase()} (${tierCap}% base discount)
- Bundle bonus: ${bundleBonus > 0 ? `+${bundleBonus}% active` : `+2% available if buying 2+ items`}
- Maximum discount allowed: ${maxDiscountPct}% = ₹${maxDiscountRs}
- Current offer: ${isAccepted ? "✅ ACCEPTED" : "❌ Negotiating"}
${context.reason ? `- Note: ${context.reason}` : ''}
${context.aiBundle ? `- Suggested bundle: ${context.aiBundle} - ${context.bundleReason}` : ''}

CALCULATION FORMULAS (VERIFY YOUR RESPONSES):
1. Maximum Discount = Original Total × (Tier % + Bundle % - Penalties)
   Example: ₹1000 × (5% + 2% - 0%) = ₹70 max discount
2. Final Price = Original Total - Discount Amount
   Example: ₹1000 - ₹70 = ₹930 final price
3. Discount % = (Discount Amount / Original Total) × 100
   Example: (₹70 / ₹1000) × 100 = 7%

HAGGLING STRATEGY (CRITICAL - FOLLOW THIS!):
- NEVER give maximum discount immediately - that's bad business!
- The system gives you a starting discount (random, usually 20-40% of max)
- Your job: Explain product quality and justify the price
- If user negotiates well, the discount will increase automatically
- Explain WHY the product is priced that way:
  * Brand reputation and quality
  * Material and craftsmanship  
  * Features and benefits
  * Market value and demand
- Be persuasive but realistic - you're protecting product value
- Use Indian shopping psychology: "Sir/Madam, yeh premium quality hai..."
- If user negotiates well, acknowledge it and the discount will increase

YOUR ROLE:
1. EXPLAIN PRODUCT SPECIALTY FIRST:
   - Highlight brand reputation
   - Mention quality materials/features
   - Explain why it's worth the price
   - Use product description and tags
   - Justify the current discount amount

2. RESPOND TO NEGOTIATION:
   - Current discount is already calculated (₹${context.currentDiscount || 0})
   - If user asks for more, acknowledge their negotiation
   - Explain why current discount is fair
   - If they persist, hint that you might be able to do better
   - The system will automatically increase discount if they negotiate well
   - Never promise more than ₹${maxDiscountRs} limit

3. BE PERSUASIVE:
   - "Yeh ${context.productDetails?.[0]?.brand || 'premium'} brand hai, quality bahut acchi hai"
   - "Material top-notch hai, isliye price thoda zyada hai"
   - "Aap bulk mein le rahe ho, main thoda aur discount de sakta hoon"
   - "Aapki baat sun raha hoon, dekhte hain kya kar sakte hain"
   - Use Indian shopping culture (friendly but firm)

4. NEGOTIATION DYNAMICS:
   - Current discount: ₹${context.currentDiscount || 0} (already calculated)
   - If user negotiates: Acknowledge and respond naturally
   - System will increase discount based on negotiation quality
   - Don't promise specific amounts - let the system calculate
   - Focus on explaining product value and justifying price

CONSTRAINT:
Maximum discount you can offer: ₹${maxDiscountRs} (${maxDiscountPct}%). Never exceed this. Start lower and negotiate!

User said: "${userMessage}"

Respond as a skilled negotiator - explain product worth, haggle realistically, be persuasive!`;
  }

  try {
    // Build conversation history for multi-turn context
    const contents = [];
    
    // Add system prompt as first message
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt }]
    });
    
    // Add previous conversation history (last 10 messages for context)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      });
    }
    
    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": GEMINI_TEXT_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          maxOutputTokens: 800, // Increased for longer, complete responses
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
  
  const prompt = `You are an intelligent intent parser for an e-commerce bargaining bot. Understand the user's message naturally and extract their intent.

Return a JSON object with these fields:
- baseQuery: Product name they're looking for (e.g., "kurta", "jeans", "shirt") or null if referring to previous product
- quantity: Number of items (default 1)
- wantMatch: true if they want matching/bundle items, false otherwise
- requestedDiscountAmount: Discount amount in rupees they're asking for, or null

UNDERSTAND NATURALLY:
- "show me kurta" → baseQuery: "kurta"
- "i want pants" → baseQuery: "jeans" (understand synonyms naturally)
- "take 4 of those" → quantity: 4, baseQuery: null
- "add matching dupatta" → wantMatch: true
- "give me 200 off" → requestedDiscountAmount: 200
- "i want 200 discount" → requestedDiscountAmount: 200
- "₹100 less" → requestedDiscountAmount: 100

Be smart about:
- Product synonyms (pants=jeans, trousers=jeans, churidar=kurta, etc.)
- Quantity expressions ("4 of those", "take 3", "i want two")
- Discount requests in any format
- Context (if they say "those" or "that", baseQuery is null)

User message: "${message}"

Return ONLY valid JSON, no other text:`;

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
          maxOutputTokens: 200,
          temperature: 0.7, // Higher creativity for better understanding
          topP: 0.9,
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Try to extract JSON - be flexible with whitespace
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`✅ [Gemini] AI extracted intent: ${JSON.stringify(parsed)}`);
        return parsed;
      } catch (parseError) {
        console.error("❌ [Gemini] JSON parse error:", parseError.message);
        console.log("Raw response:", textContent);
      }
    }

    console.log("⚠️  [Gemini] No valid JSON in response, will use fallback");
    return null; // Will fallback to mock NLU
  } catch (error) {
    console.error("❌ [Gemini] Intent extraction failed:", error.message);
    return null; // Fallback to mock NLU
  }
}
