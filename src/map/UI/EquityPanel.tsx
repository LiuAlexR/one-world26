"use client";
import { useState } from "react";
import type { EquityLayer, EnergyDataMap, EquityDataPoint } from "../types";
import { computeCorrelation } from "../equity";

const LAYERS: {
  key: EquityLayer;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    key: "income",
    label: "Median Income",
    icon: "💵",
    desc: "Low income = high energy burden risk",
  },
  {
    key: "heatVulnerability",
    label: "Heat Vulnerability",
    icon: "🌡️",
    desc: "Exposure to extreme heat events",
  },
  {
    key: "outages",
    label: "Power Outages",
    icon: "⚡",
    desc: "Historical outage frequency",
  },
];

export default function EquityPanel({
  activeLayer,
  onLayerChange,
  energyData,
  equityPoints,
}: {
  activeLayer: EquityLayer | null;
  onLayerChange: (layer: EquityLayer | null) => void;
  energyData: EnergyDataMap;
  equityPoints: EquityDataPoint[];
}) {
  const [open, setOpen] = useState(true);

  // Correlation for the active layer
  const correlation =
    activeLayer && equityPoints.length > 0
      ? computeCorrelation(energyData, equityPoints, activeLayer)
      : null;

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
          <span style={{ fontSize: 14 }}>⚖️</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>
            Equity Layer
          </span>
        </span>
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
      </button>

      {/* Body */}
      {open && (
        <div
          style={{
            padding: "0 12px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {/* Layer toggles */}
          {LAYERS.map((layer) => {
            const isActive = activeLayer === layer.key;
            return (
              <button
                key={layer.key}
                onClick={() => onLayerChange(isActive ? null : layer.key)}
                style={{
                  width: "100%",
                  padding: "7px 9px",
                  background: isActive
                    ? "rgba(125,211,252,0.12)"
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "1px solid rgba(125,211,252,0.35)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 4,
                  cursor: "pointer",
                  outline: "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                  {layer.icon}
                </span>
                <div>
                  <div
                    style={{
                      color: isActive ? "#7dd3fc" : "#ccc",
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {layer.label}
                  </div>
                  <div
                    style={{
                      color: "#4a4a5a",
                      fontFamily: "monospace",
                      fontSize: 9,
                      lineHeight: 1.3,
                    }}
                  >
                    {layer.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Correlation readout */}
          {correlation && (
            <div
              style={{
                marginTop: 4,
                padding: "7px 9px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  color: "#666",
                  fontFamily: "monospace",
                  fontSize: 9,
                  marginBottom: 2,
                }}
              >
                CORRELATION WITH ENERGY LOAD
              </div>
              <div
                style={{
                  color: "#fff",
                  fontFamily: "monospace",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                r = {correlation.r}
              </div>
              <div
                style={{
                  color: "#7dd3fc",
                  fontFamily: "monospace",
                  fontSize: 9,
                }}
              >
                {correlation.interpretation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
