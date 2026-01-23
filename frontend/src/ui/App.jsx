import React, { useMemo, useState, useEffect } from "react";
import { HaggleMeter } from "./HaggleMeter.jsx";
import { DealCard } from "./DealCard.jsx";
import { DealsPanel } from "./DealsPanel.jsx";
import { ImageUpload } from "./ImageUpload.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState("u_gold");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Welcome to AI-Powered Shopping! ✨\n\n🎯 Try these:\n• 'show kurta' - Browse products\n• 'show 2 kurtas' - Buy multiple items\n• 'add matching dupatta' - AI bundle suggestions\n• 'add matching dupatta for wedding' - Context-aware deals\n\nLet's find you the best deal! 🤝💰"
    }
  ]);
  const [haggleScore, setHaggleScore] = useState(0.1);
  const [dealDraft, setDealDraft] = useState(null);
  const [activeDeals, setActiveDeals] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const canSend = message.trim().length > 0;

  const tierLabel = useMemo(() => {
    if (userId === "u_bronze") return "Bronze";
    if (userId === "u_silver") return "Silver";
    return "Gold";
  }, [userId]);

  // Fetch active deals and purchases when sessionId changes
  useEffect(() => {
    if (!sessionId) return;

    async function fetchSessionData() {
      try {
        // Fetch active deals
        const dealsResp = await fetch(`${BACKEND_URL}/session/${sessionId}/deals`);
        if (dealsResp.ok) {
          const dealsData = await dealsResp.json();
          setActiveDeals(dealsData.deals || []);
        }

        // Fetch purchases
        const purchasesResp = await fetch(`${BACKEND_URL}/session/${sessionId}/purchases`);
        if (purchasesResp.ok) {
          const purchasesData = await purchasesResp.json();
          setPurchases(purchasesData.purchases || []);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      }
    }

    fetchSessionData();
  }, [sessionId]);

  function handleDealAccepted(dealId) {
    console.log("Deal accepted:", dealId);
    // Refresh session data
    if (sessionId) {
      // Move accepted deal from active to purchases
      const acceptedDeal = activeDeals.find(d => d.dealId === dealId);
      if (acceptedDeal) {
        setActiveDeals(activeDeals.filter(d => d.dealId !== dealId));
        setPurchases([...purchases, { ...acceptedDeal, acceptedAt: Date.now(), status: "accepted" }]);
      }
    }
  }

  async function send() {
    if (!canSend || isLoading) return;

    const userText = message;
    setMessage("");
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setIsLoading(true);

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

      // Refresh deals list after chat response
      if (data.sessionId) {
        setTimeout(async () => {
          try {
            const dealsResp = await fetch(`${BACKEND_URL}/session/${data.sessionId}/deals`);
            if (dealsResp.ok) {
              const dealsData = await dealsResp.json();
              setActiveDeals(dealsData.deals || []);
            }
          } catch (err) {
            console.error("Error refreshing deals:", err);
          }
        }, 200);
      }
    } catch (error) {
      console.error("❌ Frontend error:", error);
      setMessages((m) => [...m, { 
        role: "assistant", 
        text: "❌ Error: Could not connect to backend. Is it running on port 8080?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.title}>🤖✨ BinaryDecoders: AI Bargain Bot 🛍️💎</div>
        <div style={styles.controls}>
          <label style={styles.label}>👤 User Tier</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={styles.select}>
            <option value="u_bronze">🥉 Bronze</option>
            <option value="u_silver">🥈 Silver</option>
            <option value="u_gold">🥇 Gold</option>
          </select>
          <div style={styles.tierBadge}>
            {userId === "u_bronze" && "🥉"}
            {userId === "u_silver" && "🥈"}
            {userId === "u_gold" && "🥇"} {tierLabel}
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.mainColumn}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>💬 Chat with AI Assistant</div>
            <div style={styles.chatBox}>
              {messages.map((m, idx) => (
                <div key={idx} style={m.role === "user" ? styles.userBubble : styles.assistantBubble}>
                  <div style={styles.bubbleRole}>{m.role}</div>
                  <div style={styles.bubbleText}>{m.text}</div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <ImageUpload 
                onSearchComplete={(items) => {
                  if (items && items.length > 0) {
                    // Add message showing search results
                    setMessages((m) => [...m, {
                      role: "assistant",
                      text: `🎨 Found ${items.length} similar products from your image!\n\n${items.slice(0, 3).map((item, idx) => 
                        `${idx + 1}. ${item.title} - ₹${item.price}`
                      ).join('\n')}\n\nSay "show me [product name]" to see details and start bargaining!`
                    }]);
                  }
                }}
              />
            </div>
            <div style={styles.inputRow}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Type: show kurta / add matching dupatta / show 2 kurtas"
                style={styles.input}
              />
            <button 
              onClick={send} 
              disabled={!canSend || isLoading} 
              style={canSend && !isLoading ? styles.button : styles.buttonDisabled}
            >
              {isLoading ? "🤖 Thinking..." : "🚀 Send"}
            </button>
            </div>
            <div style={styles.smallText}>
              🔐 Session: {sessionId ? sessionId.slice(0, 8) + "..." : "🆕 New"}
            </div>
          </div>
        </div>

        <div style={styles.sideColumn}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>📊 Haggle Meter 🔥</div>
            <HaggleMeter score={haggleScore} />
          </div>

          <DealsPanel
            sessionId={sessionId}
            activeDeals={activeDeals}
            purchases={purchases}
            backendUrl={BACKEND_URL}
            onAccept={handleDealAccepted}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
    padding: 20,
    background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f3a 50%, #0f1628 100%)",
    minHeight: "100vh",
    color: "#e9ecf1",
    animation: "fadeIn 0.5s ease-in"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    padding: "16px 20px",
    background: "linear-gradient(135deg, #1a2847 0%, #0f1730 100%)",
    borderRadius: 16,
    border: "1px solid rgba(107, 156, 255, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    animation: "slideDown 0.5s ease-out"
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    background: "linear-gradient(135deg, #6b9cff 0%, #4ade80 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    letterSpacing: "-0.5px"
  },
  controls: {
    display: "flex",
    gap: 12,
    alignItems: "center"
  },
  label: { 
    fontSize: 13, 
    opacity: 0.9,
    fontWeight: 600,
    letterSpacing: "0.5px"
  },
  select: {
    background: "rgba(17, 26, 51, 0.8)",
    color: "#e9ecf1",
    border: "1px solid rgba(107, 156, 255, 0.3)",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: 500,
    outline: "none"
  },
  tierBadge: {
    padding: "8px 16px",
    borderRadius: 999,
    background: "linear-gradient(135deg, #2d458f 0%, #1a2847 100%)",
    border: "1px solid rgba(107, 156, 255, 0.4)",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: "0 4px 12px rgba(107, 156, 255, 0.2)",
    animation: "pulse 2s ease-in-out infinite"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    animation: "fadeIn 0.6s ease-in 0.2s backwards"
  },
  mainColumn: {
    display: "flex",
    flexDirection: "column"
  },
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxHeight: "85vh",
    overflow: "auto",
    scrollbarWidth: "thin",
    scrollbarColor: "#2d458f #0f1730"
  },
  card: {
    background: "linear-gradient(135deg, rgba(15, 23, 48, 0.9) 0%, rgba(26, 40, 71, 0.7) 100%)",
    border: "1px solid rgba(107, 156, 255, 0.2)",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    animation: "slideUp 0.5s ease-out"
  },
  cardTitle: {
    fontWeight: 800,
    marginBottom: 14,
    fontSize: 16,
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  chatBox: {
    height: 450,
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(107, 156, 255, 0.15)",
    background: "rgba(11, 16, 32, 0.6)",
    backdropFilter: "blur(10px)",
    scrollbarWidth: "thin",
    scrollbarColor: "#2d458f rgba(11, 16, 32, 0.6)"
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    background: "linear-gradient(135deg, #2d458f 0%, #1b2a55 100%)",
    border: "1px solid rgba(107, 156, 255, 0.4)",
    borderRadius: "18px 18px 4px 18px",
    padding: 14,
    boxShadow: "0 4px 16px rgba(45, 69, 143, 0.3)",
    animation: "slideInRight 0.3s ease-out",
    transition: "transform 0.2s ease"
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    background: "linear-gradient(135deg, rgba(17, 26, 51, 0.9) 0%, rgba(36, 50, 90, 0.7) 100%)",
    border: "1px solid rgba(74, 222, 128, 0.2)",
    borderRadius: "18px 18px 18px 4px",
    padding: 14,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    animation: "slideInLeft 0.3s ease-out",
    transition: "transform 0.2s ease"
  },
  bubbleRole: { 
    fontSize: 11, 
    opacity: 0.8, 
    marginBottom: 6,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  bubbleText: { 
    whiteSpace: "pre-wrap", 
    lineHeight: 1.5,
    fontSize: 14
  },
  inputRow: {
    display: "flex",
    gap: 12,
    marginTop: 16
  },
  input: {
    flex: 1,
    background: "rgba(11, 16, 32, 0.8)",
    color: "#e9ecf1",
    border: "1px solid rgba(107, 156, 255, 0.3)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    outline: "none",
    transition: "all 0.3s ease",
    boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.3)"
  },
  button: {
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 16px rgba(74, 222, 128, 0.4)",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden"
  },
  buttonDisabled: {
    background: "linear-gradient(135deg, #1b2440 0%, #0f1730 100%)",
    color: "#95a0c0",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    cursor: "not-allowed",
    fontWeight: 700,
    fontSize: 14,
    opacity: 0.6
  },
  side: { display: "flex", flexDirection: "column", gap: 16 },
  smallText: { 
    marginTop: 10, 
    fontSize: 12, 
    opacity: 0.7,
    fontFamily: "monospace",
    padding: "6px 12px",
    background: "rgba(107, 156, 255, 0.1)",
    borderRadius: 8,
    display: "inline-block"
  }
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideInLeft {
    from {
      transform: translateX(-20px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 4px 12px rgba(107, 156, 255, 0.2);
    }
    50% {
      box-shadow: 0 4px 20px rgba(107, 156, 255, 0.4);
    }
  }
  
  /* Hover effects */
  button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(74, 222, 128, 0.6);
  }
  
  button:not(:disabled):active {
    transform: translateY(0);
  }
  
  select:hover {
    border-color: rgba(107, 156, 255, 0.6);
    box-shadow: 0 0 12px rgba(107, 156, 255, 0.3);
  }
  
  input:focus {
    border-color: rgba(107, 156, 255, 0.6);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 16px rgba(107, 156, 255, 0.3);
  }
  
  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(11, 16, 32, 0.6);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #2d458f 0%, #1a2847 100%);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #3d55af 0%, #2a3867 100%);
  }
  
  /* Card hover effect */
  [style*="background: linear-gradient(135deg, rgba(15, 23, 48"]:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  }
`;
document.head.appendChild(styleSheet);
