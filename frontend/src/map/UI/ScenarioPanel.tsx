"use client";
import { useState } from "react";
import { SCENARIO_DEFS } from "../scenarios";
import type { ScenariosState } from "../types";

export default function ScenarioPanel({
  scenarios,
  onChange,
}: {
  scenarios: ScenariosState;
  onChange: (s: ScenariosState) => void;
}) {
  const [open, setOpen] = useState(true);

  const handleSlider = (id: string, value: number) => {
    onChange({ ...scenarios, [id]: value });
  };

  const anyActive = SCENARIO_DEFS.some((d) => (scenarios[d.id] ?? 0) > 0);

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
          <span style={{ fontSize: 14 }}>🎛️</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>
            What-If Scenarios
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {anyActive && (
            <span
              style={{
                fontSize: 8,
                background: "#ef5350",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              LIVE
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
            padding: "0 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {SCENARIO_DEFS.map((def) => {
            const val = scenarios[def.id] ?? def.defaultValue;
            const pct = def.max > 0 ? (val / def.max) * 100 : 0;
            return (
              <div key={def.id}>
                {/* Label row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      color: "#ccc",
                      fontFamily: "monospace",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <span>{def.icon}</span> {def.label}
                  </span>
                  <span
                    style={{
                      color: val > 0 ? "#7dd3fc" : "#555",
                      fontFamily: "monospace",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {val}
                    {def.unit}
                  </span>
                </div>
                {/* Description */}
                <div
                  style={{
                    color: "#4a4a5a",
                    fontFamily: "monospace",
                    fontSize: 9,
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {def.description}
                </div>
                {/* Slider */}
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={val}
                  onChange={(e) => handleSlider(def.id, Number(e.target.value))}
                  style={{
                    width: "100%",
                    height: 4,
                    appearance: "none",
                    cursor: "pointer",
                    background: `linear-gradient(to right, #7dd3fc ${pct}%, #2e2e3e ${pct}%)`,
                    borderRadius: 2,
                    outline: "none",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
