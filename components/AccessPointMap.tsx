// components/AccessPointMap.tsx (lihtsustatud versioon)

import React from "react";
import { AccessPointResponse } from "@/lib/api/accessPoints";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const AccessPointMap = ({
  accessPoints,
}: {
  accessPoints: AccessPointResponse[];
}) => {
  // 1. Määrame vaikekoordinaadid (nt Tallinn)
  const defaultCenter: [number, number] = [59.437, 24.753];

  // 2. Kontrollime turvaliselt, kas meil on vähemalt üks punkt olemas
  // Kasutame optional chaining (?.) ja kontrollime, et lat/lon oleks olemas
  const center: [number, number] =
    accessPoints &&
    accessPoints.length > 0 &&
    accessPoints[0].latitude &&
    accessPoints[0].longitude
      ? [Number(accessPoints[0].latitude), Number(accessPoints[0].longitude)]
      : defaultCenter;

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200">
      {/* 3. Kasutame key-atribuuti, et MapContainer end värskendaks, kui center muutub */}
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap"
        />

        {/* Joonistame täpid ainult siis, kui neid on */}
        {accessPoints?.map((ap) => (
          <CircleMarker
            key={ap.id}
            center={[Number(ap.latitude), Number(ap.longitude)]}
            radius={6}
            pathOptions={{
              fillColor: "#3b82f6",
              color: "#ffffff",
              weight: 2,
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="text-sm font-sans">
                <strong className="block border-b pb-1 mb-1">{ap.name}</strong>
                <span className="text-slate-500">{ap.address}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AccessPointMap;
