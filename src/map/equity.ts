import type { EnergyDataMap, EquityDataPoint, EquityLayer } from "./types";

// ─── Mock equity data ────────────────────────────────────────────────────────
// In production these would come from Census / CDC / utility APIs.
// For the MVP we seed deterministic pseudo-random values from the ZIP code itself
// so every ZIP always has plausible, consistent data.
function zipSeed(zip: string): number {
  let h = 0;
  for (let i = 0; i < zip.length; i++) {
    h = (h << 5) - h + zip.charCodeAt(i);
    h |= 0;
  }
  return (((h % 10000) + 10000) % 10000) / 10000; // 0–1
}

export function generateEquityData(zips: string[]): EquityDataPoint[] {
  return zips.map((zip) => {
    const s = zipSeed(zip);
    // Spread values so they look realistic
    const medianIncome = 28000 + s * 142000; // $28k – $170k
    const heatVuln = Math.pow(1 - s, 1.8); // skew: more zips are low-vuln
    const outages = Math.round(s * 8); // 0–8 per year
    return {
      zip,
      medianIncome,
      heatVulnerabilityIndex: heatVuln,
      historicalOutages: outages,
    };
  });
}

// ─── Overlay color: maps a 0–1 value to a color for the given layer ─────────
export function equityColor(layer: EquityLayer, value01: number): string {
  const v = Math.max(0, Math.min(1, value01));
  switch (layer) {
    case "income": {
      // Green (high income) → red (low income).  Invert so low income = high urgency.
      const inv = 1 - v;
      const r = Math.round(inv * 255);
      const g = Math.round((1 - inv) * 200);
      return `rgb(${r},${g},60)`;
    }
    case "heatVulnerability": {
      // Blue (low) → red (high)
      const r = Math.round(v * 255);
      const b = Math.round((1 - v) * 220);
      return `rgb(${r},60,${b})`;
    }
    case "outages": {
      // Teal (few) → orange (many)
      const r = Math.round(v * 255);
      const g = Math.round(180 - v * 120);
      const b = Math.round((1 - v) * 180);
      return `rgb(${r},${g},${b})`;
    }
  }
}

// ─── Normalise a single equity field to 0–1 across a set of data points ─────
function normalise(
  points: EquityDataPoint[],
  field: keyof EquityDataPoint,
): Map<string, number> {
  const vals = points.map((p) => p[field] as number);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const map = new Map<string, number>();
  points.forEach((p) => map.set(p.zip, ((p[field] as number) - min) / range));
  return map;
}

// ─── Correlation ─────────────────────────────────────────────────────────────
// Pearson r between energy burden (predicted kWh) and the chosen equity field.
// Returns { r, interpretation }
export function computeCorrelation(
  energyData: EnergyDataMap,
  equityPoints: EquityDataPoint[],
  layer: EquityLayer,
): { r: number; interpretation: string } {
  // Only ZIPs present in both datasets
  const shared = equityPoints.filter((p) => energyData[p.zip]);
  if (shared.length < 3) return { r: 0, interpretation: "Insufficient data" };

  const energyVals = shared.map((p) => energyData[p.zip].total.predicted_kWh);

  let equityField: keyof EquityDataPoint;
  let invertForBurden = false; // if true, LOW value = HIGH burden
  switch (layer) {
    case "income":
      equityField = "medianIncome";
      invertForBurden = true;
      break;
    case "heatVulnerability":
      equityField = "heatVulnerabilityIndex";
      break;
    case "outages":
      equityField = "historicalOutages";
      break;
  }
  const equityVals = shared.map((p) => {
    const raw = p[equityField] as number;
    return invertForBurden ? -raw : raw;
  });

  // Pearson
  const n = energyVals.length;
  const meanE = energyVals.reduce((a, b) => a + b, 0) / n;
  const meanQ = equityVals.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    denE = 0,
    denQ = 0;
  for (let i = 0; i < n; i++) {
    const de = energyVals[i] - meanE;
    const dq = equityVals[i] - meanQ;
    num += de * dq;
    denE += de * de;
    denQ += dq * dq;
  }
  const r = num / (Math.sqrt(denE) * Math.sqrt(denQ) || 1);

  let interpretation: string;
  const abs = Math.abs(r);
  if (abs > 0.7)
    interpretation =
      r > 0 ? "Strong positive correlation" : "Strong negative correlation";
  else if (abs > 0.4)
    interpretation =
      r > 0 ? "Moderate positive correlation" : "Moderate negative correlation";
  else if (abs > 0.2)
    interpretation =
      r > 0 ? "Weak positive correlation" : "Weak negative correlation";
  else interpretation = "No significant correlation";

  return { r: Math.round(r * 100) / 100, interpretation };
}

// ─── Get normalised overlay value for a single ZIP ───────────────────────────
export function getEquityNormValue(
  equityPoints: EquityDataPoint[],
  zip: string,
  layer: EquityLayer,
): number | null {
  const point = equityPoints.find((p) => p.zip === zip);
  if (!point) return null;

  const field =
    layer === "income"
      ? "medianIncome"
      : layer === "heatVulnerability"
        ? "heatVulnerabilityIndex"
        : "historicalOutages";
  const normed = normalise(equityPoints, field);
  const v = normed.get(zip) ?? null;
  if (v === null) return null;
  // For income, invert so low income = high value (more urgent)
  return layer === "income" ? 1 - v : v;
}
