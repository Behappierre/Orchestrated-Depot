import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../../stores/useAppStore';
import { demoData, demoMapCenter } from '../../data/demoData';
import { activeDemoProfile } from '../../config/demoProfile';
import { clsx } from 'clsx';
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Locate,
  Bus,
  Zap,
  Route,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom vehicle marker
const createVehicleIcon = (status: string, soc: number, requiredSoC: number) => {
  let color = '#22c55e'; // Green - OK
  if (status === 'Charging') color = '#3b82f6'; // Blue
  else if (soc < requiredSoC && status !== 'Charging') color = '#ef4444'; // Red - Risk
  else if (status === 'Driving') color = '#22c55e'; // Green

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Charger marker
const createChargerIcon = (status: string) => {
  let color = '#22c55e';
  if (status === 'Faulted') color = '#ef4444';
  else if (status === 'Active') color = '#3b82f6';
  else if (status === 'Available') color = '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: ${color};
        border: 2px solid white;
        border-radius: 4px;
        box-shadow: 0 0 8px ${color}40;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13.01 3h1l-1 7h3.51c.4 0 .62.19.4.66C12.97 17.55 11 21 11 21z"/>
        </svg>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Map controls component
function MapControls({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  // MapContainer only uses its initial center; follow subsequent depot selections.
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);

  const showNetwork = () => {
    map.fitBounds(demoData.depots.map((depot) => [depot.lat, depot.lng]), {
      paddingTopLeft: [240, 65], paddingBottomRight: [70, 65], maxZoom: 14,
    });
  };

  // Start with the selected demo network visible, then follow the depot selector.
  useEffect(() => {
    map.fitBounds(demoData.depots.map((depot) => [depot.lat, depot.lng]), {
      paddingTopLeft: [240, 65], paddingBottomRight: [70, 65], maxZoom: 14,
    });
  }, [map]);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        onClick={() => map.setView([lat, lng], 15)}
        aria-label="Center on selected depot"
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <Locate className="w-5 h-5" />
      </button>
      <button
        onClick={showNetwork}
        aria-label={activeDemoProfile.networkControlLabel}
        title={activeDemoProfile.networkControlLabel}
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <Layers className="w-5 h-5" />
      </button>
    </div>
  );
}

export function MapView() {
  const { vehicles, chargers, routes, depots, selectedDepotId } = useAppStore();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showChargers, setShowChargers] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  const selectedDepot = depots.find((d) => d.id === selectedDepotId);
  const depotVehicles = vehicles.filter((v) => v.depotId === selectedDepotId);

  // Standard OSM tiles need no API key. Keep browser caching and referrers enabled.
  const tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Depot zone polygon (simplified rectangle around depot)
  const depotZone = selectedDepot
    ? [
        [selectedDepot.lat + 0.0006, selectedDepot.lng - 0.0009],
        [selectedDepot.lat + 0.0006, selectedDepot.lng + 0.0009],
        [selectedDepot.lat - 0.0006, selectedDepot.lng + 0.0009],
        [selectedDepot.lat - 0.0006, selectedDepot.lng - 0.0009],
      ] as [number, number][]
    : [];

  return (
    <div className="h-full relative rounded-xl overflow-hidden">
      {/* Legend Panel */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 shadow-xl">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Map Layers
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showVehicles}
              onChange={(e) => setShowVehicles(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <Bus className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-300">Vehicles ({vehicles.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showChargers}
              onChange={(e) => setShowChargers(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">Chargers ({chargers.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <Route className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-300">Illustrative routes ({routes.length})</span>
          </label>
        </div>

        <p className="text-xs text-slate-400 mt-3 max-w-[185px]">
          {activeDemoProfile.mapDescription}
        </p>

        {/* Status Legend */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2">Vehicle Status</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Ready / Driving</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-300">Charging</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 p-4 shadow-xl">
        <div className="text-sm font-medium text-white mb-2">{selectedDepot?.name}</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div className="text-slate-400">On Route:</div>
          <div className="text-emerald-400 font-medium">
            {depotVehicles.filter((v) => v.status === 'Driving').length}
          </div>
          <div className="text-slate-400">Charging:</div>
          <div className="text-blue-400 font-medium">
            {depotVehicles.filter((v) => v.status === 'Charging').length}
          </div>
          <div className="text-slate-400">At Depot:</div>
          <div className="text-slate-300 font-medium">
            {depotVehicles.filter((v) => v.status === 'Idle').length}
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={demoMapCenter}
        zoom={14}
        maxZoom={19}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileUrl}
          maxZoom={19}
        />

        <MapControls
          lat={selectedDepot?.lat ?? demoMapCenter[0]}
          lng={selectedDepot?.lng ?? demoMapCenter[1]}
        />

        {/* Depot Zone */}
        {depotZone.length > 0 && (
          <Polygon
            positions={depotZone}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
            }}
          />
        )}

        {depots.map((depot) => (
          <CircleMarker
            key={depot.id}
            center={[depot.lat, depot.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }}
          >
            <Tooltip permanent direction="top" offset={[0, -12]}>
              {depot.name} · {vehicles.filter((vehicle) => vehicle.depotId === depot.id).length} buses
            </Tooltip>
            <Popup>
              <strong>{depot.name}</strong><br />
              {depot.location}<br />
              Approximate site · simulated operations
            </Popup>
          </CircleMarker>
        ))}

        {/* Illustrative routes for this demo profile */}
        {showRoutes &&
          routes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.waypoints}
              pathOptions={{
                color: route.color,
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 12',
              }}
            />
          ))}

        {/* Chargers */}
        {showChargers &&
          chargers.map((charger) => {
            // Position chargers around the depot
            const chargerDepot = depots.find((depot) => depot.id === charger.depotId);
            if (!chargerDepot) return null;
            const chargerLat = chargerDepot.lat + (charger.y - 150) * 0.000003;
            const chargerLng = chargerDepot.lng + (charger.x - 175) * 0.000005;

            return (
              <Marker
                key={charger.id}
                position={[chargerLat, chargerLng]}
                icon={createChargerIcon(charger.status)}
              >
                <Popup className="dark-popup">
                  <div className="font-sans text-sm">
                    <div className="font-bold">{charger.id}</div>
                    <div className="opacity-70">{charger.power}kW {charger.connectionType}</div>
                    <div className={clsx(
                      'font-medium mt-1',
                      charger.status === 'Active' && 'text-blue-500',
                      charger.status === 'Faulted' && 'text-red-500',
                      charger.status === 'Available' && 'opacity-60'
                    )}>
                      {charger.status}
                      {charger.faultCode && ` (${charger.faultCode})`}
                    </div>
                    {charger.connectedVehicle && (
                      <div className="opacity-80 mt-1">
                        Connected: {charger.connectedVehicle}
                      </div>
                    )}
                    {charger.status === 'Active' && (
                      <div className="text-xs opacity-60 mt-2">
                        {Math.round(charger.powerDelivery)}kW · {Math.round(charger.sessionEnergy * 10) / 10} kWh
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Vehicles */}
        {showVehicles &&
          vehicles
            .filter((v) => v.lat && v.lng)
            .map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[vehicle.lat, vehicle.lng]}
                icon={createVehicleIcon(vehicle.status, vehicle.soc, vehicle.requiredSoC)}
                zIndexOffset={200}
              >
                <Popup className="dark-popup">
                  <div className="font-sans text-sm min-w-[150px]">
                    <div className="font-bold">{vehicle.id}</div>
                    <div className="opacity-70">{vehicle.model}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="opacity-60">SoC:</div>
                      <div className={clsx(
                        'font-medium',
                        vehicle.soc >= vehicle.requiredSoC ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {Math.round(vehicle.soc)}%
                      </div>
                      <div className="opacity-60">Status:</div>
                      <div className="font-medium">{vehicle.status}</div>
                      <div className="opacity-60">Driver:</div>
                      <div>{vehicle.driverScore}/100</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
