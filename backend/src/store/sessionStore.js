import { randomUUID } from "crypto";

const sessions = new Map();

/**
 * Get or create a session with proper structure
 * Session now maintains:
 * - activeDeals: Current deals being negotiated (not accepted yet)
 * - purchaseHistory: Accepted deals (completed purchases)
 * - context: Current conversation context
 */
export function getOrCreateSession(sessionId) {
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }

  const sid = sessionId || randomUUID();
  const session = {
    sessionId: sid,
    createdAt: Date.now(),
    context: {
      selectedBase: null,
      attempt: 0
    },
    activeDeals: new Map(), // dealId -> deal object
    purchaseHistory: [], // Accepted deals
    dealDrafts: [], // Legacy support
    chatHistory: [] // Conversation history: [{role: "user"/"assistant", content: "...", timestamp: ...}]
  };

  sessions.set(sid, session);
  return session;
}

/**
 * Save or update an active deal
 * Each product/bundle gets its own deal that persists until accepted
 */
export function saveDealDraft(sessionId, dealDraft) {
  const session = getOrCreateSession(sessionId);
  
  // Store in activeDeals Map by dealId
  session.activeDeals.set(dealDraft.dealId, {
    ...dealDraft,
    updatedAt: Date.now()
  });

  // Keep legacy dealDrafts array in sync for backward compatibility
  const existingIndex = session.dealDrafts.findIndex(d => d.dealId === dealDraft.dealId);
  if (existingIndex >= 0) {
    session.dealDrafts[existingIndex] = dealDraft;
  } else {
    session.dealDrafts.push(dealDraft);
  }
  
  // Limit to 20 active deals
  if (session.activeDeals.size > 20) {
    const oldestKey = Array.from(session.activeDeals.keys())[0];
    session.activeDeals.delete(oldestKey);
  }

  console.log(`💾 [Session] Saved deal ${dealDraft.dealId} (${dealDraft.items.length} items)`);
  console.log(`📊 [Session] Active deals: ${session.activeDeals.size}, Purchases: ${session.purchaseHistory.length}`);
}

/**
 * Accept a deal and move it to purchase history
 */
export function acceptDealDraft(sessionId, dealId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const deal = session.activeDeals.get(dealId);
  if (!deal) {
    console.log(`⚠️  [Session] Deal ${dealId} not found in active deals`);
    return null;
  }

  // Move to purchase history
  const purchase = { 
    ...deal, 
    acceptedAt: Date.now(),
    status: "accepted"
  };
  
  session.purchaseHistory.push(purchase);
  
  // Remove from active deals
  session.activeDeals.delete(dealId);

  console.log(`✅ [Session] Deal ${dealId} accepted and moved to purchase history`);
  console.log(`🛒 [Session] Total purchases: ${session.purchaseHistory.length}`);

  return purchase;
}

/**
 * Get all active deals for a session
 */
export function getActiveDeals(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  
  return Array.from(session.activeDeals.values());
}

/**
 * Get purchase history for a session
 */
export function getPurchaseHistory(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return [];
  
  return session.purchaseHistory;
}

/**
 * Get a specific deal by ID
 */
export function getDealById(sessionId, dealId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  return session.activeDeals.get(dealId) || null;
}

/**
 * Get session summary (for debugging/display)
 */
export function getSessionSummary(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const activeDeals = Array.from(session.activeDeals.values());
  const totalActiveValue = activeDeals.reduce((sum, d) => sum + d.offer.finalTotal, 0);
  const totalPurchaseValue = session.purchaseHistory.reduce((sum, p) => sum + p.offer.finalTotal, 0);

  return {
    sessionId: session.sessionId,
    activeDeals: activeDeals.length,
    activeDealsList: activeDeals.map(d => ({
      dealId: d.dealId,
      items: d.items.map(i => i.title),
      total: d.offer.finalTotal
    })),
    purchases: session.purchaseHistory.length,
    purchasesList: session.purchaseHistory.map(p => ({
      dealId: p.dealId,
      items: p.items.map(i => i.title),
      total: p.offer.finalTotal,
      acceptedAt: new Date(p.acceptedAt).toISOString()
    })),
    totalActiveValue,
    totalPurchaseValue
  };
}
