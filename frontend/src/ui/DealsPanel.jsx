/**
 * Deals Panel - Shows all active deals and purchase history
 */
import React from "react";

export function DealsPanel({ sessionId, activeDeals, purchases, backendUrl, onAccept }) {
  const [accepting, setAccepting] = React.useState(null);

  async function acceptDeal(dealId) {
    setAccepting(dealId);
    try {
      const resp = await fetch(`${backendUrl}/deal/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, dealId })
      });
      
      if (resp.ok) {
        onAccept && onAccept(dealId);
      } else {
        console.error("Failed to accept deal");
      }
    } catch (error) {
      console.error("Error accepting deal:", error);
    } finally {
      setAccepting(null);
    }
  }

  return (
    <div style={styles.container}>
      {/* Active Deals Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          🛒 Active Deals ({activeDeals.length})
        </div>
        {activeDeals.length === 0 ? (
          <div style={styles.empty}>No active deals yet. Start shopping!</div>
        ) : (
          <div style={styles.dealsList}>
            {activeDeals.map((deal) => (
              <div key={deal.dealId} style={styles.dealCard}>
                <div style={styles.dealHeader}>
                  <div style={styles.dealId}>Deal #{deal.dealId.slice(0, 8)}</div>
                </div>
                
                <div style={styles.items}>
                  {deal.items.map((item, idx) => (
                    <div key={idx} style={styles.item}>
                      <span>{item.title}</span>
                      {item.quantity > 1 && (
                        <span style={styles.quantity}> x{item.quantity}</span>
                      )}
                      <span style={styles.price}>₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.totals}>
                  <div style={styles.totalRow}>
                    <span>Original:</span>
                    <span style={styles.strikethrough}>₹{deal.originalTotal}</span>
                  </div>
                  <div style={styles.totalRow}>
                    <span>Discount:</span>
                    <span style={styles.discount}>-₹{deal.discountTotal}</span>
                  </div>
                  <div style={{...styles.totalRow, ...styles.finalTotal}}>
                    <span>Final:</span>
                    <span>₹{deal.finalTotal}</span>
                  </div>
                </div>

                {deal.reason && (
                  <div style={styles.reason}>📝 {deal.reason}</div>
                )}

                <button
                  onClick={() => acceptDeal(deal.dealId)}
                  disabled={accepting === deal.dealId}
                  style={accepting === deal.dealId ? styles.buttonDisabled : styles.button}
                >
                  {accepting === deal.dealId ? "Accepting..." : "✅ Accept Deal"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchase History Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          🎉 Purchase History ({purchases.length})
        </div>
        {purchases.length === 0 ? (
          <div style={styles.empty}>No purchases yet. Accept a deal to see it here!</div>
        ) : (
          <div style={styles.purchasesList}>
            {purchases.map((purchase) => (
              <div key={purchase.dealId} style={styles.purchaseCard}>
                <div style={styles.purchaseHeader}>
                  <div style={styles.purchaseStatus}>✅ Completed</div>
                  <div style={styles.purchaseDate}>
                    {new Date(purchase.acceptedAt).toLocaleString()}
                  </div>
                </div>
                
                <div style={styles.purchaseItems}>
                  {purchase.items.map((item, idx) => (
                    <span key={idx} style={styles.purchaseItem}>
                      {item.title}
                      {item.quantity > 1 && ` x${item.quantity}`}
                      {idx < purchase.items.length - 1 && " + "}
                    </span>
                  ))}
                </div>

                <div style={styles.purchaseTotal}>
                  Paid: ₹{purchase.finalTotal} 
                  <span style={styles.saved}> (Saved ₹{purchase.discountTotal})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {(activeDeals.length > 0 || purchases.length > 0) && (
        <div style={styles.summary}>
          <div style={styles.summaryTitle}>📊 Session Summary</div>
          <div style={styles.summaryRow}>
            <span>Active Deals Value:</span>
            <span>₹{activeDeals.reduce((sum, d) => sum + d.finalTotal, 0)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Total Purchased:</span>
            <span>₹{purchases.reduce((sum, p) => sum + p.finalTotal, 0)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Total Saved:</span>
            <span style={styles.savedBig}>
              ₹{purchases.reduce((sum, p) => sum + p.discountTotal, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 20
  },
  section: {
    background: "linear-gradient(135deg, rgba(15, 23, 48, 0.9) 0%, rgba(26, 40, 71, 0.7) 100%)",
    border: "1px solid rgba(107, 156, 255, 0.2)",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    animation: "slideUp 0.5s ease-out"
  },
  sectionTitle: {
    fontWeight: 800,
    marginBottom: 16,
    fontSize: 16,
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(135deg, #6b9cff 0%, #4ade80 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  empty: {
    padding: 24,
    textAlign: "center",
    opacity: 0.7,
    fontSize: 14,
    background: "rgba(107, 156, 255, 0.05)",
    borderRadius: 10,
    border: "1px dashed rgba(107, 156, 255, 0.2)"
  },
  dealsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12
  },
  dealCard: {
    background: "linear-gradient(135deg, rgba(11, 16, 32, 0.8) 0%, rgba(27, 42, 85, 0.5) 100%)",
    border: "1px solid rgba(107, 156, 255, 0.3)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    transition: "all 0.3s ease",
    animation: "slideUp 0.4s ease-out"
  },
  dealHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(107, 156, 255, 0.1)"
  },
  dealId: {
    fontSize: 11,
    opacity: 0.8,
    fontFamily: "monospace",
    background: "rgba(107, 156, 255, 0.1)",
    padding: "4px 8px",
    borderRadius: 6,
    fontWeight: 600
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: "1px solid #24325a"
  },
  item: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13
  },
  quantity: {
    color: "#6b9cff",
    fontWeight: 700,
    background: "rgba(107, 156, 255, 0.15)",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 12
  },
  price: {
    marginLeft: "auto",
    paddingLeft: 8,
    fontWeight: 600
  },
  totals: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: "1px solid #24325a"
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12
  },
  strikethrough: {
    textDecoration: "line-through",
    opacity: 0.6
  },
  discount: {
    color: "#4ade80",
    fontWeight: 700,
    textShadow: "0 0 8px rgba(74, 222, 128, 0.3)"
  },
  finalTotal: {
    fontWeight: 800,
    fontSize: 16,
    marginTop: 6,
    color: "#6b9cff"
  },
  reason: {
    fontSize: 12,
    opacity: 0.9,
    marginBottom: 12,
    padding: 10,
    background: "rgba(107, 156, 255, 0.1)",
    borderRadius: 8,
    borderLeft: "3px solid #6b9cff",
    lineHeight: 1.4
  },
  button: {
    width: "100%",
    background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 4px 16px rgba(74, 222, 128, 0.4)",
    transition: "all 0.3s ease",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  buttonDisabled: {
    width: "100%",
    background: "linear-gradient(135deg, #1b2440 0%, #0f1730 100%)",
    color: "#95a0c0",
    border: "none",
    borderRadius: 10,
    padding: "12px 16px",
    cursor: "not-allowed",
    fontWeight: 700,
    fontSize: 14,
    opacity: 0.6
  },
  purchasesList: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  purchaseCard: {
    background: "linear-gradient(135deg, rgba(11, 16, 32, 0.8) 0%, rgba(34, 197, 94, 0.1) 100%)",
    border: "1px solid rgba(74, 222, 128, 0.3)",
    borderRadius: 12,
    padding: 14,
    boxShadow: "0 4px 16px rgba(74, 222, 128, 0.1)",
    transition: "all 0.3s ease",
    animation: "slideUp 0.4s ease-out"
  },
  purchaseHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    fontSize: 12,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(74, 222, 128, 0.1)"
  },
  purchaseStatus: {
    color: "#4ade80",
    fontWeight: 700,
    textShadow: "0 0 8px rgba(74, 222, 128, 0.3)"
  },
  purchaseDate: {
    opacity: 0.7,
    fontSize: 11,
    fontFamily: "monospace"
  },
  purchaseItems: {
    fontSize: 13,
    marginBottom: 8
  },
  purchaseItem: {
    marginRight: 4
  },
  purchaseTotal: {
    fontSize: 13,
    fontWeight: 600
  },
  saved: {
    color: "#4ade80",
    fontSize: 12
  },
  summary: {
    background: "linear-gradient(135deg, rgba(45, 69, 143, 0.3) 0%, rgba(26, 40, 71, 0.5) 100%)",
    border: "1px solid rgba(107, 156, 255, 0.4)",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 4px 20px rgba(107, 156, 255, 0.2)",
    animation: "pulse 2s ease-in-out infinite"
  },
  summaryTitle: {
    fontWeight: 800,
    marginBottom: 12,
    fontSize: 15,
    letterSpacing: "0.5px",
    background: "linear-gradient(135deg, #6b9cff 0%, #4ade80 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500
  },
  savedBig: {
    color: "#4ade80",
    fontWeight: 800,
    fontSize: 18,
    textShadow: "0 0 10px rgba(74, 222, 128, 0.5)"
  }
};
