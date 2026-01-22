import { loadCatalog } from "../store/catalogStore.js";

export async function searchCatalog(query) {
  const catalog = await loadCatalog();
  const needle = String(query || "").toLowerCase();
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
