/**
 * Gemini 2.5 Flash Image API Service
 * Analyzes product images to extract features, materials, and quality indicators
 * 
 * Team: binarydecoders
 * Hackday 13
 */

const GEMINI_IMAGE_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";
const GEMINI_IMAGE_API_KEY = process.env.GEMINI_IMAGE_API_KEY;

/**
 * Analyze product image to extract features
 * @param {string} imageUrl - URL of product image
 * @param {Object} productInfo - Product information (title, brand, etc.)
 * @returns {Promise<Object>} Image analysis results
 */
export async function analyzeProductImage(imageUrl, productInfo = {}) {
  if (!GEMINI_IMAGE_API_KEY) {
    console.log("⚠️  [Image] Image API key not configured, skipping image analysis");
    return null;
  }

  if (!imageUrl || imageUrl.includes("placeholder")) {
    console.log("⚠️  [Image] No valid image URL provided");
    return null;
  }

  console.log(`🖼️  [Image] Analyzing image: ${imageUrl}`);

  const prompt = `Analyze this product image and extract key features. Return JSON only.

Product: ${productInfo.title || "Product"}
Brand: ${productInfo.brand || "Unknown"}
Category: ${productInfo.category || "clothing"}

Extract:
- material: Fabric/material type (cotton, silk, leather, synthetic, etc.)
- pattern: Pattern type (solid, printed, striped, embroidered, etc.)
- colors: Array of main colors visible
- quality: Quality assessment (basic, good, premium, luxury)
- style: Style type (casual, formal, ethnic, sporty, etc.)
- features: Array of notable features (embroidery, buttons, zippers, etc.)

Return JSON format:
{
  "material": "cotton",
  "pattern": "printed",
  "colors": ["blue", "white"],
  "quality": "premium",
  "style": "casual",
  "features": ["embroidered", "button closure"]
}`;

  try {
    const response = await fetch(GEMINI_IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": GEMINI_IMAGE_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: await imageUrlToBase64(imageUrl)
                }
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.3,
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
      console.error("❌ [Image] API Error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log("✅ [Image] Analysis complete:", analysis);
      return analysis;
    }

    console.log("⚠️  [Image] No valid JSON in response");
    return null;
  } catch (error) {
    console.error("❌ [Image] Analysis failed:", error.message);
    return null;
  }
}

/**
 * Convert image URL to base64 (for API)
 * Note: This is a placeholder - you may need to fetch the image first
 */
async function imageUrlToBase64(imageUrl) {
  // For now, return empty - you'll need to fetch image and convert
  // Or use image URL directly if API supports it
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return base64;
  } catch (error) {
    console.error("❌ [Image] Failed to fetch image:", error.message);
    return "";
  }
}

/**
 * Construct Myntra product image URL from ProductID
 * @param {string} productId - Product ID from CSV
 * @param {number} imageIndex - Image index (1-based)
 * @returns {string} Image URL
 */
export function constructMyntraImageUrl(productId, imageIndex = 1) {
  // Myntra image URL pattern (example - adjust based on actual pattern)
  // Common patterns:
  // - https://assets.myntra.com/images/${productId}/image${imageIndex}.jpg
  // - https://images.myntra.com/${productId}/image${imageIndex}.jpg
  // - Or use ProductID directly
  
  // For now, return placeholder - you'll need to find actual Myntra URL pattern
  return `https://assets.myntra.com/images/${productId}/image${imageIndex}.jpg`;
}

/**
 * Batch analyze multiple product images
 * @param {Array} products - Array of products with image URLs
 * @returns {Promise<Array>} Products with image analysis
 */
export async function batchAnalyzeImages(products) {
  const results = [];
  
  for (const product of products.slice(0, 10)) { // Limit to 10 for now
    if (product.image && !product.image.includes("placeholder")) {
      const analysis = await analyzeProductImage(product.image, {
        title: product.title,
        brand: product.brand,
        category: product.category
      });
      
      if (analysis) {
        product.imageAnalysis = analysis;
      }
    }
    
    results.push(product);
  }
  
  return results;
}
