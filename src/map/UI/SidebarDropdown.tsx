"use client";
import { useState } from "react";

export interface SidebarOption {
  key: string;
  label: string;
}

export default function SidebarDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: SidebarOption[];
  selected: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.key === selected) ?? options[0];

  return (
    <div
      style={{
        position: "relative",
        width: 240,
        fontFamily: "monospace",
      }}
    >
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "8px 10px",
          background: "rgba(12,12,22,0.9)",
          border: "1px solid #2e2e3e",
          borderRadius: open ? "6px 6px 0 0" : 6,
          color: "#ddd",
          fontSize: 11,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(8px)",
          outline: "none",
        }}
      >
        <span style={{ color: "#888" }}>{label}:</span>
        <span style={{ color: "#fff" }}>{selectedOption.label}</span>
        <span
          style={{
            marginLeft: 6,
            fontSize: 8,
            opacity: 0.5,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          ▼
        </span>
      </button>

      {/* Menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(10,10,20,0.97)",
            border: "1px solid #2e2e3e",
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {options.map((opt) => {
            const active = opt.key === selected;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  background: active ? "rgba(125,211,252,0.12)" : "transparent",
                  border: "none",
                  color: active ? "#7dd3fc" : "#aaa",
                  fontSize: 11,
                  textAlign: "left",
                  cursor: "pointer",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = active
                    ? "rgba(125,211,252,0.12)"
                    : "transparent";
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
