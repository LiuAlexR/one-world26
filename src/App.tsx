import { useState, useEffect } from "react";
import MapDisplay from "./components/MapDisplay";
import Renderer from "./map/Renderer";
import HeroScene from "./components/HeroScene";

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isMapFinished, setIsMapFinished] = useState(false);
  const [isMapActive, setIsMapActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Always track scrollY for the 3D background
      setScrollY(window.scrollY);

      // Stop updating progress once map/renderer takes over
      if (isMapActive || isMapFinished) return;

      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / (totalHeight || 1);
      setScrollProgress(progress);

      if (progress > 0.6) {
        setIsMapActive(true);
        document.body.style.overflow = "hidden";
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMapActive, isMapFinished]);

  // Map fade in
  const mapOpacity =
    scrollProgress < 0.3 ? 0 : Math.min(1, (scrollProgress - 0.3) * 3.3);

  // Text fade out + drift up
  const textOpacity =
    scrollProgress < 0.05 ? 1 : Math.max(0, 1 - (scrollProgress - 0.05) * 6);

  const textY = -(scrollProgress * 80);

  return (
    <div style={{ color: "white", minHeight: "300vh", width: "100%" }}>
      {/* 3D background */}
      <HeroScene scrollY={scrollY} />

      {/* TEXT OVERLAY (fades out on scroll) */}
      {textOpacity > 0.01 && !isMapFinished && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
            pointerEvents: "none", // don't block mouse trail
            display: "grid",
            placeItems: "center",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            transition: "opacity 120ms linear, transform 120ms linear",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: 900, padding: 24 }}>
            <h1 style={{ fontSize: 56, margin: 0, letterSpacing: "-0.02em" }}>
              One World
            </h1>
            <p style={{ fontSize: 18, opacity: 0.85, marginTop: 14 }}>
              Srikar Yadlapati, Jake Tran, Brian Wei, Alex Liu
            </p>
          </div>
        </div>
      )}

      {/* MAP SECTION */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          visibility: scrollProgress < 0.1 ? "hidden" : "visible",
          opacity: isMapFinished ? 0 : mapOpacity,
          zIndex: isMapActive ? 50 : 5,
          transition: "opacity 0.5s ease",
          transform: isMapFinished ? "scale(1.5)" : "scale(1)",
          pointerEvents:
            scrollProgress > 0.3 && !isMapFinished ? "auto" : "none",
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <MapDisplay
            scrollProgress={scrollProgress}
            onZoomComplete={() => {
              setIsMapFinished(true);
              setIsMapActive(false);
              document.body.style.overflow = "hidden";
            }}
          />
        </div>
      </div>

      {/* RENDERER SECTION */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: isMapFinished ? 100 : -1,
          opacity: isMapFinished ? 1 : 0,
          visibility: scrollProgress > 0.1 ? "visible" : "hidden",
          transition: "opacity 0.8s ease-in-out",
        }}
      >
        <Renderer isActive={isMapFinished} />
      </div>
    </div>
  );
}
