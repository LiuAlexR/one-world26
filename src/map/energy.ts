import type { EnergyDataMap, MetricKey } from "./types";

// ─── Parse ───────────────────────────────────────────────────────────────────
// Accepts the full raw JSON you showed (with metadata, zip_codes,
// contributions_by_building_type, etc.) and extracts only what the renderer needs.
export function parseEnergyJSON(raw: any): EnergyDataMap {
  const zipCodes = raw?.zip_codes;
  if (!zipCodes || typeof zipCodes !== "object") {
    console.warn("parseEnergyJSON: no zip_codes found");
    return {};
  }

  const result: EnergyDataMap = {};
  for (const [zip, data] of Object.entries(zipCodes)) {
    const d = data as any;
    result[zip] = {
      electricity: {
        actual_kWh: d.electricity?.actual_kWh ?? 0,
        predicted_kWh: d.electricity?.predicted_kWh ?? 0,
        error_kWh: d.electricity?.error_kWh ?? 0,
        percent_error: d.electricity?.percent_error ?? 0,
      },
      fuel: {
        actual_kWh: d.fuel?.actual_kWh ?? 0,
        predicted_kWh: d.fuel?.predicted_kWh ?? 0,
        error_kWh: d.fuel?.error_kWh ?? 0,
        percent_error: d.fuel?.percent_error ?? 0,
      },
      total: {
        actual_kWh: d.total?.actual_kWh ?? 0,
        predicted_kWh: d.total?.predicted_kWh ?? 0,
      },
    };
  }
  return result;
}

// ─── Load from URL / path ────────────────────────────────────────────────────
export async function loadEnergyData(
  pathOrUrl: string,
): Promise<EnergyDataMap> {
  const res = await fetch(pathOrUrl);
  if (!res.ok) throw new Error(`Failed to load energy data: ${res.status}`);
  const raw = await res.json();
  return parseEnergyJSON(raw);
}

// ─── Accessors ───────────────────────────────────────────────────────────────
export function getEnergyValue(
  energyData: EnergyDataMap,
  zip: string,
  metric: MetricKey,
): number | null {
  const d = energyData[zip];
  if (!d) return null;
  return d[metric].predicted_kWh;
}

export function getPercentError(
  energyData: EnergyDataMap,
  zip: string,
  metric: MetricKey,
): number | null {
  const d = energyData[zip];
  if (!d) return null;
  if (metric === "total") return null;
  return d[metric].percent_error;
}
