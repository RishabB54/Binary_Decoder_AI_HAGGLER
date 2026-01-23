import { loadCatalog } from "../store/catalogStore.js";

/**
 * Search catalog intelligently
 * Trusts Gemini's intent extraction - no hardcoded synonym mapping
 * Searches across all product fields naturally
 */
export async function searchCatalog(query) {
  const catalog = await loadCatalog();
  const needle = String(query || "").toLowerCase().trim();
  
  if (!needle) {
    return catalog.items.slice(0, 10);
  }
  
  // Intelligent search with priority: exact category > category contains > title > tags > description
  // Common category names - prioritize exact matches
  const categoryNames = ["shoes", "jeans", "kurta", "shirt", "saree", "dupatta", "blouse", "accessories"];
  const isCategoryQuery = categoryNames.includes(needle);
  
  const results = catalog.items.map((p) => {
    const categoryLower = p.category?.toLowerCase() || "";
    const titleLower = p.title?.toLowerCase() || "";
    
    // Exact category match (most important)
    const exactCategoryMatch = categoryLower === needle;
    // Category contains query
    const categoryContains = categoryLower.includes(needle);
    // Title contains query
    const titleMatch = titleLower.includes(needle);
    // Brand match
    const brandMatch = p.brand?.toLowerCase().includes(needle);
    // Tags match
    const tagsMatch = (p.tags || []).some(tag => tag.toLowerCase().includes(needle));
    // Description match (lowest priority)
    const descMatch = p.description?.toLowerCase().includes(needle);
    
    // Calculate relevance score (higher = better match)
    let score = 0;
    if (exactCategoryMatch) score += 100; // Exact category match is most important
    else if (categoryContains) score += 50; // Category contains is second
    else if (titleMatch) score += 20;
    else if (brandMatch) score += 10;
    else if (tagsMatch) score += 5;
    else if (descMatch) score += 1;
    
    // If query is a category name, heavily penalize non-category matches
    if (isCategoryQuery && !categoryContains && !exactCategoryMatch) {
      score = score * 0.1; // Reduce score by 90% if not matching category
    }
    
    return { product: p, score };
  })
  .filter(item => item.score > 0) // Only include matches
  .sort((a, b) => b.score - a.score) // Sort by relevance
  .map(item => item.product);
  
  console.log(`📦 [Search] Found ${results.length} products matching "${query}"`);
  if (results.length > 0) {
    console.log(`📦 [Search] Top result: ${results[0].title} (category: ${results[0].category})`);
  }
  return results.slice(0, 10);
}

export async function suggestMatches(baseProduct) {
  const catalog = await loadCatalog();
  const baseTags = new Set((baseProduct.matchTags || baseProduct.tags || []).map((t) => t.toLowerCase()));

  const candidates = catalog.items
    .filter((p) => p.sku !== baseProduct.sku)
    .map((p) => {
      const tags = (p.matchTags || p.tags || []).map((t) => t.toLowerCase());
      const score = tags.reduce((s, t) => s + (baseTags.has(t) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates.slice(0, 5).map((x) => x.p);
}
