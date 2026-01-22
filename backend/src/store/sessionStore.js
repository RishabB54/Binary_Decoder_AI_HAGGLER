import { randomUUID } from "crypto";

const sessions = new Map();

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
    dealDrafts: []
  };

  sessions.set(sid, session);
  return session;
}

export function saveDealDraft(sessionId, dealDraft) {
  const session = getOrCreateSession(sessionId);
  session.dealDrafts.push({ ...dealDraft, createdAt: Date.now() });
  if (session.dealDrafts.length > 10) {
    session.dealDrafts.shift();
  }
}

export function acceptDealDraft(sessionId, dealId) {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const deal = session.dealDrafts.find((d) => d.dealId === dealId);
  if (!deal) return null;

  return { ...deal, acceptedAt: Date.now() };
}
