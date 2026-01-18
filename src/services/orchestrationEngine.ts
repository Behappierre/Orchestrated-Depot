import type { Vehicle, Charger, ScheduledDuty, Depot, Alert } from '../types';

/**
 * Core orchestration engine that detects conflicts and proposes resolutions.
 * This is the "brain" of the digital control tower.
 */

let alertIdCounter = 0;
function generateAlertId(): string {
  return `ALERT-${Date.now()}-${++alertIdCounter}`;
}

export function runOrchestration(
  vehicles: Vehicle[],
  chargers: Charger[],
  schedule: ScheduledDuty[],
  depots: Depot[],
  currentTime: Date
): Alert[] {
  const alerts: Alert[] = [];
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  // ============================================================================
  // 1. CHECK FOR PULL-OUT RISKS
  // ============================================================================

  schedule.forEach((duty) => {
    if (duty.status === 'Departed' || duty.status === 'Completed' || duty.status === 'Cancelled') {
      return;
    }

    const vehicle = vehicles.find((v) => v.id === duty.vehicleId);
    if (!vehicle) return;

    const charger = chargers.find((c) => c.id === vehicle.chargerId);

    // Calculate time until departure
    const [depHour, depMin] = duty.departureTime.split(':').map(Number);
    const departureMinutes = depHour * 60 + depMin;
    const currentTotalMinutes = currentHour * 60 + currentMinutes;
    const minutesUntilDeparture = departureMinutes - currentTotalMinutes;

    // Skip if departure has passed
    if (minutesUntilDeparture < 0) return;

    // -------------------------------------------------------------------------
    // Alert Type 1: Charger fault preventing required charge
    // -------------------------------------------------------------------------
    if (charger && charger.status === 'Faulted' && vehicle.soc < duty.requiredSoC) {
      // Find swap candidates
      const candidates = findSwapCandidates(vehicles, duty, schedule);

      alerts.push({
        id: generateAlertId(),
        severity: 'Critical',
        category: 'charging-fault',
        title: 'Charger Fault - Pull-out at Risk',
        message: `${charger.id} offline (${charger.faultCode}). ${vehicle.id} stuck at ${vehicle.soc}% SoC. Requires ${duty.requiredSoC}% for ${duty.departureTime} departure.`,
        vehicleId: vehicle.id,
        chargerId: charger.id,
        dutyId: duty.id,
        depotId: duty.depotId,
        timestamp: currentTime,
        deadlineTime: new Date(currentTime.getTime() + minutesUntilDeparture * 60000),
        isResolved: false,
        impactDescription: `Service ${duty.routeName} may fail. Driver ${duty.driver} assignment affected.`,
        affectedServices: 1,
        penaltyRisk: 2400, // £ estimated penalty
        proposedActions: candidates.map((c, i) => ({
          id: `action-${i}`,
          label: `Swap with ${c.id}`,
          description: `${c.id} has ${c.soc}% SoC (${c.soc - duty.requiredSoC}% surplus). Available in ${c.location}.`,
          type: 'swap' as const,
          sourceVehicleId: vehicle.id,
          targetVehicleId: c.id,
          confidence: calculateSwapConfidence(c, duty),
          isRecommended: i === 0,
        })),
        confidenceScore: candidates.length > 0 ? calculateSwapConfidence(candidates[0], duty) : 0,
      });
    }

    // -------------------------------------------------------------------------
    // Alert Type 2: Vehicle not charging but SoC below required
    // -------------------------------------------------------------------------
    if (
      vehicle.status === 'Idle' &&
      vehicle.soc < duty.requiredSoC - 5 &&
      minutesUntilDeparture < 90 // Within 90 minutes
    ) {
      const candidates = findSwapCandidates(vehicles, duty, schedule);

      alerts.push({
        id: generateAlertId(),
        severity: vehicle.soc < duty.requiredSoC - 20 ? 'Critical' : 'Warning',
        category: 'pull-out-risk',
        title: 'Vehicle Not Charging',
        message: `${vehicle.id} is idle at ${vehicle.soc}% SoC but needs ${duty.requiredSoC}% for ${duty.departureTime}.`,
        vehicleId: vehicle.id,
        dutyId: duty.id,
        depotId: duty.depotId,
        timestamp: currentTime,
        deadlineTime: new Date(currentTime.getTime() + minutesUntilDeparture * 60000),
        isResolved: false,
        impactDescription: `${minutesUntilDeparture} minutes until departure. ${duty.requiredSoC - vehicle.soc}% charge deficit.`,
        affectedServices: 1,
        penaltyRisk: 1800,
        proposedActions: [
          {
            id: 'action-prioritize',
            label: 'Prioritize Charging',
            description: `Move ${vehicle.id} to available charger immediately.`,
            type: 'prioritize',
            confidence: 70,
            isRecommended: candidates.length === 0,
          },
          ...candidates.map((c, i) => ({
            id: `action-swap-${i}`,
            label: `Swap with ${c.id}`,
            description: `${c.id} at ${c.soc}% SoC available.`,
            type: 'swap' as const,
            sourceVehicleId: vehicle.id,
            targetVehicleId: c.id,
            confidence: calculateSwapConfidence(c, duty),
            isRecommended: i === 0 && candidates.length > 0,
          })),
        ],
        confidenceScore: candidates.length > 0 ? calculateSwapConfidence(candidates[0], duty) : 70,
      });
    }

    // -------------------------------------------------------------------------
    // Alert Type 3: Slow charging - won't reach target in time
    // -------------------------------------------------------------------------
    if (vehicle.status === 'Charging' && charger && charger.status === 'Active') {
      // Estimate if vehicle will reach required SoC
      const chargeRate = (charger.power / 300) * 100 * (1 / 60); // % per minute
      const socNeeded = duty.requiredSoC - vehicle.soc;
      const minutesNeeded = socNeeded / chargeRate;

      if (minutesNeeded > minutesUntilDeparture + 10) {
        // Won't make it with 10 min buffer
        alerts.push({
          id: generateAlertId(),
          severity: 'Warning',
          category: 'soc-deviation',
          title: 'Charging Behind Schedule',
          message: `${vehicle.id} projected to reach ${Math.round(
            vehicle.soc + chargeRate * minutesUntilDeparture
          )}% by ${duty.departureTime}. Needs ${duty.requiredSoC}%.`,
          vehicleId: vehicle.id,
          chargerId: charger.id,
          dutyId: duty.id,
          depotId: duty.depotId,
          timestamp: currentTime,
          deadlineTime: new Date(currentTime.getTime() + minutesUntilDeparture * 60000),
          isResolved: false,
          impactDescription: `Charging at ${charger.power}kW. Estimated ${Math.round(minutesNeeded - minutesUntilDeparture)} minutes short.`,
          affectedServices: 1,
          penaltyRisk: 1200,
          proposedActions: [
            {
              id: 'action-boost',
              label: 'Boost Charging Priority',
              description: `Increase ${charger.id} power allocation if grid allows.`,
              type: 'prioritize',
              confidence: 60,
              isRecommended: false,
            },
            {
              id: 'action-accept',
              label: 'Accept Partial Charge',
              description: `Depart at projected SoC. Route may require opportunity charging.`,
              type: 'acknowledge',
              confidence: 50,
              isRecommended: false,
            },
          ],
          confidenceScore: 60,
        });
      }
    }
  });

  // ============================================================================
  // 2. CHECK GRID CONSTRAINTS
  // ============================================================================

  depots.forEach((depot) => {
    const maxCapacityKw = depot.maxCapacity * 1000;

    // Check for time-based constraints
    const activeConstraint = depot.constraints.find((c) => {
      const inTimeWindow = currentHour >= c.startHour && currentHour < c.endHour;
      const inMonthWindow =
        !c.months || c.months.includes(currentTime.getMonth() + 1);
      return inTimeWindow && inMonthWindow && c.maxCapacityPercent < 100;
    });

    const effectiveMax = activeConstraint
      ? maxCapacityKw * (activeConstraint.maxCapacityPercent / 100)
      : maxCapacityKw;

    const loadPercent = (depot.currentLoad / effectiveMax) * 100;

    if (loadPercent > 85) {
      alerts.push({
        id: generateAlertId(),
        severity: loadPercent > 95 ? 'Critical' : 'Warning',
        category: 'grid-constraint',
        title: loadPercent > 95 ? 'Grid Capacity Critical' : 'Grid Load High',
        message: `${depot.name} at ${Math.round(loadPercent)}% of allowed capacity (${Math.round(depot.currentLoad)}kW / ${Math.round(effectiveMax)}kW).`,
        depotId: depot.id,
        timestamp: currentTime,
        isResolved: false,
        impactDescription: activeConstraint
          ? `Constraint active: ${activeConstraint.description}`
          : 'Approaching maximum grid connection capacity.',
        affectedServices: 0,
        penaltyRisk: loadPercent > 95 ? 5000 : 2000, // Demand charges
        proposedActions: [
          {
            id: 'action-reduce',
            label: 'Reduce Charging Load',
            description: 'Temporarily reduce power to non-priority vehicles.',
            type: 'prioritize',
            confidence: 85,
            estimatedSavings: 500,
            isRecommended: true,
          },
          {
            id: 'action-monitor',
            label: 'Monitor Only',
            description: 'Continue monitoring. Alert again if 95% exceeded.',
            type: 'acknowledge',
            confidence: 40,
            isRecommended: false,
          },
        ],
        confidenceScore: 85,
      });
    }
  });

  // ============================================================================
  // 3. CHECK FOR MAINTENANCE CONFLICTS
  // ============================================================================

  vehicles.forEach((vehicle) => {
    if (vehicle.nextService === 'Urgent' && vehicle.assignedDuty) {
      const duty = schedule.find((d) => d.id === vehicle.assignedDuty);
      if (duty && duty.status !== 'Departed') {
        alerts.push({
          id: generateAlertId(),
          severity: 'Warning',
          category: 'maintenance',
          title: 'Maintenance Overdue',
          message: `${vehicle.id} has overdue maintenance but is assigned to ${duty.id} at ${duty.departureTime}.`,
          vehicleId: vehicle.id,
          dutyId: duty.id,
          depotId: vehicle.depotId,
          timestamp: currentTime,
          isResolved: false,
          impactDescription: `Vehicle may not be safe for service. Consider replacement.`,
          affectedServices: 1,
          penaltyRisk: 0,
          proposedActions: [
            {
              id: 'action-replace',
              label: 'Assign Reserve Vehicle',
              description: 'Replace with available maintenance-clear vehicle.',
              type: 'swap',
              confidence: 90,
              isRecommended: true,
            },
            {
              id: 'action-clear',
              label: 'Clear for Service',
              description: 'Engineering confirms vehicle safe for one more duty.',
              type: 'acknowledge',
              confidence: 60,
              isRecommended: false,
            },
          ],
          confidenceScore: 90,
        });
      }
    }
  });

  return alerts;
}

/**
 * Find vehicles that could swap with the at-risk vehicle
 */
function findSwapCandidates(
  vehicles: Vehicle[],
  duty: ScheduledDuty,
  schedule: ScheduledDuty[]
): Vehicle[] {
  return vehicles
    .filter((v) => {
      // Must be same depot
      if (v.depotId !== duty.depotId) return false;

      // Must have sufficient SoC
      if (v.soc < duty.requiredSoC) return false;

      // Must not be assigned to another duty
      if (v.assignedDuty && v.assignedDuty !== duty.id) {
        // Check if their duty is later
        const otherDuty = schedule.find((d) => d.id === v.assignedDuty);
        if (otherDuty && otherDuty.departureTime <= duty.departureTime) {
          return false;
        }
      }

      // Must not be faulted or in maintenance
      if (v.status === 'Faulted' || v.status === 'Maintenance') return false;

      // Must not be driving
      if (v.status === 'Driving') return false;

      // Not the same vehicle
      if (v.id === duty.vehicleId) return false;

      return true;
    })
    .sort((a, b) => b.soc - a.soc) // Sort by highest SoC first
    .slice(0, 3); // Return top 3 candidates
}

/**
 * Calculate confidence score for a swap action
 */
function calculateSwapConfidence(candidate: Vehicle, duty: ScheduledDuty): number {
  let confidence = 50;

  // Higher SoC surplus = higher confidence
  const surplus = candidate.soc - duty.requiredSoC;
  confidence += Math.min(surplus / 2, 20);

  // Better SoH = higher confidence
  if (candidate.soh > 95) confidence += 10;
  else if (candidate.soh > 90) confidence += 5;

  // Better efficiency = higher confidence
  if (candidate.efficiency < 1.3) confidence += 10;
  else if (candidate.efficiency < 1.5) confidence += 5;

  // No existing duty = higher confidence
  if (!candidate.assignedDuty) confidence += 10;

  return Math.min(Math.round(confidence), 99);
}
