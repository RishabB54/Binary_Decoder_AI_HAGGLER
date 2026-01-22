/**
 * AI-Powered Bundle Suggestions
 * Uses Gemini to intelligently suggest bundles from actual catalog
 */

import { loadCatalog } from "../store/catalogStore.js";
import { loadInventory } from "../store/inventoryStore.js";

const GEMINI_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";
const GEMINI_TEXT_API_KEY = process.env.GEMINI_TEXT_API_KEY;

/**
 * Get AI-powered bundle suggestions based on user context
 * @param {Object} params - User context and preferences
 * @returns {Promise<Array>} Smart bundle suggestions
 */
export async function getSmartBundleSuggestions({ 
  userMessage, 
  selectedProduct = null,
  userTier = "bronze",
  occasion = null 
}) {
  
  if (!GEMINI_TEXT_API_KEY) {
    console.log("⚠️  [SmartBundle] No API key, using fallback");
    return getFallbackBundles(selectedProduct);
  }

  try {
    const catalog = await loadCatalog();
    const inventory = loadInventory();
    
    // Add stock info to products
    const availableProducts = catalog.items.map(p => ({
      sku: p.sku,
      title: p.title,
      category: p.category,
      price: p.price,
      tags: p.tags,
      stock: inventory.stockBySku[p.sku] || 0,
      available: (inventory.stockBySku[p.sku] || 0) > 0
    })).filter(p => p.available);

    console.log("🤖 [SmartBundle] Asking Gemini for bundle suggestions...");

    const prompt = `You are a fashion expert for an Indian e-commerce platform. 
Based on the user's request and available products, suggest intelligent product bundles.

USER REQUEST: "${userMessage}"
USER TIER: ${userTier} (bronze=5%, silver=8%, gold=12% base discount)
${selectedProduct ? `SELECTED PRODUCT: ${selectedProduct.title} (${selectedProduct.category})` : ''}
${occasion ? `OCCASION: ${occasion}` : ''}

AVAILABLE PRODUCTS:
${JSON.stringify(availableProducts, null, 2)}

TASK:
1. Analyze the user's request and suggest 2-3 smart bundles
2. ONLY use products from the AVAILABLE PRODUCTS list above
3. Consider color coordination, style matching, and occasion appropriateness
4. Prioritize in-stock items (higher stock = better)
5. Create bundles of 2-4 items that make sense together

Return ONLY valid JSON (no markdown, no extra text):
{
  "bundles": [
    {
      "name": "Bundle name (e.g., 'Complete Ethnic Look')",
      "reason": "Why this bundle makes sense",
      "items": ["SKU1", "SKU2", "SKU3"],
      "occasion": "wedding|casual|office|festive",
      "totalPrice": 0,
      "recommendedDiscount": 15,
      "priority": 10
    }
  ]
}

Rules:
- Each bundle must have 2-4 items
- All SKUs MUST exist in the available products
- Total price = sum of item prices
- Recommended discount: 12-18% for bundles
- Priority: 1-10 (10 = best match)
- Return valid JSON only`;

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
          maxOutputTokens: 1000,
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
      console.error("❌ [SmartBundle] API Error:", response.status);
      return getFallbackBundles(selectedProduct);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ [SmartBundle] No JSON in response");
      return getFallbackBundles(selectedProduct);
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    
    // Validate and enrich bundles with actual product data
    const validBundles = await validateAndEnrichBundles(suggestions.bundles, catalog);
    
    console.log("✅ [SmartBundle] Generated", validBundles.length, "smart bundles");
    
    return validBundles;

  } catch (error) {
    console.error("❌ [SmartBundle] Error:", error);
    return getFallbackBundles(selectedProduct);
  }
}

/**
 * Validate bundle SKUs exist and enrich with product details
 */
async function validateAndEnrichBundles(bundles, catalog) {
  if (!bundles || !Array.isArray(bundles)) return [];

  return bundles
    .map(bundle => {
      // Get actual product objects
      const items = bundle.items
        .map(sku => catalog.items.find(p => p.sku === sku))
        .filter(Boolean); // Remove invalid SKUs

      if (items.length < 2) return null; // Need at least 2 items

      // Calculate actual total
      const actualTotal = items.reduce((sum, p) => sum + p.price, 0);

      return {
        ...bundle,
        items: items, // Full product objects
        itemCount: items.length,
        totalPrice: actualTotal,
        validated: true
      };
    })
    .filter(Boolean) // Remove invalid bundles
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority
}

/**
 * Fallback bundle suggestions if AI fails
 */
function getFallbackBundles(selectedProduct) {
  if (!selectedProduct) return [];

  // Simple rule-based fallback
  const bundles = [];

  if (selectedProduct.category === "kurta") {
    bundles.push({
      name: "Complete Ethnic Look",
      reason: "Classic kurta and dupatta combination",
      items: [selectedProduct],
      occasion: "ethnic",
      totalPrice: selectedProduct.price,
      recommendedDiscount: 14,
      priority: 8,
      validated: false
    });
  }

  return bundles;
}

/**
 * Detect occasion from user message
 */
export function detectOccasion(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes("wedding") || msg.includes("marriage")) return "wedding";
  if (msg.includes("office") || msg.includes("work") || msg.includes("formal")) return "office";
  if (msg.includes("party") || msg.includes("celebration")) return "party";
  if (msg.includes("festive") || msg.includes("festival") || msg.includes("diwali")) return "festive";
  if (msg.includes("casual") || msg.includes("weekend")) return "casual";
  
  return null;
}
