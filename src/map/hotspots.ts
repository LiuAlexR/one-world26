import type { EnergyDataMap, HotspotEntry } from "./types";

// ─── Urgency color scale ─────────────────────────────────────────────────────
// rank 1 (worst) → bright red, rank N (least bad) → amber/green
const URGENCY_COLORS = [
  "#ff1a1a", // 1 — critical red
  "#ff5533", // 2
  "#ff8833", // 3 — orange
  "#ffbb33", // 4 — amber
  "#ccdd44", // 5 — yellow-green
];

// ─── Core ────────────────────────────────────────────────────────────────────
/**
 * Given the (already scenario-adjusted) energy map, returns the top `count`
 * ZIPs ranked by total predicted_kWh descending.
 * Only ZIPs that actually have data are considered.
 */
export function computeHotspots(
  energyData: EnergyDataMap,
  count: number = 5,
): HotspotEntry[] {
  const entries = Object.entries(energyData)
    .filter(([, d]) => d.total.predicted_kWh > 0)
    .sort((a, b) => b[1].total.predicted_kWh - a[1].total.predicted_kWh)
    .slice(0, count);

  return entries.map(([zip, d], i) => ({
    zip,
    totalPredicted: d.total.predicted_kWh,
    rank: i + 1,
    urgencyColor:
      URGENCY_COLORS[i] ?? URGENCY_COLORS[URGENCY_COLORS.length - 1],
  }));
}

// ─── Formatting helper ───────────────────────────────────────────────────────
export function fmtKWh(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + " GWh";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + " MWh";
  return v.toLocaleString() + " kWh";
}
