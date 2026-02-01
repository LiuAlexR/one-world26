"use client";
import { TIME_SLICES } from "../timeline";
import type { TimeSlice } from "../types";

export default function TimelinePanel({
  activeSlice,
  onChange,
}: {
  activeSlice: TimeSlice;
  onChange: (slice: TimeSlice) => void;
}) {
  return (
    <div
      style={{
        background: "rgba(12,12,22,0.88)",
        border: "1px solid #2e2e3e",
        borderRadius: 7,
        overflow: "hidden",
        width: 240,
        backdropFilter: "blur(8px)",
        padding: "9px 10px 10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>⏱️</span>
        <span
          style={{
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          Timeline
        </span>
      </div>

      {/* Active slice description */}
      {(() => {
        const def = TIME_SLICES.find((t) => t.key === activeSlice);
        return def ? (
          <div
            style={{
              color: "#4a4a5a",
              fontFamily: "monospace",
              fontSize: 9,
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            {def.icon} {def.description}
          </div>
        ) : null;
      })()}

      {/* Button grid — 3 columns */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}
      >
        {TIME_SLICES.map((slice) => {
          const isActive = activeSlice === slice.key;
          return (
            <button
              key={slice.key}
              onClick={() => onChange(slice.key)}
              style={{
                padding: "5px 2px",
                background: isActive
                  ? "rgba(125,211,252,0.15)"
                  : "rgba(255,255,255,0.03)",
                border: isActive
                  ? "1px solid rgba(125,211,252,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 4,
                cursor: "pointer",
                outline: "none",
                textAlign: "center",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 2 }}>{slice.icon}</div>
              <div
                style={{
                  color: isActive ? "#7dd3fc" : "#999",
                  fontFamily: "monospace",
                  fontSize: 9,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {slice.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
