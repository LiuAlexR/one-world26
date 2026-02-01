import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type CityMapProps = {
  districts: any;
  getDistrictColor: (feature: any) => string;
};

export default function CityMap({ districts, getDistrictColor }: CityMapProps) {
  return (
    <MapContainer
      center={[47.6062, -122.3321]}
      zoom={11}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      <GeoJSON
        data={districts}
        style={(feature) => ({
          fillColor: getDistrictColor(feature),
          fillOpacity: 0.7,
          color: "#222",
          weight: 1,
        })}
      />
    </MapContainer>
  );
}
