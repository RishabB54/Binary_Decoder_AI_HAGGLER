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
  
  const systemPrompt = `You are a friendly bargaining concierge for Flipkart Live in India. 
You help customers negotiate bundle deals on ethnic wear and fashion items.
Be conversational, persuasive, and culturally aware of Indian shopping preferences.

Current Context:
- User tier: ${context.userTier || "bronze"}
- Selected product: ${context.selectedProduct || "none"}
- Bundle items: ${context.bundleCount || 0}
- Current discount: ₹${context.currentDiscount || 0}

Guidelines:
- Always mention prices in rupees (₹)
- Suggest bundle deals to increase discounts
- Explain loyalty benefits
- Be friendly but firm on pricing limits
- Acknowledge when deals are good

Keep responses brief and conversational (2-3 sentences max).`;

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
          maxOutputTokens: 200,
          temperature: 0.7,
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
  
  const prompt = `Extract bargaining intent from this message. Return JSON only:
{
  "baseQuery": "product name if mentioned, else null",
  "wantMatch": true/false (if asking for matching/bundle item),
  "requestedDiscountAmount": number or null (if asking for specific discount in rupees),
  "requestedDiscountPercent": number or null (if asking for percentage discount),
  "sentiment": "eager/casual/frustrated"
}

User message: "${message}"

JSON:`;

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
      return JSON.parse(jsonMatch[0]);
    }

    return null; // Will fallback to mock NLU
  } catch (error) {
    console.error("Intent extraction failed:", error);
    return null; // Fallback to mock NLU
  }
}
