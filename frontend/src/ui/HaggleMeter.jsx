import React, { useMemo } from "react";

export function HaggleMeter({ score }) {
  const pct = Math.round((score || 0) * 100);

  const label = useMemo(() => {
    if (pct < 30) return "Firm Price";
    if (pct < 65) return "Fair Deal";
    return "Loot!";
  }, [pct]);

  const color = useMemo(() => {
    if (pct < 30) return "#b24b4b";
    if (pct < 65) return "#c7a13d";
    return "#3dbb6a";
  }, [pct]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div style={{ opacity: 0.8 }}>{pct}%</div>
      </div>
      <div style={{ height: 12, background: "#0b1020", border: "1px solid #24325a", borderRadius: 999 }}>
        <div
          style={{
            width: `${Math.max(5, Math.min(100, pct))}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
            transition: "width 300ms ease"
          }}
        />
      </div>
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        Tip: Bundles + higher loyalty tiers unlock better deals.
      </div>
    </div>
  );
}
