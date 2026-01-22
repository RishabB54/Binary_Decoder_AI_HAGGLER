import React, { useMemo } from "react";

export function HaggleMeter({ score }) {
  const pct = Math.round((score || 0) * 100);

  const label = useMemo(() => {
    if (pct < 30) return "🔴 Firm Price";
    if (pct < 50) return "🟡 Getting There";
    if (pct < 70) return "🟢 Fair Deal";
    if (pct < 90) return "💚 Great Deal!";
    return "🎉 LOOT!!!";
  }, [pct]);

  const color = useMemo(() => {
    if (pct < 30) return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
    if (pct < 50) return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
    if (pct < 70) return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    if (pct < 90) return "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
    return "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)";
  }, [pct]);

  const emoji = useMemo(() => {
    if (pct < 30) return "😐";
    if (pct < 50) return "🙂";
    if (pct < 70) return "😊";
    if (pct < 90) return "😄";
    return "🤩";
  }, [pct]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.label}>
          <span style={styles.emoji}>{emoji}</span> {label}
        </div>
        <div style={styles.percentage}>{pct}%</div>
      </div>
      <div style={styles.barContainer}>
        <div
          style={{
            ...styles.bar,
            width: `${Math.max(5, Math.min(100, pct))}%`,
            background: color
          }}
        >
          <div style={styles.shine} />
        </div>
      </div>
      <div style={styles.tip}>
        💡 <strong>Pro Tip:</strong> Bundles + higher loyalty tiers = better deals!
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "4px 0"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  label: {
    fontWeight: 800,
    fontSize: 15,
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  emoji: {
    fontSize: 20,
    animation: "bounce 1s ease-in-out infinite"
  },
  percentage: {
    fontSize: 18,
    fontWeight: 800,
    background: "linear-gradient(135deg, #6b9cff 0%, #4ade80 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  },
  barContainer: {
    height: 20,
    background: "rgba(11, 16, 32, 0.8)",
    border: "1px solid rgba(107, 156, 255, 0.3)",
    borderRadius: 999,
    overflow: "hidden",
    boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)"
  },
  bar: {
    height: "100%",
    borderRadius: 999,
    transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)"
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    background: "linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent)",
    borderRadius: "999px 999px 0 0"
  },
  tip: {
    marginTop: 12,
    fontSize: 13,
    opacity: 0.85,
    padding: "10px 12px",
    background: "rgba(107, 156, 255, 0.1)",
    borderRadius: 8,
    borderLeft: "3px solid #6b9cff",
    lineHeight: 1.5
  }
};

// Add bounce animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
