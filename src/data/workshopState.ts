import type { Vehicle, ScheduledDuty, Charger } from "../types";

export function prepareWorkshop(
  vehicles: Vehicle[],
  schedule: ScheduledDuty[],
  chargers: Charger[],
) {
  const fleet = structuredClone(vehicles);
  const duties = structuredClone(schedule);
  const chargePoints = structuredClone(chargers);
  for (const vehicle of fleet) {
    vehicle.assignedDuty =
      duties.find((duty) => duty.vehicleId === vehicle.id)?.id ?? null;
  }
  for (const depotId of ["central", "north", "east"]) {
    const duty =
      depotId === "central"
        ? duties.find((d) => d.id === "DUTY-003")!
        : duties.find((d) => d.depotId === depotId && d.status !== "Departed")!;
    duty.departureTime = "06:30";
    duty.status = "Scheduled";
    const bus = fleet.find((v) => v.id === duty.vehicleId)!;
    const reserve = fleet.find(
      (v) => v.depotId === depotId && !v.assignedDuty && v.id !== bus.id,
    )!;
    for (const vehicle of [bus, reserve]) {
      vehicle.status = "Idle";
      vehicle.soc = 98;
      vehicle.chargerId = null;
      vehicle.requiredSoC = duty.requiredSoC;
      vehicle.location =
        vehicle === reserve
          ? "Workshop reserve · crew assumed ready"
          : "Workshop departure point";
      for (const charger of chargePoints) {
        if (charger.connectedVehicle === vehicle.id) {
          charger.connectedVehicle = null;
          if (charger.status === "Active") charger.status = "Available";
          charger.powerDelivery = 0;
        }
      }
    }
  }
  return { vehicles: fleet, schedule: duties, chargers: chargePoints };
}

export function workshopDuty(schedule: ScheduledDuty[], depotId: string) {
  return depotId === "central"
    ? schedule.find((d) => d.id === "DUTY-003")
    : schedule.find(
        (d) =>
          d.depotId === depotId &&
          d.departureTime >= "06:30" &&
          d.status !== "Departed",
      );
}
