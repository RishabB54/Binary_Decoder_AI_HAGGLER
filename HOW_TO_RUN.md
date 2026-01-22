# 🚀 HOW TO RUN - Binary Decoders Bargain Bot

## ✅ Pre-requisites Check

Before starting, make sure you have:
- [ ] **Node.js** installed (version 18 or higher)
- [ ] **npm** installed (comes with Node.js)
- [ ] **2 terminal windows** ready

To check:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

If not installed: Download from https://nodejs.org/

---

## 📁 Project Structure

```
Binary_Decoder/
├── backend/           ← Express.js API server
│   ├── src/
│   │   ├── agent/     ← AI logic & Gemini integration
│   │   ├── data/      ← Products, users, inventory
│   │   ├── routes/    ← API endpoints
│   │   └── server.js  ← Main server file
│   └── package.json
│
├── frontend/          ← React UI
│   ├── src/
│   │   ├── ui/        ← React components
│   │   └── main.jsx   ← Entry point
│   └── package.json
│
└── Documentation files
```

---

## 🎯 STEP-BY-STEP SETUP

### STEP 1: Open Terminal #1 - Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies (takes 30 seconds)
npm install

# You should see:
# ✓ added 95 packages
```

**What gets installed:**
- `express` - Web server
- `cors` - Cross-origin requests
- `zod` - Input validation
- `dotenv` - Environment variables

---

### STEP 2: Test API Connection (Optional but Recommended)

```bash
# Still in backend folder
npm run test-api
```

**Expected output:**
```
✅ API Connection Successful!
📝 AI Response: Hello from Binary Decoders! 🎉...
📊 Token Usage: {...}
🎉 Your Gemini API is working perfectly!
```

**If you see errors:**
- Check you're on 22-23 Jan 2026 (API keys valid only then)
- Verify network connectivity
- Continue anyway (bot has fallback mode)

---

### STEP 3: Start Backend Server

```bash
# Still in backend folder
npm run dev
```

**Expected output:**
```
Backend listening on http://localhost:8080
```

**✅ Backend is running! Leave this terminal open.**

---

### STEP 4: Open Terminal #2 - Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (takes 45 seconds)
npm install

# You should see:
# ✓ added 215 packages
```

**What gets installed:**
- `react` - UI framework
- `vite` - Fast build tool
- Development tools

---

### STEP 5: Start Frontend Server

```bash
# Still in frontend folder
npm run dev
```

**Expected output:**
```
  VITE v5.4.2  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Frontend is running!**

---

### STEP 6: Open in Browser

Open your browser to:
```
http://localhost:5173
```

You should see:
- Chat interface with dark theme
- Title: "🛍️ BinaryDecoders: AI Bargain Bot"
- Tier selector (Bronze/Silver/Gold)
- Input box with placeholder text

---

## 🧪 TESTING THE BOT

### Test 1: Basic Product Search
Type in chat:
```
show kurta
```

**Expected response:**
```
Selected: Women Blue Cotton Kurta (₹999).
Want a matching add-on? Say 'add matching dupatta'.
Loyalty: GOLD.
Done. I can do ₹881 (you save ₹118).
```

---

### Test 2: Bundle Deal
Type:
```
add matching dupatta
```

**Expected response:**
```
Matching add-on: Blue Chiffon Dupatta (₹399).
Bundle: Kurta + Dupatta
Deal: ₹1230 (save ₹168)
```

---

### Test 3: Price Negotiation
Type:
```
can you do ₹100 less?
```

**Expected response:**
```
I can't go that low. Best I can do is ₹1230 (save ₹168).
Reason: Bundle + loyalty discount applied.
```

---

### Test 4: Change User Tier
1. Click dropdown at top-right
2. Select "Bronze"
3. Type "show kurta" again
4. Notice lower discount (5% max vs 12% for Gold)

---

## 📊 How It Works

```
User Types Message
        ↓
Frontend (React) → POST /chat → Backend (Express)
                                        ↓
                                Gemini AI (extracts intent)
                                        ↓
                                Search Catalog
                                        ↓
                                Calculate Discount (policy)
                                        ↓
                                Generate Response (Gemini)
                                        ↓
Frontend ← JSON Response ← Backend
        ↓
Display Chat + Deal Card
```

---

## 🔧 TROUBLESHOOTING

### Problem: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

---

### Problem: Port 8080 already in use

**Error:** `EADDRINUSE: address already in use :::8080`

**Solution:**
```bash
# Find what's using port 8080
lsof -i :8080

# Kill the process (replace PID with actual number)
kill -9 <PID>

# Or use different port: Edit backend/src/server.js
# Change: const port = 8081;
```

---

### Problem: Frontend shows "Cannot connect to backend"

**Checks:**
1. Is backend running? Check Terminal #1
2. Is it on port 8080? Should see "listening on http://localhost:8080"
3. Try visiting http://localhost:8080/health in browser
   - Should show: `{"ok":true}`

**Solution:**
```bash
# Restart backend
cd backend
npm run dev
```

---

### Problem: Gemini API not responding

**Symptoms:** Bot gives generic template responses instead of natural AI responses

**Why:** 
- API keys valid only 22-23 Jan 2026 (10am to 11:59pm)
- Network issues
- Rate limiting

**Good News:** Bot still works! It uses fallback rule-based system

---

### Problem: Browser shows blank page

**Check:**
1. Open browser DevTools (F12)
2. Look at Console tab for errors
3. Common fix: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## 🎬 DEMO FLOW (For Presentation)

### 1. Show UI (30 seconds)
- Point out clean, modern design
- Highlight Haggle Meter
- Show tier selector

### 2. Bronze User Demo (1 minute)
```
Switch to Bronze tier
Type: "show kurta"
→ Show limited discount (5%)
```

### 3. Gold User Demo (1 minute)
```
Switch to Gold tier
Type: "show kurta"
→ Show better discount (12%)
Explain: Loyalty-based pricing
```

### 4. Bundle Deal (1 minute)
```
Type: "add matching dupatta"
→ Show bundle discount (14% total)
Explain: Smart AI matching
```

### 5. Natural Language (1 minute)
```
Type: "can you do ₹100 less?"
→ Show AI counter-offer
Explain: Gemini-powered negotiation
```

### 6. Highlight Tech (30 seconds)
- Gemini 2.5 Flash for NLU
- Real-time inventory awareness
- Policy-based pricing
- Fallback system

---

## 📊 API ENDPOINTS (For Testing)

### Check Health
```bash
curl http://localhost:8080/health
```

### List Products
```bash
curl http://localhost:8080/catalog
```

### Chat (with curl)
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "u_gold",
    "message": "show kurta"
  }'
```

---

## 🛑 STOPPING THE SERVERS

### To stop backend (Terminal #1):
Press `Ctrl + C`

### To stop frontend (Terminal #2):
Press `Ctrl + C`

---

## 📦 DEPENDENCIES SUMMARY

### Backend (`backend/package.json`)
```json
{
  "express": "^4.19.2",      // Web server
  "cors": "^2.8.5",          // CORS handling
  "zod": "^3.23.8",          // Validation
  "dotenv": "^16.4.5"        // Environment vars
}
```

### Frontend (`frontend/package.json`)
```json
{
  "react": "^18.3.1",                    // UI framework
  "react-dom": "^18.3.1",                // React DOM
  "vite": "^5.4.2",                      // Build tool
  "@vitejs/plugin-react": "^4.3.1"      // React plugin
}
```

---

## 🎯 QUICK COMMANDS CHEAT SHEET

```bash
# Backend
cd backend
npm install              # Install dependencies
npm run test-api         # Test Gemini API
npm run dev              # Start with hot-reload
npm start                # Start production mode

# Frontend
cd frontend
npm install              # Install dependencies
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## ✅ VERIFICATION CHECKLIST

Before demo:
- [ ] Backend running on http://localhost:8080
- [ ] Frontend running on http://localhost:5173
- [ ] Can see UI in browser
- [ ] Chat responds to "show kurta"
- [ ] Can add bundle items
- [ ] Tier selector works
- [ ] Haggle meter animates
- [ ] Deal card shows discount

---

## 📱 Browser Compatibility

**Best Experience:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

**Not Recommended:**
- ❌ Internet Explorer (not supported)

---

## 🚨 EMERGENCY RESTART

If anything goes wrong:

```bash
# Kill all Node processes
killall node

# Restart backend
cd backend
npm run dev

# Restart frontend (new terminal)
cd frontend
npm run dev

# Hard refresh browser: Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
```

---

## 📞 HELP & SUPPORT

**Issues during hackathon?**
- Check Hackday 13 Official Forum
- Review API_CONFIGURATION.md
- Check logs in both terminal windows

**Quick Debug:**
1. Check both terminals for error messages
2. Visit http://localhost:8080/health (should return `{"ok":true}`)
3. Check browser console (F12) for frontend errors

---

**Team:** Binary Decoders  
**Hackday:** 13  
**Last Updated:** Jan 22, 2026  

**Good luck with your demo! 🎉**
