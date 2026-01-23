import fs from "fs/promises";
import path from "path";
import { loadCatalogFromCSV } from "./csvCatalogLoader.js";

let cached = null;

/**
 * Clear catalog cache (useful for reloading after CSV changes)
 */
export function clearCatalogCache() {
  cached = null;
  console.log("🔄 [Catalog] Cache cleared");
}

/**
 * Load catalog - tries CSV first, falls back to JSON
 */
export async function loadCatalog() {
  if (cached) return cached;

  // Try CSV first
  const csvCatalog = await loadCatalogFromCSV();
  if (csvCatalog && csvCatalog.items && csvCatalog.items.length > 0) {
    console.log(`✅ [Catalog] Using CSV catalog with ${csvCatalog.items.length} products`);
    cached = csvCatalog;
    return cached;
  }

  // Fallback to JSON
  console.log("ℹ️  [Catalog] Using JSON catalog (fallback)");
  const p = path.join(process.cwd(), "src", "data", "catalog.json");
  const raw = await fs.readFile(p, "utf-8");
  cached = JSON.parse(raw);
  return cached;
}
