import type { EnergyDataMap, ScenariosState } from "./types";

// ─── Scenario definitions ────────────────────────────────────────────────────
// Each scenario has an id, display metadata, and two pure functions that take
// the slider's normalized value (0–1) and return a multiplier for electricity
// and fuel respectively.  A multiplier of 1.0 = no change.
export interface ScenarioDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  // Pure multiplier functions.  pct = sliderValue / max (0–1).
  electricityMultiplier: (pct: number) => number;
  fuelMultiplier: (pct: number) => number;
}

export const SCENARIO_DEFS: ScenarioDef[] = [
  {
    id: "ev_adoption",
    label: "EV Adoption",
    description: "Shifts transport fuel load onto the electric grid",
    icon: "⚡",
    min: 0,
    max: 50,
    step: 1,
    defaultValue: 0,
    unit: "%",
    // Each 1 % EV adoption adds ~0.4 % to electricity, removes ~0.6 % from fuel
    electricityMultiplier: (pct) => 1 + pct * 0.4,
    fuelMultiplier: (pct) => 1 - pct * 0.6,
  },
  {
    id: "insulation_retrofit",
    label: "Building Retrofit",
    description: "Insulation upgrades reduce heating & cooling load",
    icon: "🏗️",
    min: 0,
    max: 40,
    step: 1,
    defaultValue: 0,
    unit: "% of buildings",
    // Retrofitting reduces both electricity (cooling) and fuel (heating)
    electricityMultiplier: (pct) => 1 - pct * 0.18,
    fuelMultiplier: (pct) => 1 - pct * 0.25,
  },
  {
    id: "solar_rollout",
    label: "Solar Rollout",
    description: "Rooftop & utility solar offsets grid electricity",
    icon: "☀️",
    min: 0,
    max: 30,
    step: 1,
    defaultValue: 0,
    unit: "% coverage",
    // Solar only offsets electricity; fuel unchanged
    electricityMultiplier: (pct) => 1 - pct * 0.35,
    fuelMultiplier: (_) => 1,
  },
  {
    id: "demand_pricing",
    label: "Peak-Hour Pricing",
    description: "Demand pricing shifts load off peak hours",
    icon: "💰",
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 0,
    unit: "% price increase",
    // Aggressive pricing flattens demand but doesn't reduce total much — small effect
    electricityMultiplier: (pct) => 1 - pct * 0.08,
    fuelMultiplier: (_) => 1,
  },
];

// Default state: all sliders at their defaultValue
export function getDefaultScenarios(): ScenariosState {
  const s: ScenariosState = {};
  SCENARIO_DEFS.forEach((d) => {
    s[d.id] = d.defaultValue;
  });
  return s;
}

// ─── Engine ──────────────────────────────────────────────────────────────────
// Deep-clones energyData and applies every active scenario's multipliers.
// Returns a new EnergyDataMap with mutated predicted_kWh values.
export function applyScenarios(
  energyData: EnergyDataMap,
  scenarios: ScenariosState,
): EnergyDataMap {
  // Compute aggregate multipliers across all scenarios
  let elecMult = 1;
  let fuelMult = 1;
  SCENARIO_DEFS.forEach((def) => {
    const raw = scenarios[def.id] ?? def.defaultValue;
    const pct = raw / def.max; // normalise to 0–1
    elecMult *= def.electricityMultiplier(pct);
    fuelMult *= def.fuelMultiplier(pct);
  });

  // Clone + mutate
  const out: EnergyDataMap = {};
  for (const [zip, d] of Object.entries(energyData)) {
    out[zip] = {
      electricity: {
        ...d.electricity,
        predicted_kWh: d.electricity.predicted_kWh * elecMult,
      },
      fuel: {
        ...d.fuel,
        predicted_kWh: d.fuel.predicted_kWh * fuelMult,
      },
      total: {
        ...d.total,
        predicted_kWh:
          d.electricity.predicted_kWh * elecMult +
          d.fuel.predicted_kWh * fuelMult,
      },
    };
  }
  return out;
}

// ─── Summary helper (used by recommendations + export) ──────────────────────
export function scenarioSummaryLine(scenarios: ScenariosState): string {
  const active = SCENARIO_DEFS.filter((d) => (scenarios[d.id] ?? 0) > 0);
  if (active.length === 0) return "No scenarios active";
  return active
    .map((d) => `${d.label}: ${scenarios[d.id]}${d.unit}`)
    .join(" · ");
}
