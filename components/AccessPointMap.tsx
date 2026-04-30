"use client";

import React from "react";
import { AccessPointResponse } from "@/lib/api/accessPoints";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

const AccessPointMap = ({
  accessPoints,
}: {
  accessPoints: AccessPointResponse[];
}) => {
  // Vaikimisi algvaade on Tallinn.
  const defaultCenter: [number, number] = [59.437, 24.753];

  return (
    <div className="h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:h-[400px]">
      <MapContainer
        center={defaultCenter}
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
