import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface DeliveryTrackingMapProps {
  vehicleLat?: number | null;
  vehicleLon?: number | null;
  vehicleNumber?: string | null;
  originLat?: number | null;
  originLon?: number | null;
  originLabel?: string | null;
  destLat?: number | null;
  destLon?: number | null;
  destLabel?: string | null;
  status?: string | null;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  vehicleLat,
  vehicleLon,
  vehicleNumber,
  originLat,
  originLon,
  originLabel = "Collection Hub",
  destLat,
  destLon,
  destLabel = "Delivery Location",
  status,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center (e.g. Andhra Pradesh / central India)
    const defaultCenter: [number, number] = [
      vehicleLat || destLat || originLat || 16.5062,
      vehicleLon || destLon || originLon || 80.648,
    ];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
      });

      // Free OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    const bounds: [number, number][] = [];

    // Origin Marker (Hub)
    if (originLat && originLon) {
      const hubIcon = L.divIcon({
        className: "custom-map-icon",
        html: `<div style="background-color: #059669; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid #ffffff; font-size: 16px;">🌾</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const originMarker = L.marker([originLat, originLon], { icon: hubIcon }).addTo(map);
      originMarker.bindPopup(`<b>Origin Hub</b><br/>${originLabel}`);
      bounds.push([originLat, originLon]);
    }

    // Destination Marker (Buyer)
    if (destLat && destLon) {
      const destIcon = L.divIcon({
        className: "custom-map-icon",
        html: `<div style="background-color: #2563eb; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid #ffffff; font-size: 16px;">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const destMarker = L.marker([destLat, destLon], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`<b>Destination</b><br/>${destLabel}`);
      bounds.push([destLat, destLon]);
    }

    // Vehicle Marker (Live GPS)
    if (vehicleLat && vehicleLon) {
      const vehicleIcon = L.divIcon({
        className: "custom-map-icon",
        html: `<div style="background-color: #10b981; color: #022c22; border-radius: 9999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(16, 185, 129, 0.8), 0 4px 12px rgba(0,0,0,0.5); border: 3px solid #ffffff; font-size: 20px; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;">🚚</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const vMarker = L.marker([vehicleLat, vehicleLon], { icon: vehicleIcon }).addTo(map);
      vMarker.bindPopup(`<b>Vehicle: ${vehicleNumber || "Assigned Fleet"}</b><br/>Status: ${status || "On Route"}`);
      vehicleMarkerRef.current = vMarker;
      bounds.push([vehicleLat, vehicleLon]);
    }

    // Draw Route Polyline if both origin and dest exist
    if (originLat && originLon && destLat && destLon) {
      const routePoints: [number, number][] = [
        [originLat, originLon],
        ...(vehicleLat && vehicleLon ? [[vehicleLat, vehicleLon] as [number, number]] : []),
        [destLat, destLon],
      ];

      L.polyline(routePoints, {
        color: "#10b981",
        weight: 3,
        dashArray: "6, 8",
        opacity: 0.8,
      }).addTo(map);
    }

    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    return () => {
      // Cleanup is handled on unmount
    };
  }, [vehicleLat, vehicleLon, vehicleNumber, originLat, originLon, originLabel, destLat, destLon, destLabel, status]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[380px] sm:h-[450px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 shadow-lg space-y-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-white" />
          <span>FPO Hub (Origin)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block border border-white" />
          <span>Live Vehicle ({vehicleNumber || "Assigned"})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white" />
          <span>Buyer Delivery Destination</span>
        </div>
      </div>
    </div>
  );
};
