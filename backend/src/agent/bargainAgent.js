import { randomUUID } from "crypto";
import { getOrCreateSession, saveDealDraft } from "../store/sessionStore.js";
import { loadUsers } from "../store/userStore.js";
import { searchCatalog, suggestMatches } from "./tools.js";
import { computeOffer } from "./policy.js";
import { parseIntentMock } from "./mockNlu.js";
import { extractIntent, chatWithGemini } from "./geminiService.js";

export async function bargainAgent({ userId, sessionId, message }) {
  const session = getOrCreateSession(sessionId);
  const users = await loadUsers();
  const user = users.users.find((u) => u.userId === userId) || users.users[0];

  // Try Gemini for better intent extraction, fallback to mock if fails
  let intent;
  try {
    intent = await extractIntent(message);
    if (!intent) {
      intent = parseIntentMock(message);
    }
  } catch (error) {
    console.error("Intent extraction error:", error);
    intent = parseIntentMock(message);
  }

  let selectedBase = session.context.selectedBase;
  if (intent.baseQuery) {
    const baseResults = await searchCatalog(intent.baseQuery);
    selectedBase = baseResults[0] || null;
    session.context.selectedBase = selectedBase;
  }

  if (!selectedBase) {
    return {
      sessionId: session.sessionId,
      replyText:
        "Tell me what you want to buy (example: 'show kurta' or 'I want a blue kurta').",
      haggleScore: 0.1,
      dealDraft: null
    };
  }

  const matchItems = intent.wantMatch
    ? await suggestMatches(selectedBase)
    : [];

  const bundleItems = [selectedBase];
  if (matchItems.length > 0) {
    bundleItems.push(matchItems[0]);
  }

  const offer = computeOffer({
    user,
    items: bundleItems,
    userAskedDiscount: intent.requestedDiscountAmount,
    attempt: session.context.attempt || 0
  });

  session.context.attempt = (session.context.attempt || 0) + 1;

  const dealId = randomUUID();
  const dealDraft = {
    dealId,
    currency: "INR",
    items: bundleItems.map((p) => ({
      sku: p.sku,
      title: p.title,
      price: p.price
    })),
    originalTotal: offer.originalTotal,
    finalTotal: offer.finalTotal,
    discountTotal: offer.discountTotal,
    reason: offer.reason
  };

  saveDealDraft(session.sessionId, dealDraft);

  // Try to get a more natural response from Gemini
  const geminiContext = {
    userTier: user.tier,
    selectedProduct: selectedBase.title,
    bundleCount: bundleItems.length,
    currentDiscount: offer.discountTotal
  };

  let replyText;
  try {
    const geminiReply = await chatWithGemini(message, geminiContext);
    if (geminiReply) {
      // Enhance Gemini response with deal details
      replyText = buildEnhancedReply({ geminiReply, selectedBase, matchItems, offer });
    } else {
      replyText = buildReply({ user, selectedBase, matchItems, offer });
    }
  } catch (error) {
    console.error("Gemini chat error:", error);
    // Fallback to default reply
    replyText = buildReply({ user, selectedBase, matchItems, offer });
  }

  return {
    sessionId: session.sessionId,
    replyText,
    haggleScore: offer.haggleScore,
    dealDraft
  };
}

function buildReply({ user, selectedBase, matchItems, offer }) {
  const baseLine = `Selected: ${selectedBase.title} (₹${selectedBase.price}).`;
  const matchLine =
    matchItems.length > 0
      ? `Matching add-on: ${matchItems[0].title} (₹${matchItems[0].price}).`
      : "Want a matching add-on? Say 'add matching dupatta'.";

  const tierLine = `Loyalty: ${user.tier.toUpperCase()}.`;

  const offerLine =
    offer.accepted
      ? `Done. I can do ₹${offer.finalTotal} (you save ₹${offer.discountTotal}).`
      : `I can't go that low. Best I can do is ₹${offer.finalTotal} (save ₹${offer.discountTotal}).`;

  const reasonLine = offer.reason ? `Reason: ${offer.reason}` : "";

  return [baseLine, matchLine, tierLine, offerLine, reasonLine]
    .filter(Boolean)
    .join("\n");
}

function buildEnhancedReply({ geminiReply, selectedBase, matchItems, offer }) {
  const dealLine = `💰 Deal: ₹${offer.finalTotal} (save ₹${offer.discountTotal})`;
  const itemsLine = matchItems.length > 0 
    ? `📦 Bundle: ${selectedBase.title} + ${matchItems[0].title}`
    : `📦 Item: ${selectedBase.title}`;
  
  return `${geminiReply}\n\n${itemsLine}\n${dealLine}`;
}
