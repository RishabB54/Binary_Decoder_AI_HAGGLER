# 🛍️ Binary Decoders: Live-Stream Bargain Bot

## Problem Statement
**Live-Stream "Bargain" Bot (Delight the User)**

Indian shoppers miss the social, interactive nature of a physical bazaar where they can ask questions and negotiate. Static product pages feel cold and transactional.

## Our Solution
An AI-powered bargaining concierge that uses **Gemini 2.5 Flash** to:
- Understand natural language negotiation in Indian context
- Intelligently suggest bundle deals (e.g., "matching dupatta")
- Apply dynamic pricing based on loyalty tiers and inventory
- Provide conversational, culturally-aware responses

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Gemini API subscription key from Flipkart Jarvis

### 1. Backend Setup

```bash
cd Binary_Decoder/backend

# Install dependencies
npm install

# Create .env file
echo "GEMINI_API_KEY=your_subscription_key_here" > .env
echo "PORT=8080" >> .env

# Start backend
npm run dev
```

Backend will run on `http://localhost:8080`

### 2. Frontend Setup

```bash
cd Binary_Decoder/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 🎯 Key Features

### 1. **AI-Powered Intent Understanding**
- Uses Gemini 2.5 Flash to extract intent from natural language
- Understands phrases like:
  - "Show me blue kurtas"
  - "Add matching dupatta for ₹100 less"
  - "Can you do 10% discount?"

### 2. **Dynamic Bundle Suggestions**
- Automatically suggests matching items (dupatta with kurta, blouse with saree)
- Increases discount when users bundle items
- Smart product matching based on tags and categories

### 3. **Loyalty-Based Pricing**
- **Bronze**: 5% max discount
- **Silver**: 8% max discount
- **Gold**: 12% max discount
- Bundle bonus: +2%

### 4. **Inventory-Aware Pricing**
- Low stock items (≤3 units) have reduced discount (-3%)
- Encourages selling high-stock items with better deals

### 5. **Conversational AI Response**
- Gemini generates natural, friendly responses
- Culturally aware of Indian shopping preferences
- Fallback to rule-based system if API fails

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐      ┌──────────────┐
│   Backend       │─────►│   Gemini     │
│   (Express)     │      │ 2.5 Flash API│
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│   Data Layer    │
│  (JSON files)   │
└─────────────────┘
```

### Backend Structure
```
backend/src/
├── agent/
│   ├── bargainAgent.js      # Main negotiation logic
│   ├── geminiService.js     # Gemini API integration
│   ├── mockNlu.js          # Fallback NLU
│   ├── policy.js           # Pricing policy engine
│   └── tools.js            # Catalog search tools
├── data/
│   ├── catalog.json        # Product catalog
│   ├── inventory.json      # Stock levels
│   └── users.json          # User loyalty tiers
├── routes/
│   ├── catalog.js
│   ├── chat.js             # Main chat endpoint
│   └── deal.js
└── store/                  # Data access layer
```

---

## 🔧 API Endpoints

### POST `/chat`
Main bargaining endpoint

**Request:**
```json
{
  "userId": "u_gold",
  "sessionId": "optional-session-id",
  "message": "show blue kurta"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "replyText": "Great choice! I found a beautiful Women Blue Cotton Kurta...",
  "haggleScore": 0.65,
  "dealDraft": {
    "dealId": "uuid",
    "currency": "INR",
    "items": [...],
    "originalTotal": 1398,
    "finalTotal": 1230,
    "discountTotal": 168,
    "reason": "Bundle + loyalty discount applied."
  }
}
```

### GET `/catalog`
List all products

### POST `/deal/:dealId/confirm`
Confirm and complete a deal

---

## 💡 Testing Scenarios

### Scenario 1: Simple Product Search
```
User: "show kurta"
Bot: Suggests kurta with price
User: "add matching dupatta"
Bot: Adds dupatta, offers bundle discount
```

### Scenario 2: Price Negotiation
```
User: "show kurta"
Bot: "₹999 for Women Blue Cotton Kurta"
User: "can you do ₹100 less?"
Bot: "I can do ₹950 (Gold tier discount)"
```

### Scenario 3: Bundle Deal
```
User: "I want blue kurta"
Bot: Shows kurta ₹999
User: "add matching dupatta for ₹100 less"
Bot: "Bundle deal! Kurta + Dupatta = ₹1230 (save ₹168)"
```

---

## 🎨 Frontend Features

- **Real-time Chat Interface**: Bubble-style chat with assistant/user messages
- **Haggle Meter**: Visual indicator of negotiation success (0-100%)
- **Deal Card**: Shows current bundle items and total discount
- **Tier Selector**: Switch between Bronze/Silver/Gold tiers to see different pricing

---

## 🔐 Environment Variables

Create `backend/.env`:
```env
# Required
GEMINI_API_KEY=your_ocp_apim_subscription_key

# Optional
PORT=8080
NODE_ENV=development
```

**Important**: Get your API key from Flipkart Jarvis team

---

## 📊 Sample Data

### Catalog Items
- Women Blue Cotton Kurta (₹999)
- Blue Chiffon Dupatta (₹399)
- Red Silk Saree (₹1999)
- Red Saree Blouse (₹299)
- Men Black Casual Shirt (₹899)
- Men Blue Slim Jeans (₹1299)

### User Tiers
- `u_bronze`: Bronze tier (5% max)
- `u_silver`: Silver tier (8% max)
- `u_gold`: Gold tier (12% max)

---

## 🚀 Future Enhancements (Post-Hackathon)

1. **Video Integration**: 
   - Webcam capture for product identification
   - Fabric/texture analysis from live stream

2. **Voice Negotiation**:
   - Web Speech API for voice input
   - Natural voice-based bargaining

3. **Advanced Features**:
   - Multi-product catalog (thousands of items)
   - Real-time inventory sync
   - Order placement integration
   - Payment gateway
   - Chat history persistence

---

## 🐛 Troubleshooting

### Gemini API Errors
- Check if `GEMINI_API_KEY` is set correctly
- Verify API subscription is active
- Bot will fallback to mock NLU if API fails

### CORS Errors
- Ensure backend is running on port 8080
- Frontend expects backend at `http://localhost:8080`

### No Products Found
- Check if `backend/src/data/catalog.json` exists
- Try exact searches: "kurta", "dupatta", "saree"

---

## 👥 Team: Binary Decoders

Built for Flipkart Hackathon 2026

**Tech Stack:**
- Frontend: React + Vite
- Backend: Node.js + Express
- AI: Gemini 2.5 Flash via Flipkart Jarvis
- Data: JSON (mock database)

---

## 📝 License

Proprietary - Flipkart Hackathon 2026
