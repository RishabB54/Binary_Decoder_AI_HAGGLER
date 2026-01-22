import React, { useMemo, useState } from "react";
import { HaggleMeter } from "./HaggleMeter.jsx";
import { DealCard } from "./DealCard.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState("u_gold");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Try: ‘show kurta’ then ‘add matching dupatta ₹100 less’"
    }
  ]);
  const [haggleScore, setHaggleScore] = useState(0.1);
  const [dealDraft, setDealDraft] = useState(null);

  const canSend = message.trim().length > 0;

  const tierLabel = useMemo(() => {
    if (userId === "u_bronze") return "Bronze";
    if (userId === "u_silver") return "Silver";
    return "Gold";
  }, [userId]);

  async function send() {
    if (!canSend) return;

    const userText = message;
    setMessage("");
    setMessages((m) => [...m, { role: "user", text: userText }]);

    try {
      console.log("📤 Sending to backend:", userText);
      
      const resp = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, sessionId, message: userText })
      });

      console.log("📥 Response status:", resp.status);
      
      const data = await resp.json();
      console.log("📥 Response data:", data);
      
      if (data.sessionId) setSessionId(data.sessionId);
      if (typeof data.haggleScore === "number") setHaggleScore(data.haggleScore);
      setDealDraft(data.dealDraft || null);

      setMessages((m) => [...m, { role: "assistant", text: data.replyText || "(no reply)" }]);
    } catch (error) {
      console.error("❌ Frontend error:", error);
      setMessages((m) => [...m, { 
        role: "assistant", 
        text: "Error: Could not connect to backend. Is it running on port 8080?" 
      }]);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>🛍️ BinaryDecoders: AI Bargain Bot</div>
        <div style={styles.controls}>
          <label style={styles.label}>User Tier</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={styles.select}>
            <option value="u_bronze">Bronze</option>
            <option value="u_silver">Silver</option>
            <option value="u_gold">Gold</option>
          </select>
          <div style={styles.tierBadge}>{tierLabel}</div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Chat</div>
          <div style={styles.chatBox}>
            {messages.map((m, idx) => (
              <div key={idx} style={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
                <div style={styles.bubbleRole}>{m.role}</div>
                <div style={styles.bubbleText}>{m.text}</div>
              </div>
            ))}
          </div>
          <div style={styles.inputRow}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type: show kurta / add matching dupatta ₹100 less"
              style={styles.input}
            />
            <button onClick={send} disabled={!canSend} style={canSend ? styles.button : styles.buttonDisabled}>
              Send
            </button>
          </div>
          <div style={styles.smallText}>Session: {sessionId || "(new)"}</div>
        </div>

        <div style={styles.side}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Haggle Meter</div>
            <HaggleMeter score={haggleScore} />
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>Deal Card</div>
            <DealCard backendUrl={BACKEND_URL} sessionId={sessionId} dealDraft={dealDraft} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
    padding: 16,
    background: "#0b1020",
    minHeight: "100vh",
    color: "#e9ecf1"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: 700
  },
  controls: {
    display: "flex",
    gap: 8,
    alignItems: "center"
  },
  label: { fontSize: 12, opacity: 0.8 },
  select: {
    background: "#111a33",
    color: "#e9ecf1",
    border: "1px solid #24325a",
    borderRadius: 8,
    padding: "6px 10px"
  },
  tierBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#111a33",
    border: "1px solid #24325a",
    fontSize: 12
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.2fr 0.8fr",
    gap: 16
  },
  card: {
    background: "#0f1730",
    border: "1px solid #24325a",
    borderRadius: 14,
    padding: 14
  },
  cardTitle: {
    fontWeight: 700,
    marginBottom: 10
  },
  chatBox: {
    height: 420,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 8,
    borderRadius: 12,
    border: "1px solid #24325a",
    background: "#0b1020"
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    background: "#1b2a55",
    border: "1px solid #2d458f",
    borderRadius: 12,
    padding: 10
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    background: "#111a33",
    border: "1px solid #24325a",
    borderRadius: 12,
    padding: 10
  },
  bubbleRole: { fontSize: 11, opacity: 0.7, marginBottom: 4 },
  bubbleText: { whiteSpace: "pre-wrap", lineHeight: 1.35 },
  inputRow: {
    display: "flex",
    gap: 10,
    marginTop: 10
  },
  input: {
    flex: 1,
    background: "#0b1020",
    color: "#e9ecf1",
    border: "1px solid #24325a",
    borderRadius: 10,
    padding: "10px 12px"
  },
  button: {
    background: "#2d458f",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700
  },
  buttonDisabled: {
    background: "#1b2440",
    color: "#95a0c0",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "not-allowed",
    fontWeight: 700
  },
  side: { display: "flex", flexDirection: "column", gap: 16 },
  smallText: { marginTop: 8, fontSize: 12, opacity: 0.7 }
};
