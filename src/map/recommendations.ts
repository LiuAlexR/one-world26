import type { EnergyDataMap } from "./types";
import { computeHotspots } from "./hotspots";

// ─── Template ────────────────────────────────────────────────────────────────
export interface Recommendation {
  id: string;
  title: string;
  detail: string; // filled in at generation time with real numbers
  impact: string; // e.g. "−12 % electricity"
  urgency: "high" | "medium" | "low";
  targetZips: string[]; // which ZIPs this applies to
}

// ─── Generator ───────────────────────────────────────────────────────────────
/**
 * Examines the current (scenario-adjusted, time-adjusted) energy map and
 * produces 3–5 concrete recommendations.  Templates are threshold-driven:
 * we look at the hotspots and total load to decide what to suggest.
 */
export function getRecommendations(
  energyData: EnergyDataMap,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const hotspots = computeHotspots(energyData, 5);
  if (hotspots.length === 0) return recs;

  const topZip = hotspots[0];
  const totalCity = Object.values(energyData).reduce(
    (sum, d) => sum + d.total.predicted_kWh,
    0,
  );
  const topShare = (topZip.totalPredicted / totalCity) * 100;
  const topElec = energyData[topZip.zip]?.electricity.predicted_kWh ?? 0;
  const topFuel = energyData[topZip.zip]?.fuel.predicted_kWh ?? 0;

  // ── 1. Retrofit recommendation (always present if hotspots exist) ──────────
  const retrofitReduction = Math.round(((topElec * 0.18) / 1e6) * 10) / 10;
  recs.push({
    id: "retrofit",
    title: "Building Insulation Retrofit",
    detail: `Top hotspot ZIP ${topZip.zip} uses ${(topElec / 1e6).toFixed(0)} MWh electricity. A 20 % retrofit program could reduce that by ~${retrofitReduction} MWh/yr.`,
    impact: "−18 % electricity in target zone",
    urgency: topShare > 25 ? "high" : "medium",
    targetZips: hotspots.slice(0, 3).map((h) => h.zip),
  });

  // ── 2. Solar rollout (if electricity dominates) ─────────────────────────────
  if (topElec > topFuel * 0.6) {
    const solarOffset = Math.round(((topElec * 0.25) / 1e6) * 10) / 10;
    recs.push({
      id: "solar",
      title: "Solar Incentive Program",
      detail: `Electricity-heavy profile in ZIP ${topZip.zip}. A 25 % rooftop solar rollout could offset ~${solarOffset} MWh/yr.`,
      impact: "−25 % electricity via solar offset",
      urgency: "medium",
      targetZips: [topZip.zip],
    });
  }

  // ── 3. Fuel / heating efficiency (if fuel dominates) ────────────────────────
  if (topFuel > topElec * 0.8) {
    const fuelReduction = Math.round(((topFuel * 0.22) / 1e6) * 10) / 10;
    recs.push({
      id: "fuel_efficiency",
      title: "Gas Boiler Replacement Program",
      detail: `ZIP ${topZip.zip} is fuel-heavy (${(topFuel / 1e6).toFixed(0)} MWh fuel). Replacing aging boilers could cut ~${fuelReduction} MWh/yr.`,
      impact: "−22 % fuel consumption",
      urgency: topShare > 20 ? "high" : "medium",
      targetZips: hotspots.slice(0, 2).map((h) => h.zip),
    });
  }

  // ── 4. Demand-response / peak shaving ───────────────────────────────────────
  if (hotspots.length >= 3) {
    const top3Total = hotspots
      .slice(0, 3)
      .reduce((s, h) => s + h.totalPredicted, 0);
    const top3Share = ((top3Total / totalCity) * 100).toFixed(0);
    recs.push({
      id: "demand_response",
      title: "Demand-Response Program",
      detail: `Top 3 ZIPs account for ${top3Share} % of total load. A demand-response program targeting these areas could flatten peak load by 8–12 %.`,
      impact: "−8–12 % peak electricity",
      urgency: "low",
      targetZips: hotspots.slice(0, 3).map((h) => h.zip),
    });
  }

  // ── 5. EV charging infrastructure (if EV scenario is off but load is high) ──
  if (totalCity > 1e9) {
    recs.push({
      id: "ev_charging",
      title: "EV Charging Infrastructure",
      detail: `City total load is ${(totalCity / 1e9).toFixed(1)} GWh. Deploying smart managed charging stations can shift transport load to off-peak hours.`,
      impact: "Flattens grid demand curve",
      urgency: "low",
      targetZips: hotspots.slice(0, 2).map((h) => h.zip),
    });
  }

  return recs;
}
