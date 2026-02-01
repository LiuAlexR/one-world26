import type { EnergyDataMap, MetricKey } from "./types";
import { CITIES } from "./cities";
import { scenarioSummaryLine } from "./scenarios";
import { getTimeSliceDef } from "./timeline";
import type { TimeSlice, ScenariosState } from "./types";
import { fmtKWh } from "./hotspots";
import { computeHotspots } from "./hotspots";

// ─── Screenshot ──────────────────────────────────────────────────────────────
/**
 * Captures the <canvas> rendered by React Three Fiber and downloads it as a PNG.
 * Call this with a ref to the container div that wraps <Canvas />.
 */
export function exportScreenshot(containerRef: HTMLDivElement | null): void {
  if (!containerRef) return;
  const canvas = containerRef.querySelector("canvas");
  if (!canvas) {
    console.warn("No canvas found");
    return;
  }

  // Three.js canvas needs a forced render tick — the browser may have
  // optimised the last frame away.  We grab whatever is currently drawn.
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-snapshot-${new Date().toISOString().slice(0, 10)}.png`;
  a.click();
}

// ─── Summary text ────────────────────────────────────────────────────────────
export function generateSummaryText(params: {
  cityIndex: number;
  metric: MetricKey;
  energyData: EnergyDataMap;
  scenarios: ScenariosState;
  timeSlice: TimeSlice;
}): string {
  const { cityIndex, metric, energyData, scenarios, timeSlice } = params;
  const city = CITIES[cityIndex];
  const timeDef = getTimeSliceDef(timeSlice);
  const hotspots = computeHotspots(energyData, 5);

  // Aggregate stats
  const zipsWithData = Object.keys(energyData).filter((z) =>
    city.zips.includes(z),
  );
  let totalPredicted = 0,
    totalActual = 0;
  zipsWithData.forEach((z) => {
    const d = energyData[z];
    totalPredicted += d[metric].predicted_kWh;
    totalActual +=
      metric === "total" ? d.total.actual_kWh : d[metric].actual_kWh;
  });

  const lines: string[] = [];
  lines.push(`═══ ENERGY PLANNING SNAPSHOT ═══`);
  lines.push(`City:        ${city.name}`);
  lines.push(
    `Metric:      ${metric.charAt(0).toUpperCase() + metric.slice(1)}`,
  );
  lines.push(`Time Slice:  ${timeDef.label} — ${timeDef.description}`);
  lines.push(`Scenarios:   ${scenarioSummaryLine(scenarios)}`);
  lines.push(``);
  lines.push(`── Aggregate ──`);
  lines.push(`ZIPs with data:   ${zipsWithData.length}`);
  lines.push(`Total predicted:  ${fmtKWh(totalPredicted)}`);
  lines.push(`Total actual:     ${fmtKWh(totalActual)}`);
  if (totalActual > 0) {
    const err = (((totalPredicted - totalActual) / totalActual) * 100).toFixed(
      1,
    );
    lines.push(`Model error:      ${err}%`);
  }
  lines.push(``);
  lines.push(`── Top 5 Hotspots ──`);
  hotspots.forEach((h) => {
    lines.push(`  #${h.rank}  ZIP ${h.zip}  —  ${fmtKWh(h.totalPredicted)}`);
  });
  lines.push(``);
  lines.push(`Generated: ${new Date().toLocaleString()}`);

  return lines.join("\n");
}

// ─── Download summary as .txt ────────────────────────────────────────────────
export function exportSummary(text: string): void {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `energy-summary-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
