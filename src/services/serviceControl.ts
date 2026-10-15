export type ControlOptionId = 'monitor' | 'reserve' | 'review';

export interface ControlInputs {
  lateness: number;
  plannedLayover: number;
  minimumTurnaround: number;
  reserveAvailable: boolean;
  dataConfirmed: boolean;
}

export interface ControlOption {
  id: ControlOptionId;
  title: string;
  explanation: string;
  tradeOff: string;
  nextDepartureDelay: number | null;
  available: boolean;
}

export const controlExamples = {
  recovery: { label: 'Delay absorbed by layover', plannedLayover: 22 },
  intervention: { label: 'Recovery time insufficient', plannedLayover: 12 },
} as const;

export function evaluateControl(inputs: ControlInputs) {
  const { lateness, plannedLayover, minimumTurnaround, reserveAvailable, dataConfirmed } = inputs;
  if (![lateness, plannedLayover, minimumTurnaround].every(Number.isFinite) ||
      lateness < 0 || plannedLayover < 0 || minimumTurnaround < 1 ||
      lateness > 60 || plannedLayover > 60 || minimumTurnaround > 60) {
    throw new Error('Enter valid minutes: delay and layover 0–60, minimum turnaround 1–60.');
  }
  const recoveryAllowance = Math.max(0, plannedLayover - minimumTurnaround);
  const nextDepartureDelay = Math.max(0, lateness + minimumTurnaround - plannedLayover);
  const recommendedId: ControlOptionId = nextDepartureDelay === 0
    ? 'monitor' : reserveAvailable ? 'reserve' : 'review';
  const ruleId = recommendedId === 'monitor' ? 'RECOVERY-01' : recommendedId === 'reserve' ? 'RESERVE-02' : 'REVIEW-03';
  const reason = recommendedId === 'monitor'
    ? `The ${lateness}-minute delay fits within ${recoveryAllowance} minutes of recovery allowance. Keep at least ${minimumTurnaround} minutes for turnaround; the next departure can remain on time.`
    : recommendedId === 'reserve'
    ? `The incoming bus cannot protect the next departure: ${nextDepartureDelay} minutes of delay remain. A reserve is confirmed ready at the departure point; propose covering the next duty.`
    : `The next departure is ${nextDepartureDelay} minutes at risk and no reserve is confirmed. Ask the controller to review regulation options against local rules.`;

  const options: ControlOption[] = [
    { id: 'monitor', title: 'Retain bus and monitor recovery', available: true,
      explanation: nextDepartureDelay === 0 ? 'Retain the planned vehicle and departure.' : `Keep the vehicle; modelled next departure is ${nextDepartureDelay} minutes late.`,
      tradeOff: 'Avoids unnecessary intervention. If recovery is insufficient, the next duty inherits the delay.', nextDepartureDelay },
    { id: 'reserve', title: 'Cover next duty with a reserve', available: reserveAvailable,
      explanation: reserveAvailable ? 'Use the confirmed ready reserve at the departure point; let the incoming bus recover.' : 'Unavailable: no ready reserve confirmed at the departure point.',
      tradeOff: 'Uses spare capacity. Requires controller confirmation of crew, accessibility, vehicle readiness and subsequent duties.', nextDepartureDelay: reserveAvailable ? 0 : null },
    { id: 'review', title: 'Escalate for service-regulation review', available: true,
      explanation: 'Review holding, short-turning or other permitted interventions with the duty controller.',
      tradeOff: 'No automatic short-turn or cancellation. Passenger impact and local rules need validation.', nextDepartureDelay: null },
  ];
  return { recoveryAllowance, nextDepartureDelay, recommendedId, ruleId, reason, options, adviceReady: dataConfirmed };
}

export function approveControlDecision(inputs: ControlInputs, selectedId: ControlOptionId, overrideReason: string) {
  const evaluation = evaluateControl(inputs);
  if (!evaluation.adviceReady) throw new Error('Confirm the AVL and timetable inputs before approving a plan.');
  const option = evaluation.options.find(item => item.id === selectedId);
  if (!option?.available) throw new Error('That option is unavailable.');
  const isOverride = evaluation.recommendedId !== selectedId;
  if (isOverride && !overrideReason.trim()) throw new Error('Record a reason for choosing an alternative.');
  return {
    inputs: { ...inputs }, option: { ...option }, ruleId: evaluation.ruleId,
    recommendedId: evaluation.recommendedId, reason: evaluation.reason,
    overrideReason: isOverride ? overrideReason.trim() : '',
    handoffs: selectedId === 'review'
      ? ['Control: regulation review requested', 'Timetable: no departure update applied', 'Fleet: no vehicle reassignment applied']
      : selectedId === 'reserve'
      ? ['Control: reserve-cover plan recorded', 'Timetable: reserve assigned to next demo duty', 'Fleet: reserve held; crew/readiness confirmation recorded for this example']
      : ['Control: recovery monitoring plan recorded', 'Timetable: original assignment retained', 'Fleet: no reserve consumed'],
  };
}
