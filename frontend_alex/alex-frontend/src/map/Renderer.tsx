"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";

// ── Data & logic ─────────────────────────────────────────────────────────────
import { CITIES } from "./cities";
import { loadEnergyData } from "./energy";
import { applyScenarios, getDefaultScenarios } from "./scenarios";
import { computeHotspots } from "./hotspots";
import { generateEquityData } from "./equity";
import { getTimeSliceDef } from "./timeline";
import { getRecommendations } from "./recommendations";
import { prepareCity } from "./geometry";

// ── 3D ───────────────────────────────────────────────────────────────────────
import Scene from "./Scene";

// ── UI panels ────────────────────────────────────────────────────────────────
import Dropdown from "./UI/Dropdown";
import Tooltip from "./UI/Tooltip";
import ScenarioPanel from "./UI/ScenarioPanel";
import HotspotPanel from "./UI/HotspotPanel";
import EquityPanel from "./UI/EquityPanel";
import TimelinePanel from "./UI/TimelinePanel";
import RecommendationsPanel from "./UI/RecommendationsPanel";
import ExportPanel from "./UI/ExportPanel";

// ── Types ────────────────────────────────────────────────────────────────────
import type {
  ZipCollection,
  EnergyDataMap,
  MetricKey,
  ScenariosState,
  TimeSlice,
  EquityLayer,
  TooltipInfo,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// We accept 'isActive' from App.tsx to trigger the "reveal" and animations
export default function Renderer({ isActive = false }: { isActive?: boolean }) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(0);
  const [metric, setMetric] = useState<MetricKey>("total");
  const [scenarios, setScenarios] = useState<ScenariosState>(getDefaultScenarios);
  const [timeSlice, setTimeSlice] = useState<TimeSlice>("current");
  const [equityLayer, setEquityLayer] = useState<EquityLayer | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Raw data
  const [rawFeatures, setRawFeatures] = useState<ZipCollection[]>([]);
  const [energyData, setEnergyData] = useState<EnergyDataMap>({});
  
  // NEW: Tracking loading state separately so we can preload silently
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Ref for export screenshot
  const containerRef = useRef<HTMLDivElement>(null);

  // ── 1. SILENT PRELOAD LOGIC ────────────────────────────────────────────────
  // This starts immediately on mount, even if the user is still at the top of the page.
  useEffect(() => {
    const preloadAllData = async () => {
      try {
        const [features, energy] = await Promise.all([
          Promise.all(CITIES.map((city) => fetch(city.url).then((r) => r.json()))),
          loadEnergyData("/energy_predictions.json").catch(
            () => ({}) as EnergyDataMap,
          ),
        ]);
        setRawFeatures(features);
        setEnergyData(energy);
        setIsDataLoaded(true); // Signal that the data is ready for the 3D scene
      } catch (err) {
        console.error("Data Preload Failed:", err);
      }
    };
    preloadAllData();
  }, []);

  // ── 2. DERIVED DATA (Same as before, but memoized for performance) ─────────
  const equityPoints = useMemo(
    () => generateEquityData(CITIES[selectedCity].zips),
    [selectedCity]
  );

  const scenarioEnergy = useMemo(
    () => applyScenarios(energyData, scenarios),
    [energyData, scenarios]
  );

  const adjustedEnergy: EnergyDataMap = useMemo(() => {
    const { electricityMultiplier: eMult, fuelMultiplier: fMult } =
      getTimeSliceDef(timeSlice);
    if (eMult === 1 && fMult === 1) return scenarioEnergy;

    const out: EnergyDataMap = {};
    for (const [zip, d] of Object.entries(scenarioEnergy)) {
      out[zip] = {
        electricity: {
          ...d.electricity,
          predicted_kWh: d.electricity.predicted_kWh * eMult,
        },
        fuel: { ...d.fuel, predicted_kWh: d.fuel.predicted_kWh * fMult },
        total: {
          ...d.total,
          predicted_kWh:
            d.electricity.predicted_kWh * eMult + d.fuel.predicted_kWh * fMult,
        },
      };
    }
    return out;
  }, [scenarioEnergy, timeSlice]);

  const hotspots = useMemo(
    () => computeHotspots(adjustedEnergy, 5),
    [adjustedEnergy]
  );

  const recommendations = useMemo(
    () => getRecommendations(adjustedEnergy),
    [adjustedEnergy]
  );

  // ── 3. PREPARED GEOMETRY (The heavy calculation) ──────────────────────────
  const currentZips = useMemo(() => {
    // Return empty if data isn't ready to prevent jank
    if (!isDataLoaded || !rawFeatures[selectedCity]) return [];
    
    return prepareCity({
      city: CITIES[selectedCity],
      features: rawFeatures[selectedCity].features,
      metric,
      energyData: adjustedEnergy,
      equityLayer,
      equityPoints,
    });
  }, [
    isDataLoaded,
    rawFeatures,
    selectedCity,
    metric,
    adjustedEnergy,
    equityLayer,
    equityPoints,
  ]);

  // Scene key — logic preserved, but we add 'isActive' to prevent animation start early
  const sceneKey = useMemo(() => {
    if (!isActive) return "pre-warming";
    return [
      selectedCity,
      metric,
      timeSlice,
      equityLayer ?? "",
      Object.values(scenarios).join(","),
      isActive // Forces remount/animation only once we switch to the renderer
    ].join("|");
  }, [selectedCity, metric, timeSlice, equityLayer, scenarios, isActive]);

  // ── 4. UI DROPDOWN OPTIONS ─────────────────────────────────────────────────
  const cityOptions = CITIES.map((c, i) => ({ key: String(i), label: c.name }));
  const metricOptions = [
    { key: "total", label: "Total Energy" },
    { key: "electricity", label: "Electricity" },
    { key: "fuel", label: "Fuel" },
  ];

  // ── 5. RENDER ──────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "transparent", // Transparent so it blends with App.tsx background
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── 3D Canvas ────────────────────────────────────────────────────── */}
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* We mount the Scene as soon as data is loaded. 
            Because App.tsx keeps this component at opacity 0/z-index -1,
            the user won't see it until it's finished loading. */}
        {isDataLoaded && (
          <Scene
            zips={currentZips}
            sceneKey={sceneKey}
            onHover={setTooltip}
            onUnhover={() => setTooltip(null)}
          />
        )}
      </Canvas>

      {/* ── UI Panels (Only fade in when active) ─────────────────────────── */}
      <div style={{
          opacity: isActive ? 1 : 0,
          transition: "opacity 1s ease 0.3s", // Subtle delay for UI elements
          pointerEvents: isActive ? "auto" : "none"
      }}>
        {/* Top bar: City + Metric dropdowns */}
        <div style={{ position: "absolute", top: 16, left: 16, zIndex: 10, display: "flex", gap: 12 }}>
          <Dropdown label="City" options={cityOptions} selected={String(selectedCity)} onChange={(k) => setSelectedCity(Number(k))} />
          <Dropdown label="Metric" options={metricOptions} selected={metric} onChange={(k) => setMetric(k as MetricKey)} />
        </div>

        {/* Right sidebar: all panels stacked */}
        <div style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            display: "flex", flexDirection: "column", gap: 10,
            maxHeight: "calc(100vh - 32px)", overflowY: "auto", paddingRight: 2
        }}>
          <ScenarioPanel scenarios={scenarios} onChange={setScenarios} />
          <TimelinePanel activeSlice={timeSlice} onChange={setTimeSlice} />
          <HotspotPanel hotspots={hotspots} />
          <EquityPanel activeLayer={equityLayer} onLayerChange={setEquityLayer} energyData={adjustedEnergy} equityPoints={equityPoints} />
          <RecommendationsPanel recommendations={recommendations} />
          <ExportPanel containerRef={containerRef.current} cityIndex={selectedCity} metric={metric} energyData={adjustedEnergy} scenarios={scenarios} timeSlice={timeSlice} />
        </div>

        {/* Heatmap legend bar */}
        {!equityLayer && (
          <div style={{ position: "absolute", bottom: 40, left: 18, display: "flex", alignItems: "center", gap: 8, fontFamily: "monospace", fontSize: 9, color: "#555" }}>
            <span>Low</span>
            <div style={{ width: 120, height: 8, borderRadius: 4, background: "linear-gradient(to right, rgb(0,0,180), rgb(0,80,255), rgb(0,255,155), rgb(255,155,0), rgb(255,0,0))" }} />
            <span>High</span>
            <span style={{ marginLeft: 6, color: "#3a3a4a" }}>predicted kWh</span>
          </div>
        )}

        {/* Controls hint */}
        <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", color: "#333", fontFamily: "monospace", fontSize: 10, pointerEvents: "none" }}>
          Drag to orbit · Scroll to zoom · Right-drag to pan
        </div>
      </div>

      <Tooltip info={tooltip} />
    </div>
  );
}