"use client";
import { useState } from "react";
import {
  exportScreenshot,
  generateSummaryText,
  exportSummary,
} from "../export";
import type {
  EnergyDataMap,
  MetricKey,
  ScenariosState,
  TimeSlice,
} from "../types";

export default function ExportPanel({
  containerRef,
  cityIndex,
  metric,
  energyData,
  scenarios,
  timeSlice,
}: {
  containerRef: HTMLDivElement | null;
  cityIndex: number;
  metric: MetricKey;
  energyData: EnergyDataMap;
  scenarios: ScenariosState;
  timeSlice: TimeSlice;
}) {
  const [open, setOpen] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const flash = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 1800);
  };

  const handleScreenshot = () => {
    exportScreenshot(containerRef);
    flash("Screenshot saved");
  };

  const handleSummary = () => {
    const text = generateSummaryText({
      cityIndex,
      metric,
      energyData,
      scenarios,
      timeSlice,
    });
    exportSummary(text);
    flash("Summary exported");
  };

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
          <span style={{ fontSize: 14 }}>📤</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>Export</span>
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
          {/* Screenshot */}
          <button
            onClick={handleScreenshot}
            style={{
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5,
              color: "#ccc",
              fontFamily: "monospace",
              fontSize: 11,
              cursor: "pointer",
              outline: "none",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <span style={{ fontSize: 16 }}>📸</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 11 }}>
                Screenshot
              </div>
              <div style={{ color: "#555", fontSize: 9 }}>
                Save current 3D view as PNG
              </div>
            </div>
          </button>

          {/* Summary */}
          <button
            onClick={handleSummary}
            style={{
              padding: "8px 10px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5,
              color: "#ccc",
              fontFamily: "monospace",
              fontSize: 11,
              cursor: "pointer",
              outline: "none",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <span style={{ fontSize: 16 }}>📄</span>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 11 }}>
                Summary Stats
              </div>
              <div style={{ color: "#555", fontSize: 9 }}>
                Download planning report as .txt
              </div>
            </div>
          </button>

          {/* Feedback toast */}
          {feedback && (
            <div
              style={{
                marginTop: 2,
                padding: "5px 10px",
                background: "rgba(125,211,252,0.15)",
                border: "1px solid rgba(125,211,252,0.3)",
                borderRadius: 4,
                color: "#7dd3fc",
                fontFamily: "monospace",
                fontSize: 10,
                textAlign: "center",
              }}
            >
              ✓ {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
