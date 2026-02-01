"use client";
import { useState } from "react";

export interface DropdownOption {
  key: string;
  label: string;
}

export default function Dropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: DropdownOption[];
  selected: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find((o) => o.key === selected) ?? options[0];

  return (
    <div style={{ position: "relative", width: 170 }}>
      {label && (
        <div
          style={{
            color: "#666",
            fontFamily: "monospace",
            fontSize: 9,
            marginBottom: 3,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "7px 12px",
          background: "rgba(15,15,26,0.85)",
          border: "1px solid #3a3a4a",
          borderRadius: open ? "5px 5px 0 0" : 5,
          color: "#fff",
          fontFamily: "monospace",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(6px)",
          outline: "none",
        }}
      >
        <span>{selectedOption.label}</span>
        <span
          style={{
            opacity: 0.45,
            fontSize: 8,
            display: "inline-block",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "rgba(12,12,22,0.96)",
            border: "1px solid #3a3a4a",
            borderTop: "none",
            borderRadius: "0 0 5px 5px",
            overflow: "hidden",
            zIndex: 50,
          }}
        >
          {options.map((opt, i) => (
            <button
              key={opt.key}
              onClick={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  opt.key === selected
                    ? "rgba(255,255,255,0.06)"
                    : "transparent";
                e.currentTarget.style.color =
                  opt.key === selected ? "#fff" : "#999";
              }}
              style={{
                width: "100%",
                padding: "7px 12px",
                background:
                  opt.key === selected
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                border: "none",
                borderBottom:
                  i < options.length - 1
                    ? "1px solid rgba(255,255,255,0.06)"
                    : "none",
                color: opt.key === selected ? "#fff" : "#999",
                fontFamily: "monospace",
                fontSize: 11,
                cursor: "pointer",
                textAlign: "left",
                outline: "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
