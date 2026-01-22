# ✅ VERIFICATION CHECKLIST - Binary Decoders

## 📋 Pre-Demo Checklist

Run through this list before your hackathon presentation!

---

## 🔧 SETUP VERIFICATION

### Prerequisites
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] Two terminal windows ready

### File Structure
- [ ] `backend/` folder exists
- [ ] `frontend/` folder exists
- [ ] `backend/src/agent/geminiService.js` exists
- [ ] `backend/src/data/catalog.json` exists
- [ ] `frontend/src/ui/App.jsx` exists

### Dependencies Installed
- [ ] Backend: `backend/node_modules/` folder exists
- [ ] Frontend: `frontend/node_modules/` folder exists

**If not:**
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 🚀 RUNTIME VERIFICATION

### Backend Server
- [ ] Backend starts without errors: `cd backend && npm run dev`
- [ ] Shows: "Backend listening on http://localhost:8080"
- [ ] Health check works: Visit `http://localhost:8080/health`
  - Should show: `{"ok":true}`

### Frontend Server
- [ ] Frontend starts without errors: `cd frontend && npm run dev`
- [ ] Shows: "Local: http://localhost:5173"
- [ ] No compilation errors in terminal

### Browser Access
- [ ] Can open `http://localhost:5173`
- [ ] Page loads without blank screen
- [ ] Title shows: "🛍️ BinaryDecoders: AI Bargain Bot"
- [ ] No errors in browser console (F12 → Console)

---

## 🧪 FUNCTIONALITY TESTS

### Test 1: Basic Chat
- [ ] Type: "show kurta"
- [ ] Bot responds with product and price
- [ ] Response appears in chat bubble
- [ ] Deal card shows on right side

**Expected Response Structure:**
```
Selected: Women Blue Cotton Kurta (₹999)
Want a matching add-on? Say 'add matching dupatta'
Loyalty: GOLD
Done. I can do ₹881 (you save ₹118)
```

### Test 2: Bundle Deals
- [ ] Type: "add matching dupatta"
- [ ] Bot adds second item
- [ ] Deal card shows 2 items
- [ ] Total discount increases
- [ ] Response mentions bundle

### Test 3: Price Negotiation
- [ ] Type: "can you do ₹100 less?"
- [ ] Bot responds with counter-offer
- [ ] Shows reason for pricing
- [ ] Haggle meter updates

### Test 4: Tier System
- [ ] Switch to Bronze (dropdown top-right)
- [ ] Type: "show kurta"
- [ ] Discount is ~5%
- [ ] Switch to Gold
- [ ] Type: "show kurta"
- [ ] Discount is ~12%

### Test 5: Different Products
- [ ] Type: "show dupatta"
- [ ] Different product appears
- [ ] Type: "show saree"
- [ ] Saree products appear
- [ ] Type: "show shirt"
- [ ] Men's shirt appears

---

## 🤖 AI FUNCTIONALITY

### Gemini API Connection
- [ ] Run: `npm run test-api` (in backend folder)
- [ ] Shows: "✅ API Connection Successful!"
- [ ] Shows AI response text
- [ ] Shows token usage

**If API fails:**
- Bot will still work (fallback mode)
- Responses will be more template-based
- This is OK for demo!

### Natural Language Understanding
- [ ] Try: "I want a blue kurta"
  - Should understand and show blue kurta
- [ ] Try: "give me ₹100 discount"
  - Should understand discount request
- [ ] Try: "add matching item"
  - Should add complementary product

---

## 🎨 UI/UX VERIFICATION

### Visual Elements
- [ ] Dark theme displays correctly
- [ ] Chat bubbles have different colors (user vs bot)
- [ ] Haggle Meter shows percentage bar
- [ ] Deal Card shows items and prices
- [ ] Buttons are clickable and styled

### Responsive Behavior
- [ ] Chat scrolls if many messages
- [ ] Input field accepts text
- [ ] Send button enables when text entered
- [ ] Dropdown works smoothly

### Animations
- [ ] Haggle Meter bar animates
- [ ] New messages appear smoothly
- [ ] No visual glitches

---

## 📊 DATA VERIFICATION

### Catalog Data
- [ ] Backend has products: Check `backend/src/data/catalog.json`
- [ ] At least 8 products exist
- [ ] Products have: sku, title, price, tags, matchTags

### User Data
- [ ] 3 user tiers exist: bronze, silver, gold
- [ ] Each has different supercoins value

### Inventory Data
- [ ] Stock levels set for all products
- [ ] Some products have low stock (≤3 units)
- [ ] Low stock products: DUPATTA_BLUE_01 (2), SHOES_MEN_BLACK_01 (1)

---

## 🔐 API KEYS VERIFICATION

### Keys Configured
- [ ] Text API Key: `3057dfce551f4941ae42ecb8b72f5f93`
- [ ] Image API Key: `bbef49c51dad4a7e8f8b5420c30e4f6c`
- [ ] Keys hardcoded in `backend/src/agent/geminiService.js`
- [ ] Endpoint: `http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent`

### Validity Window
- [ ] Current date is 22-23 Jan 2026
- [ ] Current time is between 10:00 AM and 11:59 PM

**If outside window:** Bot uses fallback mode (still functional!)

---

## 🎬 DEMO PREPARATION

### Demo Script Ready
- [ ] Know which user tier to start with (Gold recommended)
- [ ] Have test phrases ready:
  - "show kurta"
  - "add matching dupatta"
  - "can you do ₹100 less?"
- [ ] Can switch tiers smoothly
- [ ] Can explain how AI works

### Talking Points
- [ ] Gemini 2.5 Flash for NLU
- [ ] Loyalty-based pricing (Bronze/Silver/Gold)
- [ ] Inventory-aware discounts
- [ ] Bundle deal suggestions
- [ ] Natural language negotiation
- [ ] Fallback system for reliability

### Tech Stack
- [ ] Frontend: React + Vite
- [ ] Backend: Node.js + Express
- [ ] AI: Gemini 2.5 Flash (Flipkart Jarvis)
- [ ] Data: JSON (mock database)

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### Issue: Generic Responses
**Cause:** Gemini API not accessible  
**Impact:** Bot works but less natural  
**Solution:** Mention fallback system as feature!

### Issue: Port Already in Use
**Solution:**
```bash
killall node
# Restart servers
```

### Issue: CORS Errors
**Solution:** Backend must run on port 8080, frontend on 5173

### Issue: Blank Page
**Solution:** Hard refresh browser (Ctrl+Shift+R)

---

## 📱 BROWSER COMPATIBILITY

### Tested & Working
- [ ] Chrome (recommended for demo)
- [ ] Edge
- [ ] Firefox
- [ ] Safari

### Not Supported
- ❌ Internet Explorer

---

## 💾 BACKUP PLAN

### If Backend Fails
1. Show API_CONFIGURATION.md
2. Explain architecture with diagrams
3. Walk through code in IDE
4. Show test-api.js results

### If Frontend Fails
1. Use curl to demo backend:
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"u_gold","message":"show kurta"}'
```
2. Show JSON responses
3. Explain UI mockups

### If Gemini API Fails
- Emphasize fallback system
- Show it still works
- Mention "production-ready" reliability

---

## 📸 SCREENSHOTS FOR PRESENTATION

### Recommended Captures
- [ ] Main chat interface
- [ ] Bundle deal example
- [ ] Different tier discounts
- [ ] Haggle meter at different levels
- [ ] Deal card with multiple items

---

## ⏱️ FINAL 5-MINUTE CHECK

**5 minutes before demo:**

1. [ ] Both servers running
2. [ ] Browser open to localhost:5173
3. [ ] Test "show kurta" works
4. [ ] No console errors
5. [ ] Tier selector works

**During demo:**
- Stay on Gold tier (best discounts)
- Don't spam requests (rate limits)
- If error occurs, refresh and continue

---

## 🎯 SUCCESS CRITERIA

### Minimum Viable Demo
- [x] Chat interface loads
- [x] Bot responds to messages
- [x] Shows products with prices
- [x] Calculates discounts
- [x] Different tiers work

### Full Feature Demo
- [x] Natural language understanding
- [x] Bundle suggestions
- [x] Price negotiation
- [x] Visual feedback (meter, cards)
- [x] Smooth user experience

### Wow Factors
- [x] Gemini 2.5 Flash AI integration
- [x] Real-time inventory awareness
- [x] Culturally-aware responses (₹, Indian context)
- [x] Fallback reliability
- [x] Modern, polished UI

---

## 📞 EMERGENCY CONTACTS

**During Hackday:**
- Hackday 13 Official Forum
- API issues: Check Genvoy docs

**Quick Debug:**
```bash
# Check backend health
curl http://localhost:8080/health

# Check backend logs
# Look at Terminal #1 for errors

# Check frontend logs
# Press F12 in browser, check Console
```

---

## ✅ FINAL GO/NO-GO

**Ready for demo if:**
- ✅ All servers start without errors
- ✅ Basic chat works ("show kurta")
- ✅ UI displays correctly
- ✅ No critical errors in console

**Demo-ready even if:**
- ⚠️ Gemini API not responding (fallback works)
- ⚠️ Some products out of stock
- ⚠️ Slower response times

**Do NOT demo if:**
- ❌ Cannot start servers
- ❌ Blank page / crashes
- ❌ No response from backend

---

**Last Checked:** __________  
**Checked By:** __________  
**Status:** ⬜ READY  ⬜ NEEDS WORK  ⬜ BLOCKED

---

**Team:** Binary Decoders  
**Hackday:** 13  
**Good luck! 🎉**
