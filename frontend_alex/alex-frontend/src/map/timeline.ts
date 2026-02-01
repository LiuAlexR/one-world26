import type { TimeSlice } from "./types";

// ─── Definitions ─────────────────────────────────────────────────────────────
export interface TimeSliceDef {
  key: TimeSlice;
  label: string;
  description: string;
  icon: string;
  // Multipliers applied to predicted_kWh after scenarios.
  // These model relative load shifts — not absolute totals.
  electricityMultiplier: number;
  fuelMultiplier: number;
}

export const TIME_SLICES: TimeSliceDef[] = [
  {
    key: "current",
    label: "Current",
    description: "Annual average baseline",
    icon: "📊",
    electricityMultiplier: 1.0,
    fuelMultiplier: 1.0,
  },
  {
    key: "peak",
    label: "Peak Hour",
    description:
      "Summer afternoon peak (2–5 PM). Electricity surges from AC & cooling.",
    icon: "🔥",
    electricityMultiplier: 1.35, // +35 % on electricity
    fuelMultiplier: 0.85, // less heating fuel during summer peak
  },
  {
    key: "offpeak",
    label: "Off-Peak",
    description: "Late night (11 PM – 5 AM). Minimal demand.",
    icon: "🌙",
    electricityMultiplier: 0.55,
    fuelMultiplier: 0.7,
  },
  {
    key: "summer",
    label: "Summer",
    description: "June – August. High cooling, low heating.",
    icon: "☀️",
    electricityMultiplier: 1.2,
    fuelMultiplier: 0.6,
  },
  {
    key: "winter",
    label: "Winter",
    description: "December – February. High heating, moderate cooling.",
    icon: "❄️",
    electricityMultiplier: 0.9,
    fuelMultiplier: 1.55,
  },
  {
    key: "2030",
    label: "2030 Projection",
    description:
      "Projected 2030 demand assuming +2.5 % annual growth + climate stress.",
    icon: "📈",
    electricityMultiplier: 1.22, // ~6 years of compounding growth + heat stress
    fuelMultiplier: 1.08, // slight fuel increase from population growth
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────────
export function getTimeSliceDef(key: TimeSlice): TimeSliceDef {
  return TIME_SLICES.find((t) => t.key === key) ?? TIME_SLICES[0];
}
