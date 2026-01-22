/**
 * Quick API Test Script
 * Tests Gemini 2.5 Flash connection with your API keys
 */

const GEMINI_API_URL = "http://genvoy.jarvis-prod.fkcloud.in/gemini-2.5-flash/:generateContent";
const TEXT_API_KEY = "3057dfce551f4941ae42ecb8b72f5f93";
const IMAGE_API_KEY = "bbef49c51dad4a7e8f8b5420c30e4f6c";

async function testTextAPI() {
  console.log("🧪 Testing Gemini 2.5 Flash (Text Model)...\n");

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": TEXT_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Say 'Hello from Binary Decoders!' in a friendly way"
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    console.log("✅ API Connection Successful!\n");
    console.log("📝 AI Response:", aiResponse);
    console.log("\n📊 Token Usage:", data.usageMetadata);
    console.log("\n🎉 Your Gemini API is working perfectly!");
  } catch (error) {
    console.error("❌ Test Failed:", error.message);
    console.log("\n💡 Possible issues:");
    console.log("   - Check if you're within the valid time window (22-23 Jan)");
    console.log("   - Verify network connectivity");
    console.log("   - Ensure API keys are correct");
  }
}

// Run the test
console.log("========================================");
console.log("BINARY DECODERS - API TEST");
console.log("Team: binarydecoders");
console.log("========================================\n");

testTextAPI();
