import * as THREE from "three";
import type {
  CityDef,
  ZipFeature,
  EnergyDataMap,
  MetricKey,
  PreparedZip,
  EquityDataPoint,
  EquityLayer,
} from "./types";
import { getEnergyValue, getPercentError } from "./energy";
import { getEquityNormValue, equityColor } from "./equity";

// ─── Constants ───────────────────────────────────────────────────────────────
export const SCALE = 100;
export const DEFAULT_COLOR = "#444";
export const DROP_HEIGHT = 80;
export const DROP_DURATION = 1.2;
export const MAX_DELAY = 0.6;
export const MAX_EXTRUDE_HEIGHT = 18;
export const BASE_EXTRUDE = 0.4;

// ─── Heatmap ─────────────────────────────────────────────────────────────────
export function heatmapColor(t: number): string {
  const v = Math.max(0, Math.min(1, t));
  let r: number, g: number, b: number;
  if (v < 0.25) {
    const s = v / 0.25;
    r = 0;
    g = Math.round(s * 80);
    b = Math.round(180 + s * 75);
  } else if (v < 0.5) {
    const s = (v - 0.25) / 0.25;
    r = 0;
    g = Math.round(80 + s * 175);
    b = Math.round(255 - s * 100);
  } else if (v < 0.75) {
    const s = (v - 0.5) / 0.25;
    r = Math.round(s * 255);
    g = Math.round(255 - s * 100);
    b = Math.round(155 - s * 155);
  } else {
    const s = (v - 0.75) / 0.25;
    r = 255;
    g = Math.round(155 - s * 155);
    b = 0;
  }
  return `rgb(${r},${g},${b})`;
}

// ─── Spring easing ───────────────────────────────────────────────────────────
export function springEase(t: number): number {
  const omega = Math.sqrt(200);
  const zeta = 18 / (2 * Math.sqrt(200));
  const omegaD = omega * Math.sqrt(1 - zeta * zeta);
  return (
    1 -
    Math.exp(-zeta * omega * t) *
      (Math.cos(omegaD * t) +
        (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(omegaD * t))
  );
}

// ─── Seeded random ───────────────────────────────────────────────────────────
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ─── Projection ──────────────────────────────────────────────────────────────
export function projectLngLat(
  lng: number,
  lat: number,
  bounds: CityDef["bounds"],
): [number, number] {
  const x =
    ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng) - 0.5) * SCALE;
  const y =
    ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat) - 0.5) * SCALE;
  return [x, y];
}

// ─── Ring → Shape ────────────────────────────────────────────────────────────
function ringToShape(ring: number[][], bounds: CityDef["bounds"]): THREE.Shape {
  const shape = new THREE.Shape();
  const [x0, y0] = projectLngLat(ring[0][0], ring[0][1], bounds);
  shape.moveTo(x0, y0);
  for (let i = 1; i < ring.length; i++) {
    const [x, y] = projectLngLat(ring[i][0], ring[i][1], bounds);
    shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// ─── Feature → Shapes ────────────────────────────────────────────────────────
function featureToShapes(
  feature: ZipFeature,
  bounds: CityDef["bounds"],
): THREE.Shape[] {
  const { type, coordinates } = feature.geometry;
  const shapes: THREE.Shape[] = [];
  const buildShape = (polygon: any[]) => {
    const [outerRing, ...holeRings] = polygon;
    const shape = ringToShape(outerRing, bounds);
    holeRings.forEach((hole: number[][]) =>
      shape.holes.push(ringToShape(hole, bounds)),
    );
    return shape;
  };
  if (type === "Polygon") shapes.push(buildShape(coordinates));
  else if (type === "MultiPolygon")
    coordinates.forEach((p: any) => shapes.push(buildShape(p)));
  return shapes;
}

// ─── prepareCity ─────────────────────────────────────────────────────────────
/**
 * Main geometry pipeline.  Takes the city, raw GeoJSON features, the
 * scenario+time-adjusted energy map, chosen metric, and optional equity overlay,
 * and produces the final array of PreparedZip objects ready for the 3D scene.
 *
 * When an equity layer is active, color is driven by equity data instead of
 * the energy heatmap (but height is still energy-driven).
 */
export function prepareCity(params: {
  city: CityDef;
  features: ZipFeature[];
  metric: MetricKey;
  energyData: EnergyDataMap;
  equityLayer?: EquityLayer | null;
  equityPoints?: EquityDataPoint[];
}): PreparedZip[] {
  const { city, features, metric, energyData, equityLayer, equityPoints } =
    params;
  const filtered = features.filter((f) =>
    city.zips.includes(f.properties.ZCTA5CE10),
  );

  // Find max energy value for normalisation
  let maxVal = 0;
  filtered.forEach((f) => {
    const val = getEnergyValue(energyData, f.properties.ZCTA5CE10, metric);
    if (val !== null && val > maxVal) maxVal = val;
  });

  const result: PreparedZip[] = [];

  filtered.forEach((f, idx) => {
    const zip = f.properties.ZCTA5CE10;
    const energyValue = getEnergyValue(energyData, zip, metric);
    const percentError = getPercentError(energyData, zip, metric);
    const hasEnergy = energyValue !== null && maxVal > 0;
    const normalizedVal = hasEnergy ? energyValue! / maxVal : 0;

    // Height is always energy-driven
    const depth = hasEnergy
      ? BASE_EXTRUDE + normalizedVal * MAX_EXTRUDE_HEIGHT
      : BASE_EXTRUDE;

    // Color: equity overlay takes priority, then energy heatmap, then default grey
    let color: string;
    if (equityLayer && equityPoints && equityPoints.length > 0) {
      const eqVal = getEquityNormValue(equityPoints, zip, equityLayer);
      color = eqVal !== null ? equityColor(equityLayer, eqVal) : DEFAULT_COLOR;
    } else {
      color = hasEnergy ? heatmapColor(normalizedVal) : DEFAULT_COLOR;
    }

    const shapes = featureToShapes(f, city.bounds);
    shapes.forEach((shape, i) => {
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: false,
      });
      result.push({
        id: `${city.name}-${zip}-${i}`,
        zip,
        color,
        geometry: geo,
        shape,
        delay: seededRandom(idx * 7 + i * 13) * MAX_DELAY,
        energyValue: hasEnergy ? energyValue : null,
        percentError,
      });
    });
  });

  return result;
}
