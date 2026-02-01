"use client";
import { useState } from "react";
import type { HotspotEntry } from "../types";
import { fmtKWh } from "../hotspots";

export default function HotspotPanel({
  hotspots,
}: {
  hotspots: HotspotEntry[];
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
          <span style={{ fontSize: 14 }}>🚨</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>Hotspots</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {hotspots.length > 0 && (
            <span
              style={{
                fontSize: 8,
                background: "#ff5533",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              {hotspots.length}
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
            padding: "0 12px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {hotspots.length === 0 && (
            <div
              style={{
                color: "#444",
                fontFamily: "monospace",
                fontSize: 10,
                textAlign: "center",
                padding: 8,
              }}
            >
              No data available
            </div>
          )}
          {hotspots.map((h) => (
            <div
              key={h.zip}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.03)",
                borderRadius: 4,
                padding: "5px 8px",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Rank badge */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: h.urgencyColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {h.rank}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#fff",
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  ZIP {h.zip}
                </div>
                <div
                  style={{
                    color: "#666",
                    fontFamily: "monospace",
                    fontSize: 9,
                  }}
                >
                  {fmtKWh(h.totalPredicted)}
                </div>
              </div>
              {/* Urgency bar */}
              <div
                style={{
                  width: 6,
                  height: 32,
                  borderRadius: 3,
                  background: h.urgencyColor,
                  flexShrink: 0,
                }}
              />
            </div>
          ))}
          {/* Legend hint */}
          <div
            style={{
              color: "#3a3a4a",
              fontFamily: "monospace",
              fontSize: 8,
              marginTop: 2,
              textAlign: "center",
            }}
          >
            🔴 Critical &nbsp; 🟠 High &nbsp; 🟡 Moderate
          </div>
        </div>
      )}
    </div>
  );
}
