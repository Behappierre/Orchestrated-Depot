import { useState } from "react";
import { clsx } from "clsx";
import { useAppStore } from "../../stores/useAppStore";
import { useControlStore } from "../../stores/useControlStore";
import {
  controlExamples,
  evaluateControl,
} from "../../services/serviceControl";
import type {
  ControlInputs,
  ControlOptionId,
} from "../../services/serviceControl";
import { workshopDuty } from "../../data/workshopState";
import { PublicContext } from "./PublicContext";

export function ControlView() {
  const app = useAppStore();
  const {
    inputs,
    exampleId,
    setExample,
    updateInputs,
    approve,
    reset,
    applied,
    history,
  } = useControlStore();
  const [selected, setSelected] = useState<ControlOptionId | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const depotName = app.depots.find((d) => d.id === app.selectedDepotId)!.name;
  const duty = applied
    ? app.schedule.find(item => item.id === applied.dutyId)
    : workshopDuty(app.schedule, app.selectedDepotId);
  const evaluation = evaluateControl(inputs);
  const selectedId = applied?.option.id ?? selected ?? evaluation.recommendedId;
  const option = evaluation.options.find((o) => o.id === selectedId);
  const override = selectedId !== evaluation.recommendedId;
  const clear = () => {
    setSelected(null);
    setReason("");
    setError("");
  };
  const numberInput = (
    field: keyof ControlInputs,
    label: string,
    max = 60,
    min = 0,
  ) => (
    <label className="block text-xs text-slate-300" key={field}>
      {label}
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={Number(inputs[field] ?? 0)}
        disabled={Boolean(applied)}
        onChange={(e) => {
          updateInputs({
            [field]: Math.max(
              min,
              Math.min(max, Math.round(Number(e.target.value)) || min),
            ),
          });
          clear();
        }}
        className="mt-1 w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-lg text-white disabled:opacity-60"
      />
    </label>
  );

  return (
    <div className="max-w-[1500px] mx-auto space-y-3 pb-4">
      <div className="flex flex-wrap justify-between gap-2 items-center">
        <div>
          <h2 className="text-xl font-semibold">
            {inputs.headwayCase
              ? "Regulate the service without missing a driver relief"
              : `A bus is ${inputs.lateness} minutes late. Protect the next departure.`}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Belfast workshop · all running, passenger and crew inputs simulated
            · controller retains approval
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-blue-300"
          onClick={() => {
            reset();
            clear();
          }}
        >
          Reset whole demo
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(controlExamples).map(([id, item]) => (
          <button
            key={id}
            aria-pressed={exampleId === id}
            className={clsx(
              "rounded-lg border px-3 py-2 text-xs",
              id === exampleId
                ? "border-blue-400 bg-blue-500/20 text-blue-200"
                : "border-slate-700 text-slate-300",
            )}
            onClick={() => {
              setExample(id as keyof typeof controlExamples);
              clear();
            }}
          >
            {item.label}
          </button>
        ))}
        <span className="self-center text-xs text-slate-500">
          Changing case also restores the fleet and clears decisions.
        </span>
      </div>
      <div className="grid lg:grid-cols-[0.85fr_1.4fr] gap-3">
        <section className="glass-card p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold">
              {applied?.depotName ?? depotName}
            </h3>
            <p className="text-xs text-blue-300 mt-1">
              {applied?.dutyId ?? duty?.id} · {duty?.vehicleId} ·{" "}
              {applied?.departureTime ?? duty?.departureTime} departure
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Synthetic duty at an approximate depot departure point
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {inputs.headwayCase ? (
              <>
                {numberInput("frontGap", "Gap ahead (min)")}
                {numberInput("followingGap", "Gap behind (min)")}
                {numberInput("reliefSlack", "Relief slack (min)")}
              </>
            ) : (
              <>
                {numberInput("lateness", "Inbound delay (min)")}
                {numberInput("plannedLayover", "Layover (min)")}
                {numberInput("minimumTurnaround", "Turnaround (min)", 60, 1)}
              </>
            )}
          </div>
          {inputs.headwayCase && (
            <div className="grid grid-cols-2 gap-2">
              {numberInput("onBoard", "On-board passengers", 200)}
              {numberInput("waiting", "Waiting passengers", 200)}
            </div>
          )}
          <p className="text-xs text-slate-400">
            {inputs.headwayCase
              ? "Assume a permitted holding point; fixed following-bus arrival and passenger estimates. Relief slack is available beyond the protected turnaround."
              : `Recoverable layover: ${evaluation.recoveryAllowance} min. Modelled next-departure delay: ${evaluation.nextDepartureDelay} min. Turnaround is an unvalidated workshop assumption.`}
          </p>
          {!inputs.headwayCase && (
            <label className="flex gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={inputs.reserveAvailable}
                disabled={Boolean(applied)}
                onChange={(e) => {
                  updateInputs({ reserveAvailable: e.target.checked });
                  clear();
                }}
              />
              Reserve at departure point, crew and readiness confirmed in this
              example
            </label>
          )}
          <label className="flex gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={inputs.dataConfirmed}
              disabled={Boolean(applied)}
              onChange={(e) => {
                updateInputs({ dataConfirmed: e.target.checked });
                clear();
              }}
            />
            Example source inputs and local constraints checked
          </label>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
            <div className="text-xs font-semibold text-blue-300">
              {evaluation.adviceReady
                ? `Recommendation · ${evaluation.ruleId}`
                : "Advice held · confirm inputs"}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mt-1">
              {evaluation.adviceReady
                ? evaluation.reason
                : "Approval is blocked until the source inputs and local constraints have been checked."}
            </p>
          </div>
        </section>
        <section className="glass-card p-4 space-y-2">
          <h3 className="text-sm font-semibold">Compare alternatives</h3>
          {evaluation.options.map((item) => (
            <button
              key={item.id}
              disabled={!item.available || Boolean(applied)}
              aria-pressed={selectedId === item.id}
              onClick={() => {
                setSelected(item.id);
                setError("");
              }}
              className={clsx(
                "w-full text-left rounded-lg border px-3 py-2 disabled:cursor-default",
                selectedId === item.id
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-slate-700",
                !item.available && "opacity-40",
              )}
            >
              <div className="flex justify-between gap-2 text-sm">
                <span>{item.title}</span>
                <span className="text-blue-300 text-xs shrink-0">
                  {item.id === evaluation.recommendedId
                    ? "Recommended"
                    : item.available
                      ? "Alternative"
                      : "Unavailable"}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{item.explanation}</p>
              <p className="text-xs text-slate-400 mt-1">{item.tradeOff}</p>
            </button>
          ))}
          {override && !applied && (
            <label className="block text-xs text-slate-300">
              Reason for choosing an alternative
              <input
                aria-label="Reason for choosing an alternative"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full mt-1 rounded border border-slate-600 bg-slate-800 p-2"
              />
            </label>
          )}
          <button
            disabled={
              Boolean(applied) ||
              !evaluation.adviceReady ||
              !option?.available ||
              (override && !reason.trim())
            }
            onClick={() => {
              try {
                approve(selectedId, reason, depotName);
                setError("");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to approve");
              }
            }}
            className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 py-2.5 text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-400"
          >
            {applied
              ? "Plan applied to simulated fleet and duty"
              : "Approve simulated plan"}
          </button>
          {error && (
            <p role="alert" className="text-xs text-red-300">
              {error}
            </p>
          )}
        </section>
      </div>
      {applied && (
        <section
          aria-live="polite"
          className="glass-card p-3 border-emerald-500/40 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm text-emerald-300">
              {applied.option.id === "review"
                ? "Review requested; fleet and timetable retained."
                : `${applied.dutyId}: ${applied.vehicleIds[applied.vehicleIds.length - 1]} assigned · departure ${applied.departureTime}`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Simulation paused · no commands sent to operational systems
              {applied.depotName !== depotName
                ? ` · record belongs to ${applied.depotName}`
                : ""}
            </p>
          </div>
          <button
            className="bg-slate-800 rounded-lg px-3 py-2 text-sm text-blue-300"
            onClick={() => {
              useAppStore.setState({
                selectedDepotId: app.schedule.find(
                  (d) => d.id === applied.dutyId,
                )!.depotId,
              });
              app.setCurrentView("map");
            }}
          >
            Show affected buses on map
          </button>
        </section>
      )}
      <details className="glass-card p-4 text-xs text-slate-300">
        <summary className="cursor-pointer text-sm font-medium">
          Evidence and decision record ({history.length})
        </summary>
        <p className="mt-3">
          Next-departure delay = max(0, inbound delay + protected turnaround −
          layover). Headway hold = half the gap difference, rounded up to whole
          minutes, capped by relief feasibility. Waiting demand is context, not
          a claimed passenger benefit. A hold adds on-board passenger-minutes.
          No automatic cancellation or short-turn is modelled.
        </p>
        <p className="mt-2">
          Reset restores the same 19 October 05:30 clock, fleet, duties,
          chargers, alerts and decision history. State is held in this browser
          session only.
        </p>
        {history.map((record) => (
          <div className="border-t border-slate-700 mt-3 pt-3" key={record.id}>
            <p className="text-white">
              #{record.id} · {record.depotName} · {record.ruleId} ·{" "}
              {record.option.title}
            </p>
            <p>{record.reason}</p>
            <p>
              {record.overrideReason &&
                `Controller alternative: ${record.overrideReason}`}
            </p>
            <p>Inputs: {JSON.stringify(record.inputs)}</p>
            {record.handoffs.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        ))}
      </details>
      <PublicContext />
    </div>
  );
}
