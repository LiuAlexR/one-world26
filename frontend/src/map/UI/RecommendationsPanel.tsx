"use client";
import { useState } from "react";
import type { Recommendation } from "../recommendations";

const URGENCY_STYLE: Record<string, { bg: string; text: string }> = {
  high: { bg: "#ef535044", text: "#ef5350" },
  medium: { bg: "#ff883344", text: "#ff8833" },
  low: { bg: "#4caf5044", text: "#4caf50" },
};

export default function RecommendationsPanel({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        background: "rgba(12,12,22,0.88)",
        border: "1px solid #2e2e3e",
        borderRadius: 7,
        overflow: "hidden",
        width: 240,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "9px 12px",
          background: "transparent",
          border: "none",
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          outline: "none",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14 }}>📋</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>
            Recommendations
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {recommendations.length > 0 && (
            <span
              style={{
                fontSize: 8,
                background: "#7dd3fc",
                color: "#0f0f1a",
                padding: "1px 5px",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              {recommendations.length}
            </span>
          )}
          <span
            style={{
              opacity: 0.4,
              fontSize: 9,
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </span>
      </button>

      {/* Body */}
      {open && (
        <div
          style={{
            padding: "0 10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {recommendations.length === 0 && (
            <div
              style={{
                color: "#444",
                fontFamily: "monospace",
                fontSize: 10,
                textAlign: "center",
                padding: 8,
              }}
            >
              No recommendations available
            </div>
          )}
          {recommendations.map((rec) => {
            const urg = URGENCY_STYLE[rec.urgency] ?? URGENCY_STYLE.low;
            return (
              <div
                key={rec.id}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderRadius: 5,
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "7px 9px",
                }}
              >
                {/* Title + urgency badge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      color: "#fff",
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {rec.title}
                  </div>
                  <span
                    style={{
                      fontSize: 8,
                      background: urg.bg,
                      color: urg.text,
                      padding: "1px 5px",
                      borderRadius: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                    }}
                  >
                    {rec.urgency}
                  </span>
                </div>
                {/* Detail */}
                <div
                  style={{
                    color: "#7a7a8a",
                    fontFamily: "monospace",
                    fontSize: 9,
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {rec.detail}
                </div>
                {/* Impact pill */}
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 9,
                    fontFamily: "monospace",
                    background: "rgba(125,211,252,0.1)",
                    color: "#7dd3fc",
                    padding: "1px 6px",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  {rec.impact}
                </div>
                {/* Target ZIPs */}
                {rec.targetZips.length > 0 && (
                  <div
                    style={{
                      color: "#3a3a4a",
                      fontFamily: "monospace",
                      fontSize: 8,
                      marginTop: 4,
                    }}
                  >
                    Target: {rec.targetZips.map((z) => `ZIP ${z}`).join(", ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
