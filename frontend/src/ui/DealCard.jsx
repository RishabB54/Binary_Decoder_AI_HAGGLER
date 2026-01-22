import React, { useMemo, useState } from "react";

export function DealCard({ backendUrl, sessionId, dealDraft }) {
  const [status, setStatus] = useState("idle");

  const savings = useMemo(() => {
    if (!dealDraft) return 0;
    return dealDraft.discountTotal || 0;
  }, [dealDraft]);

  async function accept() {
    if (!dealDraft || !sessionId) return;
    setStatus("accepting");

    const resp = await fetch(`${backendUrl}/deal/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, dealId: dealDraft.dealId })
    });

    if (resp.ok) {
      setStatus("accepted");
    } else {
      setStatus("failed");
    }
  }

  if (!dealDraft) {
    return <div style={{ opacity: 0.75 }}>No deal yet. Negotiate in chat to generate a deal.</div>;
  }

  return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Deal #{dealDraft.dealId.slice(0, 8)}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {dealDraft.items.map((it) => (
          <div
            key={it.sku}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              padding: 10,
              background: "#0b1020",
              border: "1px solid #24325a",
              borderRadius: 12
            }}
          >
            <div style={{ maxWidth: 240 }}>{it.title}</div>
            <div style={{ fontWeight: 700 }}>₹{it.price}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #24325a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ opacity: 0.8 }}>Original</div>
          <div>₹{dealDraft.originalTotal}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ opacity: 0.8 }}>Savings</div>
          <div style={{ color: "#3dbb6a", fontWeight: 800 }}>-₹{savings}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ opacity: 0.8 }}>Final</div>
          <div style={{ fontWeight: 900 }}>₹{dealDraft.finalTotal}</div>
        </div>
        {dealDraft.reason ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>{dealDraft.reason}</div> : null}
      </div>

      <button
        onClick={accept}
        disabled={status === "accepting" || status === "accepted"}
        style={{
          marginTop: 12,
          width: "100%",
          padding: "10px 12px",
          borderRadius: 12,
          border: "none",
          background: status === "accepted" ? "#3dbb6a" : "#2d458f",
          color: "white",
          fontWeight: 800,
          cursor: status === "accepted" ? "default" : "pointer"
        }}
      >
        {status === "idle" && "Accept Deal"}
        {status === "accepting" && "Accepting..."}
        {status === "accepted" && "Accepted"}
        {status === "failed" && "Failed — Retry"}
      </button>
    </div>
  );
}
