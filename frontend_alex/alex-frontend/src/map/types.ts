// ─── GeoJSON ─────────────────────────────────────────────────────────────────
export interface ZipFeature {
  type: "Feature";
  properties: { ZCTA5CE10: string; [key: string]: any };
  geometry: { type: string; coordinates: any };
}
export interface ZipCollection {
  type: "FeatureCollection";
  features: ZipFeature[];
}

// ─── City ────────────────────────────────────────────────────────────────────
export interface CityDef {
  name: string;
  url: string;
  zips: string[];
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

// ─── Energy ──────────────────────────────────────────────────────────────────
export interface EnergyMetric {
  actual_kWh: number;
  predicted_kWh: number;
  error_kWh: number;
  percent_error: number;
}
export interface ZipEnergyData {
  electricity: EnergyMetric;
  fuel: EnergyMetric;
  total: { actual_kWh: number; predicted_kWh: number };
}
export type EnergyDataMap = Record<string, ZipEnergyData>;
export type MetricKey = "electricity" | "fuel" | "total";

// ─── Scenarios ───────────────────────────────────────────────────────────────
export interface ScenarioSlider {
  id: string;
  label: string;
  value: number; // current 0–100
  min: number;
  max: number;
  step: number;
  // How this scenario mutates the energy map. Applied as multipliers.
  // electricityMultiplier / fuelMultiplier are functions of (value/100).
  electricityMultiplier: (pct: number) => number; // returns final multiplier, e.g. 0.9 = 10% reduction
  fuelMultiplier: (pct: number) => number;
}
export type ScenariosState = Record<string, number>; // id → current value

// ─── Equity overlay ──────────────────────────────────────────────────────────
export type EquityLayer = "income" | "heatVulnerability" | "outages";
export interface EquityDataPoint {
  zip: string;
  medianIncome: number; // $/year (mock)
  heatVulnerabilityIndex: number; // 0–1
  historicalOutages: number; // count per year (mock)
}

// ─── Timeline ────────────────────────────────────────────────────────────────
export type TimeSlice =
  | "current"
  | "peak"
  | "offpeak"
  | "summer"
  | "winter"
  | "2030";

// ─── Hotspot ─────────────────────────────────────────────────────────────────
export interface HotspotEntry {
  zip: string;
  totalPredicted: number;
  rank: number;
  urgencyColor: string; // css color
}

// ─── Prepared geometry (passed to 3D layer) ─────────────────────────────────
import type { ExtrudeGeometry, Shape } from "three";
export interface PreparedZip {
  id: string;
  zip: string;
  color: string;
  geometry: ExtrudeGeometry;
  shape: Shape;
  delay: number;
  energyValue: number | null;
  percentError: number | null;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export interface TooltipInfo {
  zip: string;
  energyValue: number | null;
  percentError: number | null;
  screenX: number;
  screenY: number;
}
