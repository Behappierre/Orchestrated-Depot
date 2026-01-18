import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../../stores/useAppStore';
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
function MapControls() {
  const map = useMap();

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <button
        onClick={() => map.setView([51.532, -0.124], 15)}
        className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-700 transition-colors shadow-lg"
      >
        <Locate className="w-5 h-5" />
      </button>
    </div>
  );
}

export function MapView() {
  const { vehicles, chargers, routes, depots, selectedDepotId, isDarkMode } = useAppStore();
  const [showRoutes, setShowRoutes] = useState(true);
  const [showChargers, setShowChargers] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  const selectedDepot = depots.find((d) => d.id === selectedDepotId);
  const depotVehicles = vehicles.filter((v) => v.depotId === selectedDepotId);
  const depotChargers = chargers.filter((c) => c.depotId === selectedDepotId);
  const depotRoutes = routes.filter((r) => r.depotId === selectedDepotId);

  const tileUrl = isDarkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Depot zone polygon (simplified rectangle around depot)
  const depotZone = selectedDepot
    ? [
        [selectedDepot.lat + 0.002, selectedDepot.lng - 0.003],
        [selectedDepot.lat + 0.002, selectedDepot.lng + 0.003],
        [selectedDepot.lat - 0.002, selectedDepot.lng + 0.003],
        [selectedDepot.lat - 0.002, selectedDepot.lng - 0.003],
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
            <span className="text-sm text-slate-300">Vehicles ({depotVehicles.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showChargers}
              onChange={(e) => setShowChargers(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">Chargers ({depotChargers.length})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => setShowRoutes(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <Route className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-300">Routes ({depotRoutes.length})</span>
          </label>
        </div>

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
        center={selectedDepot ? [selectedDepot.lat, selectedDepot.lng] : [51.532, -0.124]}
        zoom={14}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={tileUrl}
        />

        <MapControls />

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

        {/* Routes */}
        {showRoutes &&
          depotRoutes.map((route) => (
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
          depotChargers.map((charger) => {
            // Position chargers around the depot
            const chargerLat = (selectedDepot?.lat || 51.532) + (charger.y - 150) * 0.00002;
            const chargerLng = (selectedDepot?.lng || -0.124) + (charger.x - 175) * 0.00003;

            return (
              <Marker
                key={charger.id}
                position={[chargerLat, chargerLng]}
                icon={createChargerIcon(charger.status)}
              >
                <Popup>
                  <div className="font-sans text-sm">
                    <div className="font-bold text-slate-900">{charger.id}</div>
                    <div className="text-slate-600">{charger.power}kW {charger.connectionType}</div>
                    <div className={clsx(
                      'font-medium mt-1',
                      charger.status === 'Active' && 'text-blue-600',
                      charger.status === 'Faulted' && 'text-red-600',
                      charger.status === 'Available' && 'text-gray-600'
                    )}>
                      {charger.status}
                      {charger.faultCode && ` (${charger.faultCode})`}
                    </div>
                    {charger.connectedVehicle && (
                      <div className="text-slate-600 mt-1">
                        Connected: {charger.connectedVehicle}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Vehicles */}
        {showVehicles &&
          depotVehicles
            .filter((v) => v.lat && v.lng)
            .map((vehicle) => (
              <Marker
                key={vehicle.id}
                position={[vehicle.lat, vehicle.lng]}
                icon={createVehicleIcon(vehicle.status, vehicle.soc, vehicle.requiredSoC)}
              >
                <Popup>
                  <div className="font-sans text-sm min-w-[150px]">
                    <div className="font-bold text-slate-900">{vehicle.id}</div>
                    <div className="text-slate-600">{vehicle.model}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div className="text-slate-500">SoC:</div>
                      <div className={clsx(
                        'font-medium',
                        vehicle.soc >= vehicle.requiredSoC ? 'text-green-600' : 'text-red-600'
                      )}>
                        {vehicle.soc}%
                      </div>
                      <div className="text-slate-500">Status:</div>
                      <div className="font-medium text-slate-900">{vehicle.status}</div>
                      <div className="text-slate-500">Driver:</div>
                      <div className="text-slate-900">{vehicle.driverScore}/100</div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
