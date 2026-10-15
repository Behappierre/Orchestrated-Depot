export type ControlOptionId = "monitor" | "reserve" | "review" | "hold";

export interface ControlInputs {
  lateness: number;
  plannedLayover: number;
  minimumTurnaround: number;
  reserveAvailable: boolean;
  dataConfirmed: boolean;
  headwayCase?: boolean;
  frontGap?: number;
  followingGap?: number;
  reliefSlack?: number;
  onBoard?: number;
  waiting?: number;
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
  recovery: { label: "Delay absorbed by layover", plannedLayover: 22 },
  intervention: { label: "Recovery time insufficient", plannedLayover: 12 },
  headway: { label: "Bunching and driver relief", plannedLayover: 22 },
} as const;

export function evaluateControl(inputs: ControlInputs) {
  const {
    lateness,
    plannedLayover,
    minimumTurnaround,
    reserveAvailable,
    dataConfirmed,
  } = inputs;
  if (
    ![lateness, plannedLayover, minimumTurnaround].every(Number.isInteger) ||
    lateness < 0 ||
    plannedLayover < 0 ||
    minimumTurnaround < 1 ||
    lateness > 60 ||
    plannedLayover > 60 ||
    minimumTurnaround > 60
  ) {
    throw new Error(
      "Enter valid minutes: delay and layover 0–60, minimum turnaround 1–60.",
    );
  }
  const recoveryAllowance = Math.max(0, plannedLayover - minimumTurnaround);
  const nextDepartureDelay = Math.max(
    0,
    lateness + minimumTurnaround - plannedLayover,
  );
  const holdMinutes = inputs.headwayCase
    ? Math.ceil(
        Math.max(0, ((inputs.followingGap ?? 17) - (inputs.frontGap ?? 3)) / 2),
      )
    : 0;
  if (
    inputs.headwayCase &&
    ![
      inputs.frontGap,
      inputs.followingGap,
      inputs.reliefSlack,
      inputs.onBoard,
      inputs.waiting,
    ].every(
      (value) =>
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 200,
    )
  )
    throw new Error(
      "Enter whole-number headway, relief and passenger assumptions (0–200).",
    );
  const holdAvailable = Boolean(
    inputs.headwayCase &&
      holdMinutes > 0 &&
      holdMinutes <= (inputs.reliefSlack ?? 0),
  );
  const recommendedId: ControlOptionId = inputs.headwayCase
    ? holdAvailable
      ? "hold"
      : holdMinutes === 0
        ? "monitor"
        : "review"
    : nextDepartureDelay === 0
      ? "monitor"
      : reserveAvailable
        ? "reserve"
        : "review";
  const ruleId = inputs.headwayCase
    ? "HEADWAY-04"
    : recommendedId === "monitor"
      ? "RECOVERY-01"
      : recommendedId === "reserve"
        ? "RESERVE-02"
        : "REVIEW-03";
  const reason = inputs.headwayCase
    ? holdAvailable
      ? `Hold for ${holdMinutes} minutes at the assumed control point: gaps change from ${inputs.frontGap}/${inputs.followingGap} to ${(inputs.frontGap ?? 0) + holdMinutes}/${(inputs.followingGap ?? 0) - holdMinutes} minutes. This stays within ${inputs.reliefSlack} minutes of driver-relief slack.`
      : holdMinutes === 0
        ? "Depart immediately: a positive hold would not improve the current spacing. Continue monitoring the next bus and driver relief."
        : "A hold cannot improve spacing within the confirmed driver-relief slack. Request controller review; do not automatically short-turn or cancel."
    : recommendedId === "monitor"
      ? `The ${lateness}-minute delay fits within ${recoveryAllowance} minutes of recovery allowance. Keep at least ${minimumTurnaround} minutes for turnaround; the next departure can remain on time.`
      : recommendedId === "reserve"
        ? `The incoming bus cannot protect the next departure: ${nextDepartureDelay} minutes of delay remain. A reserve is confirmed ready at the departure point; propose covering the next duty.`
        : `The next departure is ${nextDepartureDelay} minutes at risk and no reserve is confirmed. Ask the controller to review regulation options against local rules.`;

  const options: ControlOption[] = [
    {
      id: "monitor",
      title: "Retain bus and monitor recovery",
      available: true,
      explanation:
        nextDepartureDelay === 0
          ? "Retain the planned vehicle and departure."
          : `Keep the vehicle; modelled next departure is ${nextDepartureDelay} minutes late.`,
      tradeOff:
        "Avoids unnecessary intervention. If recovery is insufficient, the next duty inherits the delay.",
      nextDepartureDelay,
    },
    {
      id: "reserve",
      title: "Cover next duty with a reserve",
      available: reserveAvailable,
      explanation: reserveAvailable
        ? "Use the confirmed ready reserve at the departure point; let the incoming bus recover."
        : "Unavailable: no ready reserve confirmed at the departure point.",
      tradeOff:
        "Uses spare capacity. Requires controller confirmation of crew, accessibility, vehicle readiness and subsequent duties.",
      nextDepartureDelay: reserveAvailable ? 0 : null,
    },
    {
      id: "review",
      title: "Escalate for service-regulation review",
      available: true,
      explanation:
        "Review holding, short-turning or other permitted interventions with the duty controller.",
      tradeOff:
        "No automatic short-turn or cancellation. Passenger impact and local rules need validation.",
      nextDepartureDelay: null,
    },
  ];
  if (inputs.headwayCase) {
    options[0] = {
      ...options[0],
      title: "Depart immediately",
      explanation: `Retain ${inputs.frontGap}/${inputs.followingGap}-minute gaps; no extra on-board delay.`,
      tradeOff: `Leaves an uneven service for an assumed ${inputs.waiting} waiting passengers.`,
      nextDepartureDelay: 0,
    };
    options.splice(1, 1, {
      id: "hold",
      title: `Hold ${holdMinutes} minutes to regulate spacing`,
      available: holdAvailable,
      explanation: `Modelled gaps: ${(inputs.frontGap ?? 0) + holdMinutes}/${(inputs.followingGap ?? 0) - holdMinutes} minutes.`,
      tradeOff: `${inputs.onBoard} assumed on-board passengers × ${holdMinutes} minutes = ${(inputs.onBoard ?? 0) * holdMinutes} passenger-minutes added; relief slack ${inputs.reliefSlack} minutes.`,
      nextDepartureDelay: holdMinutes,
    });
  }
  return {
    recoveryAllowance,
    nextDepartureDelay,
    recommendedId,
    ruleId,
    reason,
    options,
    adviceReady: dataConfirmed,
    holdMinutes,
  };
}

export function approveControlDecision(
  inputs: ControlInputs,
  selectedId: ControlOptionId,
  overrideReason: string,
) {
  const evaluation = evaluateControl(inputs);
  if (!evaluation.adviceReady)
    throw new Error(
      "Confirm the AVL and timetable inputs before approving a plan.",
    );
  const option = evaluation.options.find((item) => item.id === selectedId);
  if (!option?.available) throw new Error("That option is unavailable.");
  const isOverride = evaluation.recommendedId !== selectedId;
  if (isOverride && !overrideReason.trim())
    throw new Error("Record a reason for choosing an alternative.");
  return {
    inputs: { ...inputs },
    option: { ...option },
    ruleId: evaluation.ruleId,
    recommendedId: evaluation.recommendedId,
    reason: evaluation.reason,
    overrideReason: isOverride ? overrideReason.trim() : "",
    handoffs:
      selectedId === "review"
        ? [
            "Control: regulation review requested",
            "Timetable: no departure update applied",
            "Fleet: no vehicle reassignment applied",
          ]
        : selectedId === "hold"
          ? [
              "Control: hold instruction recorded in simulation",
              "Timetable: simulated departure retimed",
              "Crew: assumed relief slack checked; no live instruction sent",
            ]
          : selectedId === "reserve"
            ? [
                "Control: reserve-cover plan recorded",
                "Timetable: reserve assigned to next demo duty",
                "Fleet: reserve held; crew/readiness confirmation recorded for this example",
              ]
            : [
                "Control: recovery monitoring plan recorded",
                "Timetable: original assignment retained",
                "Fleet: no reserve consumed",
              ],
  };
}
