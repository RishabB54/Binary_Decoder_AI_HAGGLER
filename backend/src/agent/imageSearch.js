/**
 * Image Search Service
 * Uses Gemini Image API to search products by uploaded images
 */

import { loadCatalog } from "../store/catalogStore.js";
import { searchCatalog } from "./tools.js";

const GEMINI_IMAGE_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";
const GEMINI_IMAGE_API_KEY = process.env.GEMINI_IMAGE_API_KEY;

/**
 * Analyze uploaded image to extract product features
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<Object>} Image analysis results
 */
export async function analyzeUploadedImage(imageBuffer, mimeType = 'image/jpeg') {
  if (!GEMINI_IMAGE_API_KEY) {
    console.log("⚠️  [Image Search] Image API key not configured");
    return null;
  }

  console.log("🖼️  [Image Search] Analyzing uploaded image...");
  console.log(`📏 [Image Search] Image size: ${imageBuffer.length} bytes (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Check image size limit (Gemini typically supports up to 20MB, but let's be safe)
  const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  if (imageBuffer.length > MAX_IMAGE_SIZE) {
    console.error(`❌ [Image Search] Image too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB (max: 20MB)`);
    return null;
  }

  // Convert buffer to base64
  const base64Image = imageBuffer.toString('base64');
  console.log(`📦 [Image Search] Base64 length: ${base64Image.length} characters`);

  const prompt = `Analyze this product image and extract key features for product search. Return JSON only.

Extract:
- category: Product category (kurta, jeans, shirt, saree, shoes, dupatta, blouse, accessories)
- material: Material/fabric type (cotton, silk, leather, synthetic, etc.)
- pattern: Pattern type (solid, printed, striped, embroidered, etc.)
- colors: Array of main colors visible (e.g., ["blue", "white"])
- style: Style type (casual, formal, ethnic, sporty, etc.)
- description: Brief description of what you see
- keywords: Array of search keywords (e.g., ["blue", "cotton", "kurta", "printed"])

Return JSON format:
{
  "category": "kurta",
  "material": "cotton",
  "pattern": "printed",
  "colors": ["blue", "white"],
  "style": "ethnic",
  "description": "Blue printed cotton kurta",
  "keywords": ["blue", "cotton", "kurta", "printed", "ethnic"]
}`;

  // Build request payload - matching official Gemini API format
  // Format: https://ai.google.dev/gemini-api/docs/images
  const requestPayload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          },
          {
            inline_data: {
              mime_type: mimeType, // e.g., "image/jpeg", "image/png"
              data: base64Image // base64 encoded image string
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
      // NOTE: "thinkingConfig" is NOT allowed for Gemini 2.5 Flash
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
  };

  console.log(`🌐 [Image Search] API URL: ${GEMINI_IMAGE_API_URL}`);
  console.log(`🔑 [Image Search] API Key: ${GEMINI_IMAGE_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`📋 [Image Search] Request payload size: ${JSON.stringify(requestPayload).length} chars`);
  console.log(`📋 [Image Search] Image data size: ${base64Image.length} chars`);

  try {
    const response = await fetch(GEMINI_IMAGE_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": GEMINI_IMAGE_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Image Search] API Error (${response.status}):`, errorText);
      
      // Try to parse error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error("❌ [Image Search] Error details:", JSON.stringify(errorJson, null, 2));
        
        // Check for specific error types
        if (errorJson.message?.includes("size") || errorJson.message?.includes("too large")) {
          console.error("💡 [Image Search] Image might be too large. Try compressing the image.");
        }
        if (errorJson.message?.includes("format") || errorJson.message?.includes("invalid")) {
          console.error("💡 [Image Search] Image format might not be supported. Try JPEG or PNG.");
        }
      } catch (e) {
        // Error text is not JSON, that's fine
      }
      
      return null;
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    console.log("📝 [Image Search] Raw Gemini response:", textContent.substring(0, 200));

    // Extract JSON from response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log("✅ [Image Search] Analysis complete:", JSON.stringify(analysis, null, 2));
        
        // Validate required fields
        if (!analysis.category && !analysis.keywords && !analysis.description) {
          console.log("⚠️  [Image Search] Analysis missing key fields, but proceeding anyway");
        }
        
        return analysis;
      } catch (parseError) {
        console.error("❌ [Image Search] JSON parse error:", parseError.message);
        console.log("📝 [Image Search] Failed to parse:", jsonMatch[0].substring(0, 200));
        return null;
      }
    }

    console.log("⚠️  [Image Search] No valid JSON in response");
    console.log("📝 [Image Search] Full response:", textContent);
    return null;
  } catch (error) {
    console.error("❌ [Image Search] Analysis failed:", error.message);
    return null;
  }
}

/**
 * Search products by uploaded image
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Array>} Matching products
 */
export async function searchByImage(imageBuffer, mimeType = 'image/jpeg') {
  console.log("🔍 [Image Search] Starting visual search...");

  // Step 1: Analyze uploaded image
  const analysis = await analyzeUploadedImage(imageBuffer, mimeType);
  
  if (!analysis) {
    console.log("⚠️  [Image Search] Image analysis failed - Gemini API returned 500 error");
    console.log("💡 [Image Search] This might be an API issue. Falling back to catalog search...");
    
    // FALLBACK: Return top products from catalog as a workaround
    // This allows users to still see products even if image analysis fails
    const catalog = await loadCatalog();
    console.log(`📦 [Image Search] Fallback: Returning top ${Math.min(10, catalog.items.length)} products from catalog`);
    
    return catalog.items.slice(0, 10).map(p => ({
      ...p,
      matchScore: 1,
      imageAnalysis: {
        note: "Image analysis unavailable - showing catalog products",
        fallback: true
      }
    }));
  }

  console.log("📊 [Image Search] Image analysis:", JSON.stringify(analysis, null, 2));

  // Step 2: Build search query from analysis
  const searchTerms = [];
  
  // Prioritize category
  if (analysis.category) {
    searchTerms.push(analysis.category);
  }
  
  // Add colors
  if (analysis.colors && Array.isArray(analysis.colors)) {
    searchTerms.push(...analysis.colors.slice(0, 2)); // Top 2 colors
  }
  
  // Add material if relevant
  if (analysis.material && ['cotton', 'silk', 'leather'].includes(analysis.material.toLowerCase())) {
    searchTerms.push(analysis.material);
  }
  
  // Add pattern if relevant
  if (analysis.pattern && ['printed', 'solid', 'striped'].includes(analysis.pattern.toLowerCase())) {
    searchTerms.push(analysis.pattern);
  }

  // Use keywords if available
  const searchQuery = analysis.keywords && analysis.keywords.length > 0
    ? analysis.keywords.join(" ")
    : searchTerms.join(" ");

  console.log(`🔍 [Image Search] Search query: "${searchQuery}"`);

  // Step 3: Search catalog with extracted features
  // Uses CSV dataset if available (myntra_products_catalog.csv), falls back to JSON
  const catalog = await loadCatalog();
  console.log(`📦 [Image Search] Catalog source: ${catalog.source || 'unknown'}, Total products: ${catalog.items?.length || 0}`);
  console.log(`📦 [Image Search] Searching CSV dataset: ${catalog.source === 'csv' ? '✅ YES' : '❌ NO (using JSON fallback)'}`);
  
  // Search catalog - this already filters and ranks
  const allResults = await searchCatalog(searchQuery);
  console.log(`📦 [Image Search] searchCatalog returned ${allResults.length} products`);

  // If searchCatalog found products, use them (it already did filtering)
  if (allResults.length === 0) {
    console.log("⚠️  [Image Search] searchCatalog returned 0 results, trying broader search...");
    // Try searching just by category
    if (analysis.category) {
      const categoryResults = await searchCatalog(analysis.category);
      console.log(`📦 [Image Search] Category-only search returned ${categoryResults.length} products`);
      if (categoryResults.length > 0) {
        return categoryResults.slice(0, 10).map(p => ({
          ...p,
          matchScore: 30, // Base score for category match
          imageAnalysis: analysis
        }));
      }
    }
    
    // Last resort: return first 10 products from catalog
    console.log("⚠️  [Image Search] No matches found, returning top catalog products");
    return catalog.items.slice(0, 10).map(p => ({
      ...p,
      matchScore: 5, // Low score but still showing results
      imageAnalysis: analysis
    }));
  }

  // Step 4: Score and rank results based on visual similarity
  // But be lenient - don't filter out everything
  const scoredResults = allResults.map(product => {
    let score = 10; // Base score - give all products a chance

    // Category match (highest priority)
    if (analysis.category) {
      const productCategory = (product.category || "").toLowerCase();
      const analysisCategory = analysis.category.toLowerCase();
      if (productCategory === analysisCategory) {
        score += 50; // Exact match
      } else if (productCategory.includes(analysisCategory) || analysisCategory.includes(productCategory)) {
        score += 30; // Partial match
      }
    }

    // Color match
    if (analysis.colors && Array.isArray(analysis.colors)) {
      const productText = `${product.title} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
      analysis.colors.forEach(color => {
        if (productText.includes(color.toLowerCase())) {
          score += 10;
        }
      });
    }

    // Material match
    if (analysis.material) {
      const productText = `${product.title} ${product.description || ""}`.toLowerCase();
      if (productText.includes(analysis.material.toLowerCase())) {
        score += 15;
      }
    }

    // Pattern match
    if (analysis.pattern) {
      const productText = `${product.title} ${product.description || ""}`.toLowerCase();
      if (productText.includes(analysis.pattern.toLowerCase())) {
        score += 10;
      }
    }

    // Style match
    if (analysis.style) {
      const productText = `${product.title} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
      if (productText.includes(analysis.style.toLowerCase())) {
        score += 5;
      }
    }

    // Keywords match (if available)
    if (analysis.keywords && Array.isArray(analysis.keywords)) {
      const productText = `${product.title} ${product.description || ""} ${(product.tags || []).join(" ")}`.toLowerCase();
      analysis.keywords.forEach(keyword => {
        if (productText.includes(keyword.toLowerCase())) {
          score += 3;
        }
      });
    }

    return { product, score, analysis };
  })
  .sort((a, b) => b.score - a.score) // Sort by score (highest first)
  .map(item => ({
    ...item.product,
    matchScore: item.score,
    imageAnalysis: item.analysis // Include analysis for reference
  }));

  console.log(`✅ [Image Search] Found ${scoredResults.length} visually similar products`);
  if (scoredResults.length > 0) {
    console.log(`📊 [Image Search] Top match: ${scoredResults[0].title} (score: ${scoredResults[0].matchScore})`);
  }

  return scoredResults.slice(0, 10); // Return top 10 matches
}
