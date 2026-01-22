# 🎁 Bundle Logic - Complete Flow

## 📍 Where Bundle Offers Happen

### **STEP 1: User Requests Bundle** 
**File:** `backend/src/agent/mockNlu.js` (or `geminiService.js`)

**User types:**
- "add matching dupatta"
- "add bundle"
- "matching item"

**Intent extracted:**
```javascript
{
  wantMatch: true  // ← This triggers bundle logic!
}
```

---

### **STEP 2: Find Matching Products**
**File:** `backend/src/agent/tools.js` → `suggestMatches()`

**Code:**
```javascript
export async function suggestMatches(baseProduct) {
  const catalog = await loadCatalog();
  
  // Get base product's matching tags
  const baseTags = new Set(baseProduct.matchTags); // ["blue", "ethnic"]
  
  // Find products with matching tags
  const candidates = catalog.items
    .filter((p) => p.sku !== baseProduct.sku)  // Don't match with itself
    .map((p) => {
      const tags = p.matchTags;  // ["blue", "ethnic"]
      const score = tags.reduce((s, t) => 
        s + (baseTags.has(t) ? 1 : 0), 0  // Count matching tags
      );
      return { p, score };
    })
    .filter((x) => x.score > 0)  // Only items with matches
    .sort((a, b) => b.score - a.score);  // Best matches first
  
  return candidates.slice(0, 5).map((x) => x.p);
}
```

**Example:**
```
Base: Blue Kurta (matchTags: ["blue", "ethnic"])
Matches:
  ✅ Blue Dupatta (matchTags: ["blue", "ethnic"]) → Score: 2
  ✅ Red Saree (matchTags: ["red", "ethnic"]) → Score: 1
  ❌ Black Shirt (matchTags: ["black", "casual"]) → Score: 0
```

**Result:** Blue Dupatta suggested (highest score)

---

### **STEP 3: Create Bundle**
**File:** `backend/src/agent/bargainAgent.js`

**Code:**
```javascript
const matchItems = intent.wantMatch
  ? await suggestMatches(selectedBase)  // Find matching products
  : [];

const bundleItems = [selectedBase];  // Start with base item
if (matchItems.length > 0) {
  bundleItems.push(matchItems[0]);  // Add best match
}
```

**Result:**
```javascript
bundleItems = [
  { sku: "KURTA_BLUE_01", title: "Blue Kurta", price: 999 },
  { sku: "DUPATTA_BLUE_01", title: "Blue Dupatta", price: 399 }
]
```

---

### **STEP 4: Calculate Bundle Discount**
**File:** `backend/src/agent/policy.js` → `computeOffer()`

**The Bundle Bonus Formula:**

```javascript
// Base discount from loyalty tier
const tierCapPct = user.tier === "gold" ? 0.12    // 12%
                 : user.tier === "silver" ? 0.08  // 8%
                 : 0.05;                          // 5% (bronze)

// 🎁 BUNDLE BONUS: +2% if 2 or more items
const bundleBonusPct = items.length >= 2 ? 0.02 : 0;

// Check inventory for scarcity penalty
const lowStockSkus = items.filter(item => stock <= 3);
const scarcityPenaltyPct = lowStockSkus.length > 0 ? 0.03 : 0;

// 📊 FINAL DISCOUNT CALCULATION
const maxDiscountPct = tierCapPct + bundleBonusPct - scarcityPenaltyPct;
//                     ^12% (gold)  ^+2% (bundle)   ^-3% (low stock)
//                     = 11% or 14% depending on stock!

const maxDiscount = Math.floor(originalTotal * maxDiscountPct);
```

---

## 💰 Example Calculations

### **Scenario 1: Single Item (No Bundle)**
```
User: Gold tier
Item: Blue Kurta (₹999)

Discount:
  Tier: 12% (₹119.88)
  Bundle: 0% (not a bundle)
  Stock: Normal (no penalty)
  ─────────────────────
  Total: 12% (₹119)
  
Final Price: ₹880
```

### **Scenario 2: Bundle (2 Items)**
```
User: Gold tier
Items: 
  - Blue Kurta (₹999)
  - Blue Dupatta (₹399)
  - Total: ₹1398

Discount:
  Tier: 12% (₹167.76)
  Bundle: +2% (₹27.96)  ← BUNDLE BONUS!
  Stock: Normal (no penalty)
  ─────────────────────
  Total: 14% (₹195)
  
Final Price: ₹1203
Savings: ₹195 (vs ₹167 single item)
```

### **Scenario 3: Bundle + Low Stock**
```
User: Gold tier
Items: 
  - Blue Kurta (₹999) [12 in stock]
  - Blue Dupatta (₹399) [2 in stock] ⚠️
  - Total: ₹1398

Discount:
  Tier: 12% (₹167.76)
  Bundle: +2% (₹27.96)
  Stock Penalty: -3% (₹41.94)  ← Low stock penalty!
  ─────────────────────
  Total: 11% (₹153)
  
Final Price: ₹1245
Note: Less discount due to scarcity
```

---

## 🎯 Key Points

### **1. Bundle Detection**
✅ Triggered by: `intent.wantMatch = true`
✅ User phrases: "add matching", "bundle", "add dupatta"

### **2. Smart Matching**
✅ Based on `matchTags` in catalog
✅ Scores products by tag overlap
✅ Returns best matches first

### **3. Bundle Bonus**
✅ **+2% discount** when `items.length >= 2`
✅ Applied automatically in pricing policy
✅ Stacks with loyalty tier discount

### **4. Inventory Awareness**
✅ Checks stock levels in real-time
✅ **-3% penalty** for low stock items (≤3 units)
✅ Encourages selling high-stock items

---

## 📁 File Reference

| File | Purpose | Bundle Logic |
|------|---------|--------------|
| `catalog.json` | Product data | `matchTags` define compatibility |
| `tools.js` | Product matching | `suggestMatches()` finds bundles |
| `bargainAgent.js` | Main logic | Creates `bundleItems` array |
| `policy.js` | Pricing engine | Applies `bundleBonusPct` |
| `inventory.json` | Stock levels | Used for scarcity penalty |

---

## 🧪 Test Bundle Logic

### **Test 1: Basic Bundle**
```
1. Type: "show kurta"
   → Single item, 12% discount (Gold)

2. Type: "add matching dupatta"
   → Bundle created, 14% discount (+2% bonus!)
```

### **Test 2: Different Tiers**
```
Bronze user + bundle: 5% + 2% = 7%
Silver user + bundle: 8% + 2% = 10%
Gold user + bundle: 12% + 2% = 14%
```

### **Test 3: Low Stock Item**
```
1. Type: "show shoes" (only 1 in stock)
   → Lower discount due to scarcity

2. Type: "add matching item"
   → Even with bundle, discount reduced
```

---

## 🎨 How matchTags Work

**Blue Kurta:**
```json
{
  "sku": "KURTA_BLUE_01",
  "matchTags": ["blue", "ethnic"]
}
```

**Blue Dupatta:**
```json
{
  "sku": "DUPATTA_BLUE_01",
  "matchTags": ["blue", "ethnic"]  // ← 2 matching tags!
}
```

**Match Score: 2** (both "blue" and "ethnic" match)

**Pink Dupatta:**
```json
{
  "sku": "DUPATTA_PINK_01",
  "matchTags": ["pink", "ethnic"]  // ← Only 1 matching tag
}
```

**Match Score: 1** (only "ethnic" matches)

**Result:** Blue Dupatta ranked higher!

---

## 💡 To Add More Bundles

Edit `catalog.json` and add matching products with same `matchTags`:

```json
{
  "sku": "SAREE_RED_01",
  "matchTags": ["red", "ethnic"]
},
{
  "sku": "BLOUSE_RED_01",
  "matchTags": ["red", "ethnic"]  // ← Will match with red saree!
}
```

---

## 🚀 Enhancement Ideas

1. **3-Item Bundles:** Change `items.length >= 2` to enable bigger bundles
2. **Dynamic Bonus:** Scale bonus by bundle size (2 items = 2%, 3 items = 4%)
3. **Category Bundles:** Kurta + Dupatta + Jewelry = 5% extra
4. **Time-Limited:** Flash bundles with higher discounts
5. **Smart Upsell:** Suggest 3rd item to increase discount

---

**Current Implementation:** ✅ Working and Demo-Ready!

The bundle logic is:
- ✅ Fully functional
- ✅ Tag-based matching
- ✅ Automatic discount calculation
- ✅ Inventory-aware
- ✅ Tier-based

**Test it:** Type "show kurta" then "add matching dupatta" and watch the discount increase! 🎁
