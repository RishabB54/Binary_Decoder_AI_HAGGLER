import { loadCatalog } from "../store/catalogStore.js";

// Product synonyms - map common terms to catalog categories
const PRODUCT_SYNONYMS = {
  'pants': 'jeans',
  'trousers': 'jeans',
  'pant': 'jeans',
  'trouser': 'jeans',
  'bottom': 'jeans',
  'bottoms': 'jeans',
  'leggings': 'jeans',
  'churidar': 'kurta',
  'salwar': 'kurta',
  'suit': 'kurta',
  'outfit': 'kurta',
  'dress': 'saree',
  'gown': 'saree',
  'footwear': 'shoes',
  'sneakers': 'shoes',
  'sports shoes': 'shoes',
  'top': 'shirt',
  'tshirt': 'shirt',
  't-shirt': 'shirt',
  'tee': 'shirt'
};

export async function searchCatalog(query) {
  const catalog = await loadCatalog();
  let needle = String(query || "").toLowerCase().trim();
  
  // Check synonyms first
  if (PRODUCT_SYNONYMS[needle]) {
    needle = PRODUCT_SYNONYMS[needle];
    console.log(`🔄 [Search] Mapped "${query}" → "${needle}"`);
  }
  
  const results = catalog.items.filter((p) => {
    const hay = `${p.title} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(needle);
  });
  
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
