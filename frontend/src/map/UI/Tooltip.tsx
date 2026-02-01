"use client";
import type { TooltipInfo, MetricKey } from "../types";
import { fmtKWh } from "../hotspots";

export default function Tooltip({ info }: { info: TooltipInfo | null }) {
  if (!info) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: info.screenX + 14,
        top: info.screenY - 12,
        pointerEvents: "none",
        background: "rgba(10,10,20,0.93)",
        border: "1px solid #333",
        borderRadius: 5,
        padding: "7px 11px",
        fontFamily: "monospace",
        fontSize: 11,
        color: "#bbb",
        zIndex: 100,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ color: "#fff", fontWeight: 600, marginBottom: 3 }}>
        ZIP {info.zip}
      </div>
      {info.energyValue !== null ? (
        <>
          <div>
            <span style={{ color: "#555" }}>Predicted: </span>
            {fmtKWh(info.energyValue)}
          </div>
          {info.percentError !== null && (
            <div>
              <span style={{ color: "#555" }}>Error: </span>
              <span
                style={{ color: info.percentError > 0 ? "#ef5350" : "#4caf50" }}
              >
                {info.percentError > 0 ? "+" : ""}
                {info.percentError.toFixed(1)}%
              </span>
            </div>
          )}
        </>
      ) : (
        <div style={{ color: "#444" }}>No energy data</div>
      )}
    </div>
  );
}
