"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import SidebarDropdown from "./UI/SidebarDropdown";

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
export default function Renderer() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedCity, setSelectedCity] = useState(0);
  const [metric, setMetric] = useState<MetricKey>("total");
  const [scenarios, setScenarios] =
    useState<ScenariosState>(getDefaultScenarios);
  const [timeSlice, setTimeSlice] = useState<TimeSlice>("current");
  const [equityLayer, setEquityLayer] = useState<EquityLayer | null>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  // Raw data per city
  const [rawFeatures, setRawFeatures] = useState<ZipCollection[]>(
    Array(CITIES.length).fill(null),
  );
  const [energyData, setEnergyData] = useState<EnergyDataMap>({});
  const [loading, setLoading] = useState(true); // Loading overlay

  // Ref for export screenshot
  const containerRef = useRef<HTMLDivElement>(null);

  // Active panel for right sidebar
  const [activePanel, setActivePanel] = useState<
    "scenario" | "timeline" | "hotspot" | "equity" | "export"
  >("scenario");

  // ── Load data for selected city ─────────────────────────────────────────────
  useEffect(() => {
    const city = CITIES[selectedCity];
    setLoading(true);

    // Load GeoJSON
    fetch(city.url)
      .then((r) => r.json())
      .then((features) =>
        setRawFeatures((prev) => {
          const copy = [...prev];
          copy[selectedCity] = features;
          return copy;
        }),
      );

    // Load energy data
    loadEnergyData(city.dataURL)
      .then((energy) => setEnergyData(energy))
      .catch(() => setEnergyData({}))
      .finally(() => setLoading(false));
  }, [selectedCity]);

  // ── Derived: equity points (stable per city) ──────────────────────────────
  const equityPoints = useMemo(
    () => generateEquityData(CITIES[selectedCity].zips),
    [selectedCity],
  );

  // ── Derived: scenario-adjusted energy ──────────────────────────────────────
  const scenarioEnergy = useMemo(
    () => applyScenarios(energyData, scenarios),
    [energyData, scenarios],
  );

  // ── Derived: time-adjusted energy ──────────────────────────────────────────
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

  // ── Derived: hotspots ──────────────────────────────────────────────────────
  const hotspots = useMemo(
    () => computeHotspots(adjustedEnergy, 5),
    [adjustedEnergy],
  );

  // ── Derived: recommendations ───────────────────────────────────────────────
  const recommendations = useMemo(
    () => getRecommendations(adjustedEnergy),
    [adjustedEnergy],
  );

  // ── Derived: prepared geometry ─────────────────────────────────────────────
  const currentZips = useMemo(() => {
    if (!rawFeatures[selectedCity]) return [];
    return prepareCity({
      city: CITIES[selectedCity],
      features: rawFeatures[selectedCity].features,
      metric,
      energyData: adjustedEnergy,
      equityLayer,
      equityPoints,
    });
  }, [
    rawFeatures,
    selectedCity,
    metric,
    adjustedEnergy,
    equityLayer,
    equityPoints,
  ]);

  // Scene key — any change that affects geometry forces a remount + drop anim
  const sceneKey = useMemo(() => {
    return [
      selectedCity,
      metric,
      timeSlice,
      equityLayer ?? "",
      Object.values(scenarios).join(","),
    ].join("|").length;
  }, [selectedCity, metric, timeSlice, equityLayer, scenarios]);

  // ── Dropdown options ───────────────────────────────────────────────────────
  const cityOptions = CITIES.map((c, i) => ({ key: String(i), label: c.name }));
  const metricOptions = [
    { key: "total", label: "Total Energy" },
    { key: "electricity", label: "Electricity" },
    { key: "fuel", label: "Fuel" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0f0f1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Loading Overlay ─────────────────────────────────────────────── */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 999,
            background: "rgba(15,15,26,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: 16,
          }}
        >
          Loading {CITIES[selectedCity].name}…
        </div>
      )}

      {/* ── 3D Canvas ────────────────────────────────────────────────────── */}
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene
          zips={currentZips}
          sceneKey={sceneKey}
          onHover={setTooltip}
          onUnhover={() => setTooltip(null)}
        />
      </Canvas>

      {/* ── Top bar: City + Metric dropdowns ────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          display: "flex",
          gap: 12,
        }}
      >
        <Dropdown
          label="City"
          options={cityOptions}
          selected={String(selectedCity)}
          onChange={(k) => setSelectedCity(Number(k))}
        />
        <Dropdown
          label="Metric"
          options={metricOptions}
          selected={metric}
          onChange={(k) => setMetric(k as MetricKey)}
        />
      </div>

      {/* ── Right sidebar: all panels stacked ───────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          paddingRight: 2,
        }}
      >
        <SidebarDropdown
          label="View"
          options={[
            { key: "scenario", label: "Scenarios" },
            { key: "timeline", label: "Timeline" },
            { key: "hotspot", label: "Hotspots" },
            { key: "equity", label: "Equity" },
            { key: "export", label: "Export" },
          ]}
          selected={activePanel}
          onChange={(k) => setActivePanel(k as typeof activePanel)}
        />

        {activePanel === "scenario" && (
          <ScenarioPanel scenarios={scenarios} onChange={setScenarios} />
        )}
        {activePanel === "timeline" && (
          <TimelinePanel activeSlice={timeSlice} onChange={setTimeSlice} />
        )}
        {activePanel === "hotspot" && <HotspotPanel hotspots={hotspots} />}
        {activePanel === "equity" && (
          <EquityPanel
            activeLayer={equityLayer}
            onLayerChange={setEquityLayer}
            energyData={adjustedEnergy}
            equityPoints={equityPoints}
          />
        )}
        {activePanel === "export" && (
          <ExportPanel
            containerRef={containerRef}
            cityIndex={selectedCity}
            metric={metric}
            energyData={adjustedEnergy}
            scenarios={scenarios}
            timeSlice={timeSlice}
          />
        )}
      </div>

      {/* ── Heatmap legend bar (bottom-left) ────────────────────────────── */}
      {!equityLayer && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "monospace",
            fontSize: 9,
            color: "#555",
          }}
        >
          <span>Low</span>
          <div
            style={{
              width: 120,
              height: 8,
              borderRadius: 4,
              background:
                "linear-gradient(to right, rgb(0,0,180), rgb(0,80,255), rgb(0,255,155), rgb(255,155,0), rgb(255,0,0))",
            }}
          />
          <span>High</span>
          <span style={{ marginLeft: 6, color: "#3a3a4a" }}>predicted kWh</span>
        </div>
      )}

      {/* ── Tooltip ───────────────────────────────────────────────────────── */}
      <Tooltip info={tooltip} />

      {/* ── Controls hint ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#333",
          fontFamily: "monospace",
          fontSize: 10,
          pointerEvents: "none",
        }}
      >
        Drag to orbit · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  );
}
