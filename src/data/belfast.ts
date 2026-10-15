// Approximate public depot locations, verified 15 October 2026.
// Names: Translink's Bus Driver Recruitment July 2025 depot list.
// Coordinates: OpenStreetMap via Mapcarta (Milewater/Falls) and Geograph (Short Strand).
// These locations do not imply real fleet allocations, charger layouts or telemetry.
export const belfastDepots = {
  central: { name: 'Milewater Service Centre', location: 'Duncrue Street, Belfast', lat: 54.61802, lng: -5.91547 },
  north: { name: 'Falls Road Depot', location: 'Falls Road, Belfast', lat: 54.58527, lng: -5.97948 },
  east: { name: 'Short Strand Depot', location: 'Mountpottinger Road, Belfast', lat: 54.59799, lng: -5.91162 },
} as const;

export const belfastCenter: [number, number] = [54.602, -5.94];

// Compact, repeatable parking positions around each approximate depot centre.
export function getDepotPosition(depotId: string, slot: number) {
  const depot = belfastDepots[depotId as keyof typeof belfastDepots];
  if (!depot) throw new Error(`Unknown demo depot: ${depotId}`);
  return {
    lat: depot.lat + (Math.floor(slot / 5) - 2) * 0.00009,
    lng: depot.lng + ((slot % 5) - 2) * 0.00015,
  };
}
