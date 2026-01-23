/**
 * CSV Catalog Loader
 * Loads Myntra products from CSV file
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract category from product name/description
 */
function extractCategory(productName, description) {
  const text = `${productName || ""} ${description || ""}`.toLowerCase();
  
  // Exclude perfume/fragrance products first (they often have misleading keywords)
  if (text.includes("perfume") || text.includes("eau de") || text.includes("fragrance") || 
      text.includes("toilette") || text.includes("parfum") || text.includes("cologne")) {
    return "accessories"; // Perfumes go to accessories, not shoes
  }
  
  // Check specific categories first (more specific before generic)
  if (text.includes("bag") || text.includes("backpack") || text.includes("trolley")) {
    return "accessories";
  }
  if (text.includes("jewellery") || text.includes("jewelry") || text.includes("bangle") || text.includes("cufflink") || text.includes("tikka")) {
    return "accessories";
  }
  // More precise shoe detection - avoid matching "sandalwood" (perfume ingredient)
  if (text.includes("shoe") || text.includes("footwear") || 
      (text.includes("sandal") && !text.includes("sandalwood")) || 
      text.includes("sneaker") || text.includes("loafer") ||
      text.includes("slipper") || text.includes("boot")) {
    return "shoes";
  }
  if (text.includes("kurta") || text.includes("churidar") || text.includes("salwar")) {
    return "kurta";
  }
  if (text.includes("jeans") || text.includes("pant") || text.includes("trouser")) {
    return "jeans";
  }
  if (text.includes("saree") || text.includes("sari")) {
    return "saree";
  }
  if (text.includes("dupatta") || text.includes("scarf")) {
    return "dupatta";
  }
  if (text.includes("blouse")) {
    return "blouse";
  }
  if (text.includes("dress") || text.includes("gown")) {
    return "saree"; // Treat dress as saree category
  }
  if (text.includes("shirt") || text.includes("tshirt") || text.includes("t-shirt") || text.includes("top")) {
    return "shirt";
  }
  
  return "clothing"; // Default
}

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * Load catalog from CSV file
 */
export async function loadCatalogFromCSV() {
  const csvPath = path.join(__dirname, "..", "..", "data", "myntra_products_catalog.csv");
  
  try {
    const csvContent = await fs.readFile(csvPath, "utf-8");
    const lines = csvContent.split("\n").filter(line => line.trim());
    
    if (lines.length === 0) {
      console.warn("⚠️  [CSV] CSV file is empty");
      return null;
    }
    
    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());
    
    console.log("📊 [CSV] Headers:", headers);
    
    // Find column indices
    const productIdIdx = headers.findIndex(h => h.includes("productid") || h.includes("product id"));
    const productNameIdx = headers.findIndex(h => h.includes("productname") || h.includes("product name"));
    const brandIdx = headers.findIndex(h => h.includes("brand"));
    const genderIdx = headers.findIndex(h => h.includes("gender"));
    const priceIdx = headers.findIndex(h => h.includes("price"));
    const descriptionIdx = headers.findIndex(h => h.includes("description"));
    const colorIdx = headers.findIndex(h => h.includes("color") || h.includes("primarycolor"));
    
    // Validate required columns
    if (productNameIdx === -1 || priceIdx === -1) {
      console.error("❌ [CSV] Missing required columns: ProductName and Price");
      return null;
    }
    
    console.log("✅ [CSV] Found columns:", {
      productId: productIdIdx !== -1 ? headers[productIdIdx] : "N/A",
      productName: headers[productNameIdx],
      brand: brandIdx !== -1 ? headers[brandIdx] : "N/A",
      gender: genderIdx !== -1 ? headers[genderIdx] : "N/A",
      price: headers[priceIdx],
      description: descriptionIdx !== -1 ? headers[descriptionIdx] : "N/A",
      color: colorIdx !== -1 ? headers[colorIdx] : "N/A"
    });
    
    // Parse data rows
    const items = [];
    let skipped = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      try {
        const values = parseCSVLine(line);
        
        const productId = (productIdIdx !== -1 && values[productIdIdx]) ? String(values[productIdIdx]).trim() : `CSV-${i}`;
        const productName = (productNameIdx !== -1 && values[productNameIdx]) ? String(values[productNameIdx]).trim() : "";
        const brand = (brandIdx !== -1 && values[brandIdx]) ? String(values[brandIdx]).trim() : "Unknown";
        const gender = (genderIdx !== -1 && values[genderIdx]) ? String(values[genderIdx]).trim() : "";
        const priceStr = (priceIdx !== -1 && values[priceIdx]) ? String(values[priceIdx]).trim() : "0";
        const description = (descriptionIdx !== -1 && values[descriptionIdx]) ? String(values[descriptionIdx]).trim() : "";
        const color = (colorIdx !== -1 && values[colorIdx]) ? String(values[colorIdx]).trim() : "";
        
        // Skip invalid rows
        if (!productName || !priceStr) {
          skipped++;
          continue;
        }
        
        // Parse price
        const price = parseFloat(String(priceStr).replace(/[₹,]/g, "")) || 0;
        if (price <= 0) {
          skipped++;
          continue;
        }
        
        // Extract category
        const category = extractCategory(productName, description);
        
        // Build tags
        const tags = [];
        if (gender) tags.push(String(gender).toLowerCase());
        if (color) tags.push(String(color).toLowerCase());
        if (brand) tags.push(String(brand).toLowerCase().replace(/\s+/g, ""));
        tags.push(category);
        
        // Extract additional keywords from description
        const descLower = description.toLowerCase();
        if (descLower.includes("cotton")) tags.push("cotton");
        if (descLower.includes("silk")) tags.push("silk");
        if (descLower.includes("casual")) tags.push("casual");
        if (descLower.includes("formal")) tags.push("formal");
        if (descLower.includes("ethnic")) tags.push("ethnic");
        if (descLower.includes("printed")) tags.push("printed");
        if (descLower.includes("solid")) tags.push("solid");
        
        // Create product object
        const product = {
          sku: `MYNTRA-${productId}`,
          title: productName,
          category: category,
          brand: brand,
          price: Math.round(price),
          tags: [...new Set(tags)], // Remove duplicates
          matchTags: [color.toLowerCase(), category, gender.toLowerCase()].filter(Boolean),
          description: description,
          image: `https://via.placeholder.com/300?text=${encodeURIComponent(productName.substring(0, 30))}`,
          inStock: true,
          stockCount: 10 // Default stock
        };
        
        items.push(product);
      } catch (error) {
        console.warn(`⚠️  [CSV] Error parsing line ${i + 1}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`✅ [CSV] Loaded ${items.length} products from CSV`);
    if (skipped > 0) {
      console.log(`⚠️  [CSV] Skipped ${skipped} invalid rows`);
    }
    
    return {
      items: items,
      source: "csv",
      totalProducts: items.length
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("ℹ️  [CSV] CSV file not found, will use catalog.json");
      return null;
    }
    console.error("❌ [CSV] Error loading CSV:", error.message);
    return null;
  }
}
