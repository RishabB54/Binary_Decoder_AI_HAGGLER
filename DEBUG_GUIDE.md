# 🐛 Debug Guide - Finding Error Logs

## 📍 Where to Find Logs

### 1. **Backend Logs** (Terminal #1)
**Location:** The terminal where you ran `npm run dev` in the backend folder

**What to look for:**
```
🔧 [Gemini] Service initialized
🔧 [Gemini] API URL: http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent
🔧 [Gemini] API Key configured: ✅ Yes

📨 [Chat] Received message: show kurta
🤖 [Gemini] Calling API with message: show kurta
🔑 [Gemini] Using API Key: 3057dfce55...
```

**If you see errors:**
```
❌ [Gemini] API Error: 401 Unauthorized
❌ [Gemini] API Error: 403 Forbidden  
❌ [Chat] Route error: ...
```

---

### 2. **Frontend Logs** (Browser Console)
**Location:** Browser → Press `F12` → Console tab

**What to look for:**
```
📤 Sending to backend: show kurta
📥 Response status: 200
📥 Response data: {sessionId: "...", replyText: "..."}
```

**If you see errors:**
```
❌ Frontend error: Failed to fetch
Error: Could not connect to backend
```

---

## 🔍 How to Debug

### Step 1: Check Backend Terminal

Look at **Terminal #1** (backend) after typing a message. You should see:

```
Backend listening on http://localhost:8080
📨 [Chat] Received message: show kurta
✅ [Chat] Success! Reply: Selected: Women Blue Cotton Kurta...
```

**If you see nothing** → Backend not receiving requests
**If you see errors** → Check error message details below

---

### Step 2: Check Browser Console

1. Open browser (http://localhost:5173)
2. Press `F12` to open DevTools
3. Click **Console** tab
4. Type a message in chat
5. Watch for logs

---

## ⚠️ Common Errors & Solutions

### Error 1: API Key Invalid (401/403)
**Backend log:**
```
❌ [Gemini] API Error: 401 Unauthorized
```

**Cause:** API keys expired or invalid  
**Solution:** Check keys are valid (22-23 Jan only)  
**Note:** Bot should still work with fallback mode!

---

### Error 2: Network Error
**Backend log:**
```
❌ [Gemini] Full error: fetch failed
```

**Cause:** Cannot reach Gemini API (network/VPN issue)  
**Solution:** 
- Check if on Flipkart network
- Bot will use fallback mode automatically

---

### Error 3: Backend Not Receiving Requests
**Backend log:** Nothing appears when you send messages

**Browser console:**
```
❌ Frontend error: Failed to fetch
```

**Solution:**
1. Check backend is running: `http://localhost:8080/health`
2. Should return: `{"ok":true}`
3. If not, restart backend

---

### Error 4: CORS Error
**Browser console:**
```
Access to fetch blocked by CORS policy
```

**Solution:** Backend must be on port 8080, frontend on 5173

---

## ✅ What You Should See (Working)

### Backend Terminal:
```
Backend listening on http://localhost:8080
🔧 [Gemini] Service initialized
🔧 [Gemini] API URL: http://genvoy.jarvis-prod.fkcloud.in...
🔧 [Gemini] API Key configured: ✅ Yes

📨 [Chat] Received message: show kurta
🤖 [Gemini] Calling API with message: show kurta
🔑 [Gemini] Using API Key: 3057dfce55...

[ONE OF THESE:]
✅ [Gemini] API Success! Response: Great choice...
OR
❌ [Gemini] Chat failed: ... (then fallback works)

✅ [Chat] Success! Reply: Selected: Women Blue Cotton Kurta...
```

### Browser Console:
```
📤 Sending to backend: show kurta
📥 Response status: 200
📥 Response data: {
  sessionId: "...",
  replyText: "Selected: Women Blue Cotton Kurta (₹999)...",
  haggleScore: 0.65,
  dealDraft: {...}
}
```

### Chat UI:
You should see actual product info, NOT "(no reply)"

---

## 🧪 Quick Test

### Test 1: Backend Health
```bash
# Open new terminal
curl http://localhost:8080/health
```

**Expected:** `{"ok":true}`

---

### Test 2: Direct API Test
```bash
# In backend folder
npm run test-api
```

**Expected:** 
```
✅ API Connection Successful!
📝 AI Response: Hello from Binary Decoders!...
```

---

### Test 3: Manual Chat Request
```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"userId":"u_gold","message":"show kurta"}'
```

**Expected:** JSON with `replyText` field

---

## 📋 Verification Steps

After I added logging, the backend **automatically restarted**. Now:

1. **Go to Terminal #1** (backend)
2. **You should see** new startup logs:
   ```
   Restarting 'src/server.js'
   Backend listening on http://localhost:8080
   🔧 [Gemini] Service initialized
   🔧 [Gemini] API URL: ...
   🔧 [Gemini] API Key configured: ✅ Yes
   ```

3. **Go to browser** (http://localhost:5173)
4. **Open Console** (F12)
5. **Type:** "show kurta"
6. **Watch BOTH:**
   - Terminal #1 for backend logs
   - Browser console for frontend logs

---

## 🔑 API Key Verification

Your keys are configured:
- **Text Key:** 
- **Image Key:** 
- **Endpoint:** 

You should see in backend logs:
```
🔑 [Gemini] Using API Key: 3057dfce55...
```

---

## 🚨 If Still Not Working

### Check These in Order:

1. **Backend Terminal** - Are logs appearing?
   - No → Backend crashed, restart it
   - Yes → Continue to #2

2. **Browser Console** - Any red errors?
   - Yes → Share the error message
   - No → Continue to #3

3. **Backend Logs** - What do you see after sending message?
   - `📨 [Chat] Received message` → Good, backend getting it
   - `❌ [Gemini] API Error` → API issue, fallback should work
   - `✅ [Chat] Success` → Response sent, check frontend

4. **Response Data** - Check browser console for response
   - `replyText: "Selected: ..."` → Should work!
   - `replyText: undefined` → Backend not sending it

---

## 📞 Share These When Asking for Help

1. **Backend logs** (copy from Terminal #1)
2. **Browser console logs** (screenshot or copy)
3. **Exact error messages** (any red text)
4. **What you typed** in chat

---

**Last Updated:** After adding comprehensive logging  
**Status:** Ready to debug! Check Terminal #1 and Browser Console (F12)
