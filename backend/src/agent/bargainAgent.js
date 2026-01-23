import { randomUUID } from "crypto";
import { getOrCreateSession, saveDealDraft } from "../store/sessionStore.js";
import { loadUsers } from "../store/userStore.js";
import { searchCatalog, suggestMatches } from "./tools.js";
import { computeOffer } from "./policy.js";
import { parseIntentMock } from "./mockNlu.js";
import { extractIntent, chatWithGemini } from "./geminiService.js";
import { getSmartBundleSuggestions, detectOccasion } from "./smartBundles.js";

export async function bargainAgent({ userId, sessionId, message }) {
  const session = getOrCreateSession(sessionId);
  const users = await loadUsers();
  const user = users.users.find((u) => u.userId === userId) || users.users[0];

  // AI-First: Gemini handles intent parsing (smart!)
  // Only fallback to basic parsing if API is down
  let intent;
  try {
    intent = await extractIntent(message);
    if (intent) {
      console.log("🤖 [Agent] Using AI intent extraction (Gemini)");
    } else {
      console.log("⚠️  [Agent] Gemini unavailable, using fallback parser");
      intent = parseIntentMock(message);
    }
  } catch (error) {
    console.error("⚠️  [Agent] AI extraction failed:", error.message);
    console.log("📦 [Agent] Falling back to basic parser");
    intent = parseIntentMock(message);
  }

  let selectedBase = session.context.selectedBase;
  let quantity = intent.quantity || 1;
  
  // Handle product search
  if (intent.baseQuery) {
    const baseResults = await searchCatalog(intent.baseQuery);
    selectedBase = baseResults[0] || null;
    session.context.selectedBase = selectedBase;
    // Reset quantity to 1 for new product (unless explicitly set)
    if (!intent.quantity) {
      quantity = 1;
    }
    // Reset discount tracking for new product
    session.context.lastDiscount = 0;
    session.context.attempt = 0;
  } else if (intent.quantity && intent.quantity > 1 && selectedBase) {
    // Quantity update for existing product (e.g., "i will take 4 of those")
    quantity = intent.quantity;
    console.log(`📦 [Agent] Updating quantity to ${quantity} for existing product: ${selectedBase.title}`);
  } else if (selectedBase) {
    // Keep existing quantity if no change requested
    quantity = session.context.quantity || 1;
  }
  
  // Save quantity to context
  session.context.quantity = quantity;

  // Handle discount-only requests (when product already selected)
  const isDiscountOnlyRequest = !intent.baseQuery && 
                                 (intent.requestedDiscountAmount !== null || 
                                  intent.requestedDiscountPercent !== null) &&
                                 selectedBase !== null;

  // If no product selected and not a discount negotiation, let AI suggest alternatives
  if (!selectedBase && !isDiscountOnlyRequest) {
    // Get available products for AI to suggest
    const catalog = await searchCatalog("");
    const availableProducts = catalog.map(p => `${p.category} (${p.title})`).join(", ");
    
    // Let Gemini suggest alternatives intelligently
    const geminiContext = {
      userTier: user.tier,
      userMessage: message,
      requestedProduct: intent.baseQuery || "unknown",
      availableProducts: availableProducts
    };
    
    // Get chat history
    const chatHistory = session.chatHistory || [];
    
    let replyText;
    try {
      const aiReply = await chatWithGemini(message, geminiContext, chatHistory);
      if (aiReply) {
        replyText = aiReply;
      } else {
        replyText = `I don't have "${intent.baseQuery}" right now. Available: ${availableProducts}. Try "show jeans" or "show kurta"!`;
      }
    } catch (error) {
      replyText = `I don't have "${intent.baseQuery}" right now. Available: ${availableProducts}. Try "show jeans" or "show kurta"!`;
    }
    
    // Save to chat history
    if (!session.chatHistory) session.chatHistory = [];
    session.chatHistory.push(
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: replyText, timestamp: Date.now() }
    );
    if (session.chatHistory.length > 20) {
      session.chatHistory = session.chatHistory.slice(-20);
    }
    
    return {
      sessionId: session.sessionId,
      replyText,
      haggleScore: 0.1,
      dealDraft: null
    };
  }

  // If discount request but no product, ask for product first
  if (!selectedBase && isDiscountOnlyRequest) {
    const replyText = "First, tell me what you'd like to buy (example: 'show kurta'), then we can negotiate the price!";
    
    // Save to chat history
    if (!session.chatHistory) session.chatHistory = [];
    session.chatHistory.push(
      { role: "user", content: message, timestamp: Date.now() },
      { role: "assistant", content: replyText, timestamp: Date.now() }
    );
    if (session.chatHistory.length > 20) {
      session.chatHistory = session.chatHistory.slice(-20);
    }

    return {
      sessionId: session.sessionId,
      replyText,
      haggleScore: 0.1,
      dealDraft: null
    };
  }

  // Build bundle items with quantities
  // Format: [{ product, quantity }]
  let bundleItems = [];
  let aiSuggestion = null;
  
  // Add base item with quantity
  bundleItems.push({ product: selectedBase, quantity: quantity });
  // Handle matching/bundle requests
  if (intent.wantMatch) {
    try {
      const occasion = detectOccasion(message);
      const smartBundles = await getSmartBundleSuggestions({
        userMessage: message,
        selectedProduct: selectedBase,
        userTier: user.tier,
        occasion
      });

      if (smartBundles.length > 0) {
        // Use the top AI-suggested bundle
        aiSuggestion = smartBundles[0];
        // Convert AI items to bundleItems format (keep base item, add matches)
        bundleItems = [
          { product: selectedBase, quantity: quantity },
          ...aiSuggestion.items
            .filter(p => p.sku !== selectedBase.sku)
            .map(p => ({ product: p, quantity: 1 }))
        ];
        console.log("✅ [Agent] Using AI bundle:", aiSuggestion.name);
      } else {
        // Fallback to traditional matching
        const matchItems = await suggestMatches(selectedBase);
        if (matchItems.length > 0) {
          bundleItems.push({ product: matchItems[0], quantity: 1 });
        }
      }
    } catch (error) {
      console.error("⚠️  [Agent] Smart bundle failed, using fallback");
      // Fallback to traditional matching
      const matchItems = await suggestMatches(selectedBase);
      if (matchItems.length > 0) {
        bundleItems.push({ product: matchItems[0], quantity: 1 });
      }
    }
  }

  // Expand bundleItems with quantities into flat array for pricing
  // E.g., [{product: kurta, qty: 2}] becomes [kurta, kurta]
  const expandedItems = [];
  for (const item of bundleItems) {
    for (let i = 0; i < item.quantity; i++) {
      expandedItems.push(item.product);
    }
  }

  // Smart attempt tracking: Only penalize if user keeps asking for same/less discount
  // If they ask for MORE discount, don't penalize - they're negotiating upward!
  const lastDiscount = session.context.lastDiscount || 0;
  const requestedDiscount = intent.requestedDiscountAmount;
  
  // If user asks for MORE discount than we gave before, reset attempt penalty
  // This encourages negotiation rather than penalizing it
  const isNegotiatingUp = requestedDiscount !== null && requestedDiscount > lastDiscount;
  const attemptToUse = isNegotiatingUp ? 0 : (session.context.attempt || 0);
  
  const offer = computeOffer({
    user,
    items: expandedItems,
    userAskedDiscount: intent.requestedDiscountAmount,
    attempt: attemptToUse,
    previousDiscount: session.context.lastDiscount || 0
  });

  // Increment attempt only if user is NOT negotiating upward
  // This prevents penalty when user asks for more discount
  if (!isNegotiatingUp && intent.requestedDiscountAmount !== null) {
    session.context.attempt = (session.context.attempt || 0) + 1;
  } else if (isNegotiatingUp) {
    // Reset attempt when negotiating upward - fresh start!
    session.context.attempt = 0;
  }
  
  // Save current discount for next comparison
  session.context.lastDiscount = offer.discountTotal;

  const dealId = randomUUID();
  const dealDraft = {
    dealId,
    currency: "INR",
    items: bundleItems.map((item) => ({
      sku: item.product.sku,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity
    })),
    originalTotal: offer.originalTotal,
    finalTotal: offer.finalTotal,
    discountTotal: offer.discountTotal,
    reason: offer.reason,
    offer: offer // Store full offer details
  };

  saveDealDraft(session.sessionId, dealDraft);

  // Get previous deals for context
  const previousDeals = Array.from(session.activeDeals.values())
    .filter(d => d.dealId !== dealId) // Exclude current deal
    .slice(-5); // Last 5 deals
  
  // Get purchase history
  const purchaseHistory = session.purchaseHistory.slice(-5);
  
  // Get chat history
  const chatHistory = session.chatHistory || [];

  // Build product details for explaining specialty
  const productDetails = bundleItems.map(item => ({
    name: item.product.title,
    brand: item.product.brand || "Premium Brand",
    category: item.product.category,
    price: item.product.price,
    description: item.product.description || `${item.product.title} - High quality ${item.product.category}`,
    tags: item.product.tags || [],
    quantity: item.quantity
  }));

  // Pass FULL context to Gemini - let it be smart!
  const geminiContext = {
    userTier: user.tier,
    selectedProduct: selectedBase.title,
    bundleCount: bundleItems.length,
    cartItems: bundleItems.map(item => ({
      name: item.product.title,
      quantity: item.quantity,
      price: item.product.price,
      subtotal: item.product.price * item.quantity
    })),
    productDetails: productDetails, // Full product info for explaining specialty
    originalTotal: offer.originalTotal,
    currentDiscount: offer.discountTotal,
    finalPrice: offer.finalTotal,
    discountPercent: Math.round((offer.discountTotal / offer.originalTotal) * 100) || 0,
    accepted: offer.accepted,
    attempt: session.context.attempt || 0,
    reason: offer.reason,
    aiBundle: aiSuggestion ? aiSuggestion.name : null,
    bundleReason: aiSuggestion ? aiSuggestion.reason : null,
    previousQuantity: session.context.quantity || 1,
    currentQuantity: quantity,
    previousDeals: [...previousDeals, ...purchaseHistory] // Include both active and accepted deals
  };

  let replyText;
  try {
    const geminiReply = await chatWithGemini(message, geminiContext, chatHistory);
    if (geminiReply) {
      // Enhance Gemini response with deal details
      replyText = buildEnhancedReply({ 
        geminiReply, 
        bundleItems, 
        offer, 
        aiSuggestion 
      });
    } else {
      replyText = buildReply({ 
        user, 
        bundleItems, 
        offer, 
        aiSuggestion 
      });
    }
  } catch (error) {
    console.error("Gemini chat error:", error);
    // Fallback to default reply
    replyText = buildReply({ 
      user, 
      bundleItems, 
      offer, 
      aiSuggestion 
    });
  }

  // Save to chat history
  if (!session.chatHistory) {
    session.chatHistory = [];
  }
  session.chatHistory.push(
    { role: "user", content: message, timestamp: Date.now() },
    { role: "assistant", content: replyText, timestamp: Date.now() }
  );
  
  // Keep only last 20 messages (10 exchanges)
  if (session.chatHistory.length > 20) {
    session.chatHistory = session.chatHistory.slice(-20);
  }

  return {
    sessionId: session.sessionId,
    replyText,
    haggleScore: offer.haggleScore,
    dealDraft
  };
}

function buildReply({ user, bundleItems, offer, aiSuggestion }) {
  // Build items display with quantities
  const itemLines = bundleItems.map(item => {
    const qtyText = item.quantity > 1 ? ` x${item.quantity}` : '';
    const subtotal = item.product.price * item.quantity;
    return `  • ${item.product.title}${qtyText} (₹${item.product.price} each = ₹${subtotal})`;
  });

  const itemsSection = bundleItems.length === 1 && bundleItems[0].quantity === 1
    ? `Selected: ${bundleItems[0].product.title} (₹${bundleItems[0].product.price})`
    : `Your Bundle:\n${itemLines.join('\n')}`;
  
  let specialNote = "";
  if (aiSuggestion) {
    specialNote = `\n🤖 AI Suggestion: "${aiSuggestion.name}" - ${aiSuggestion.reason}`;
  } else if (bundleItems.length === 1 && bundleItems[0].quantity === 1) {
    specialNote = "\n💡 Want a matching add-on? Say 'add matching dupatta'.";
  }

  const tierLine = `Loyalty Tier: ${user.tier.toUpperCase()}`;

  const offerLine =
    offer.accepted
      ? `✅ Done! Final price: ₹${offer.finalTotal} (you save ₹${offer.discountTotal})`
      : `💰 Best I can do: ₹${offer.finalTotal} (save ₹${offer.discountTotal})`;

  const reasonLine = offer.reason ? `📝 ${offer.reason}` : "";

  return [itemsSection, specialNote, tierLine, offerLine, reasonLine]
    .filter(Boolean)
    .join("\n");
}

function buildEnhancedReply({ geminiReply, bundleItems, offer, aiSuggestion }) {
  const dealLine = `💰 Deal: ₹${offer.finalTotal} (save ₹${offer.discountTotal})`;
  
  let itemsLine;
  if (aiSuggestion) {
    const itemsList = bundleItems.map(item => {
      const qtyText = item.quantity > 1 ? ` x${item.quantity}` : '';
      return `${item.product.title}${qtyText}`;
    }).join(" + ");
    itemsLine = `🤖 ${aiSuggestion.name}: ${itemsList}`;
  } else if (bundleItems.length > 1 || bundleItems[0].quantity > 1) {
    const itemsList = bundleItems.map(item => {
      const qtyText = item.quantity > 1 ? ` x${item.quantity}` : '';
      return `${item.product.title}${qtyText}`;
    }).join(" + ");
    itemsLine = `📦 Bundle: ${itemsList}`;
  } else {
    itemsLine = `📦 Item: ${bundleItems[0].product.title}`;
  }
  
  return `${geminiReply}\n\n${itemsLine}\n${dealLine}`;
}
