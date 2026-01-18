import type { Route } from '../types';

export const mockRoutes: Route[] = [
  {
    id: 'route-5a',
    name: 'Route 5A',
    color: '#ef4444',
    depotId: 'central',
    waypoints: [
      [51.532, -0.124],   // Central Depot (King's Cross)
      [51.528, -0.118],   // Euston
      [51.523, -0.108],   // Holborn
      [51.515, -0.092],   // Bank
      [51.508, -0.076],   // Tower Hill
      [51.503, -0.055],   // Shadwell
      [51.508, -0.040],   // Limehouse
      [51.512, -0.025],   // Canary Wharf
    ],
    distanceKm: 145,
    estimatedDurationMin: 285, // ~4.75 hours round trip
    averageEnergyKwh: 180,
    elevationGain: 45,
    stops: 32,
  },
  {
    id: 'route-10b',
    name: 'Route 10B',
    color: '#22c55e',
    depotId: 'central',
    waypoints: [
      [51.532, -0.124],   // Central Depot
      [51.538, -0.132],   // Camden Town
      [51.548, -0.145],   // Hampstead
      [51.558, -0.158],   // Golders Green
      [51.565, -0.178],   // Brent Cross
    ],
    distanceKm: 132,
    estimatedDurationMin: 265,
    averageEnergyKwh: 165,
    elevationGain: 78,
    stops: 28,
  },
  {
    id: 'route-25',
    name: 'Route 25',
    color: '#3b82f6',
    depotId: 'central',
    waypoints: [
      [51.532, -0.124],   // Central Depot
      [51.522, -0.108],   // Chancery Lane
      [51.515, -0.092],   // Bank
      [51.512, -0.072],   // Aldgate
      [51.520, -0.045],   // Mile End
      [51.535, -0.022],   // Bow
      [51.543, -0.009],   // Stratford
    ],
    distanceKm: 158,
    estimatedDurationMin: 310,
    averageEnergyKwh: 198,
    elevationGain: 32,
    stops: 38,
  },
  {
    id: 'route-73',
    name: 'Route 73',
    color: '#f59e0b',
    depotId: 'central',
    waypoints: [
      [51.532, -0.124],   // Central Depot
      [51.540, -0.110],   // Angel
      [51.552, -0.100],   // Highbury
      [51.564, -0.106],   // Finsbury Park
      [51.576, -0.098],   // Manor House
      [51.588, -0.088],   // Seven Sisters
      [51.592, -0.072],   // Tottenham
    ],
    distanceKm: 168,
    estimatedDurationMin: 320,
    averageEnergyKwh: 210,
    elevationGain: 52,
    stops: 42,
  },
  {
    id: 'route-29',
    name: 'Route 29',
    color: '#8b5cf6',
    depotId: 'north',
    waypoints: [
      [51.564, -0.106],   // North Depot (Finsbury Park)
      [51.555, -0.088],   // Stoke Newington
      [51.545, -0.072],   // Dalston
      [51.532, -0.055],   // Hackney
      [51.520, -0.045],   // Mile End
      [51.508, -0.040],   // Limehouse
    ],
    distanceKm: 125,
    estimatedDurationMin: 250,
    averageEnergyKwh: 156,
    elevationGain: 28,
    stops: 30,
  },
  {
    id: 'route-41',
    name: 'Route 41',
    color: '#06b6d4',
    depotId: 'north',
    waypoints: [
      [51.564, -0.106],   // North Depot
      [51.572, -0.120],   // Crouch End
      [51.582, -0.135],   // Archway
      [51.592, -0.150],   // Highgate
      [51.598, -0.175],   // Muswell Hill
    ],
    distanceKm: 138,
    estimatedDurationMin: 275,
    averageEnergyKwh: 172,
    elevationGain: 95,
    stops: 32,
  },
  {
    id: 'route-25-east',
    name: 'Route 25 East',
    color: '#ec4899',
    depotId: 'east',
    waypoints: [
      [51.543, -0.009],   // East Depot (Stratford)
      [51.552, 0.008],    // Leyton
      [51.558, 0.025],    // Leytonstone
      [51.565, 0.042],    // Wanstead
      [51.572, 0.062],    // Redbridge
      [51.578, 0.082],    // Ilford
    ],
    distanceKm: 142,
    estimatedDurationMin: 285,
    averageEnergyKwh: 178,
    elevationGain: 18,
    stops: 35,
  },
  {
    id: 'route-86',
    name: 'Route 86',
    color: '#14b8a6',
    depotId: 'east',
    waypoints: [
      [51.543, -0.009],   // East Depot
      [51.535, -0.022],   // Bow
      [51.520, -0.045],   // Mile End
      [51.512, -0.072],   // Aldgate
      [51.505, -0.088],   // Monument
      [51.498, -0.108],   // Waterloo
      [51.492, -0.125],   // Lambeth North
    ],
    distanceKm: 155,
    estimatedDurationMin: 305,
    averageEnergyKwh: 194,
    elevationGain: 35,
    stops: 40,
  },
];
