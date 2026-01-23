/**
 * Test CSV catalog loading
 * 
 * Usage: node test-csv.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadCatalog } from './src/store/catalogStore.js';
import { searchCatalog } from './src/agent/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, '.env') });

console.log("🧪 Testing CSV Catalog Loading\n");
console.log("=".repeat(50));

try {
  // Test 1: Load catalog
  console.log("\n📦 Test 1: Loading catalog...");
  const catalog = await loadCatalog();
  
  console.log(`✅ Catalog loaded!`);
  console.log(`   Source: ${catalog.source || 'json'}`);
  console.log(`   Total products: ${catalog.items.length}`);
  
  if (catalog.items.length > 0) {
    console.log(`\n   Sample product:`);
    const sample = catalog.items[0];
    console.log(`   - SKU: ${sample.sku}`);
    console.log(`   - Title: ${sample.title}`);
    console.log(`   - Category: ${sample.category}`);
    console.log(`   - Price: ₹${sample.price}`);
    console.log(`   - Brand: ${sample.brand || 'N/A'}`);
  }
  
  // Test 2: Search
  console.log("\n🔍 Test 2: Testing search...");
  const queries = ["blue kurta", "jeans", "shirt", "pants"];
  
  for (const query of queries) {
    const results = await searchCatalog(query);
    console.log(`\n   Query: "${query}"`);
    console.log(`   Found: ${results.length} products`);
    if (results.length > 0) {
      console.log(`   Top result: ${results[0].title} (₹${results[0].price})`);
    }
  }
  
  // Test 3: Category breakdown
  console.log("\n📊 Test 3: Category breakdown...");
  const categories = {};
  catalog.items.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1;
  });
  
  console.log("   Categories:");
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} products`);
    });
  
  console.log("\n✅ All tests passed!\n");
  
} catch (error) {
  console.error("\n❌ Error:", error.message);
  console.error(error.stack);
  process.exit(1);
}
