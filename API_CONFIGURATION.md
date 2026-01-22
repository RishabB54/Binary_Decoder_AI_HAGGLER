# ✅ API Configuration - Binary Decoders

## Your API Keys (Configured & Ready!)

### Text Model - Gemini 2.5 Flash
- **Subscription Key**: `3057dfce551f4941ae42ecb8b72f5f93`
- **Endpoint**: `http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent`
- **Valid**: 22nd Jan 10:00 AM to 23rd Jan 11:59 PM 2026
- **Use**: Natural language chat, intent extraction

### Image Model - Gemini 2.5 Flash (Image)
- **Subscription Key**: `bbef49c51dad4a7e8f8b5420c30e4f6c`
- **Endpoint**: `http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent`
- **Valid**: 22nd Jan 10:00 AM to 23rd Jan 11:59 PM 2026
- **Use**: Future enhancement (video frame analysis)

---

## ✅ What's Configured

### 1. API Endpoint Format ✓
```javascript
const GEMINI_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";
```
**Matches Genvoy contract**: `/{model_name}/:generateContent`

### 2. Authentication Header ✓
```javascript
headers: {
  "Ocp-Apim-Subscription-Key": "3057dfce551f4941ae42ecb8b72f5f93",
  "Content-Type": "application/json"
}
```
**Matches Genvoy contract**: Uses `Ocp-Apim-Subscription-Key` as required

### 3. Request Payload ✓
```javascript
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "message here" }]
    }
  ],
  "generationConfig": {
    "maxOutputTokens": 200,
    "temperature": 0.7,
    "topP": 0.8,
    "topK": 40
  },
  "safetySettings": [...]
}
```
**Matches Genvoy contract**: Standard Gemini format

### 4. Response Parsing ✓
```javascript
const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
const tokens = data.usageMetadata;
```
**Matches Genvoy contract**: Extracts from `candidates[0].content.parts[0].text`

---

## 🧪 Test Your API Connection

Run this command in the backend folder:
```bash
npm run test-api
```

This will:
1. Test your API key
2. Send a simple request
3. Verify the response
4. Show token usage

Expected output:
```
✅ API Connection Successful!
📝 AI Response: Hello from Binary Decoders! 🎉...
📊 Token Usage: { promptTokenCount: X, candidatesTokenCount: Y }
🎉 Your Gemini API is working perfectly!
```

---

## 📋 API Contract Compliance

| Requirement | Our Implementation | Status |
|-------------|-------------------|--------|
| Method | POST | ✅ |
| Content-Type | application/json | ✅ |
| Auth Header | Ocp-Apim-Subscription-Key | ✅ |
| Endpoint Format | `/{model_name}/:generateContent` | ✅ |
| Request Schema | Gemini standard format | ✅ |
| Response Parsing | `candidates[0].content.parts[0].text` | ✅ |
| Safety Settings | All categories included | ✅ |
| Error Handling | Try-catch with fallback | ✅ |

---

## 🔧 Configuration Files

### Location of API Keys:
```
backend/src/agent/geminiService.js
Lines 10-11:
  const GEMINI_TEXT_API_KEY = "3057dfce551f4941ae42ecb8b72f5f93";
  const GEMINI_IMAGE_API_KEY = "bbef49c51dad4a7e8f8b5420c30e4f6c";
```

### How It Works:
1. **Backend starts** → Loads API keys from `geminiService.js`
2. **User sends message** → `/chat` endpoint receives it
3. **Intent extraction** → Gemini API called with TEXT key
4. **Response generation** → Gemini generates natural reply
5. **Fallback** → If API fails, uses rule-based system

---

## 📊 Token Limits & Performance

### Current Configuration:
- **Max Output Tokens**: 200 (for chat), 150 (for intent)
- **Temperature**: 0.7 (conversational), 0.2 (intent extraction)
- **Top P**: 0.8 (chat), 0.4 (intent)
- **Top K**: 40 (chat), 16 (intent)

### Why These Settings:
- **Chat**: More creative, natural responses
- **Intent**: More precise, structured output (JSON)

---

## 🚨 Troubleshooting

### Error: 401 Unauthorized
**Cause**: Invalid API key or expired  
**Solution**: 
- Check if current time is between 22 Jan 10:00 AM - 23 Jan 11:59 PM
- Verify key: `3057dfce551f4941ae42ecb8b72f5f93`

### Error: 429 Too Many Requests
**Cause**: Rate limit exceeded  
**Solution**: Wait a few seconds between requests

### Error: Network timeout
**Cause**: Flipkart internal network required  
**Solution**: Ensure you're on Flipkart VPN/network

### Bot gives generic responses
**Cause**: API call failed, using fallback mode  
**Solution**: Check logs for API errors, verify connectivity

---

## 🎯 Quick Verification Checklist

Before demo:
- [ ] Run `npm run test-api` - Should see "✅ API Connection Successful!"
- [ ] Start backend - `npm run dev`
- [ ] Start frontend - `npm run dev` (in frontend folder)
- [ ] Test basic chat - Type "show kurta"
- [ ] Test negotiation - Type "can you do ₹100 less?"
- [ ] Check AI responses are natural (not generic template)

---

## 📚 Reference

- **Genvoy Docs**: https://confluence.fkinternal.com/display/mlplatform/Genvoy+-+LLM+API+Contracts
- **Support**: Hackday 13_Official Forum
- **Team**: binarydecoders
- **Model**: Gemini 2.5 Flash

---

**Last Updated**: Jan 22, 2026  
**Status**: ✅ Ready for Hackathon
