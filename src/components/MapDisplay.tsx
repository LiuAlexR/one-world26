import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix for Tile loading and Zoom logic
function MapFixer({ scrollProgress, onThresholdReached }: { scrollProgress: number, onThresholdReached: () => void }) {
  const map = useMap();

  useEffect(() => {
    if (scrollProgress > 0.1) {
      map.invalidateSize();
    }
  }, [scrollProgress, map]);

  useMapEvents({
    zoomend: () => {
      const z = map.getZoom();
      // Adjusting threshold slightly if needed, but 14 is a good "zoom in" point
      if (z >= 14) onThresholdReached();
    },
  });

  return null;
}

export default function MapDisplay({ scrollProgress, onZoomComplete }: { scrollProgress: number, onZoomComplete: () => void }) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: '#0f0f1a', // Matches your Renderer background exactly
      overflow: 'hidden' 
    }}>
      <MapContainer 
        center={[39.8283, -98.5795]} 
        zoom={5} 
        scrollWheelZoom={true} 
        zoomSnap={0.5}
        zoomDelta={0.5}
        style={{ width: '100%', height: '100%', background: '#0f0f1a' }}
        attributionControl={false} // Clean UI
      >
        {/* Dark Matter Tiles - Sleek and Uniform */}
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          className="map-tiles"
        />
        
        {/* Removed Marker: nycPos pin is gone */}

        <MapFixer 
          scrollProgress={scrollProgress} 
          onThresholdReached={onZoomComplete} 
        />
      </MapContainer>

      {/* Internal style to ensure tiles blend perfectly */}
      <style>{`
        .leaflet-container {
          background: #0f0f1a !important;
        }
        .map-tiles {
          filter: brightness(0.8) contrast(1.2); /* Optional: extra moodiness */
        }
      `}</style>
    </div>
  );
}
