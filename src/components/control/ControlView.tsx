import { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppStore } from '../../stores/useAppStore';
import { useControlStore } from '../../stores/useControlStore';
import { controlExamples, evaluateControl } from '../../services/serviceControl';
import type { ControlOptionId } from '../../services/serviceControl';

export function ControlView() {
  const { depots, selectedDepotId, setCurrentView } = useAppStore();
  const depotName = depots.find(depot => depot.id === selectedDepotId)?.name ?? 'Belfast depot';
  const { inputs, exampleId, setExample, updateInputs, approve, reset, applied, history } = useControlStore();
  const evaluation = evaluateControl(inputs);
  const [selected, setSelected] = useState<ControlOptionId | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState('');
  const selectedId = applied?.option.id ?? selected ?? evaluation.recommendedId;
  const selectedOption = evaluation.options.find(option => option.id === selectedId)!;
  const isOverride = selectedId !== evaluation.recommendedId;
  const canApprove = !applied && evaluation.adviceReady && selectedOption.available && (!isOverride || overrideReason.trim().length > 0);
  const clearChoice = () => { setSelected(null); setOverrideReason(''); setError(''); };
  const displayedPlan = applied?.depotName === depotName ? applied : null;
  const caseDepotName = applied?.depotName ?? depotName;

  return (
    <div className="max-w-[1500px] mx-auto space-y-4 pb-6">
      <section className="glass-card p-5 border-blue-500/30">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <span className="text-xs uppercase tracking-wider text-blue-300">Belfast workshop · controller decision support</span>
          <span className="text-xs text-slate-400">Illustrative inputs · no live systems connected</span>
        </div>
        <h2 className="text-2xl font-semibold text-white">A bus is {inputs.lateness} minutes late. Does it need an intervention?</h2>
        <p className="text-sm text-slate-300 mt-2 max-w-4xl">Bring the relevant information into one view, apply the same operational rule, compare alternatives and keep the controller in charge.</p>
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-300">
          {['AVL + timetable + layover', 'Consistent decision rule', 'Options and trade-offs', 'Controller approval', 'Simulated system hand-offs'].map((step, index) => (
            <span key={step} className="flex items-center gap-2"><span className="bg-slate-800 px-3 py-2 rounded-lg">{step}</span>{index < 4 && <ArrowRight className="w-3 h-3 text-blue-400" />}</span>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(controlExamples).map(([id, example]) => (
          <button key={id} onClick={() => { setExample(id as keyof typeof controlExamples); clearChoice(); }} className={clsx('px-4 py-2 rounded-lg text-sm border', exampleId === id ? 'bg-blue-500/20 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-300')}>{example.label}</button>
        ))}
        <button onClick={() => { reset(); clearChoice(); }} className="ml-auto flex gap-2 items-center px-3 py-2 text-sm text-slate-300"><RotateCcw className="w-4 h-4" />Reset example</button>
      </div>

      <div className="grid xl:grid-cols-[1fr_1.35fr] gap-4">
        <section className="glass-card p-5 space-y-4">
          <div><h3 className="font-semibold text-white">One operational picture</h3><p className="text-xs text-slate-400 mt-1">{caseDepotName} · next outbound departure at 06:30</p></div>
          <div className="grid grid-cols-3 gap-3">
            {([
              ['lateness', 'Inbound delay', 0], ['plannedLayover', 'Planned layover', 0], ['minimumTurnaround', 'Minimum turnaround', 1],
            ] as const).map(([field, label, min]) => (
              <label key={field} className="text-xs text-slate-300">{label}
                <div className="flex items-center gap-1 mt-2"><input aria-label={`${label} minutes`} type="number" min={min} max={60} value={inputs[field]} disabled={Boolean(applied)} onChange={event => { updateInputs({ [field]: Math.max(min, Math.min(60, Number(event.target.value) || min)) }); clearChoice(); }} className="w-full min-w-0 bg-slate-800 border border-slate-600 rounded-lg p-2 text-lg text-white disabled:opacity-60" /><span className="text-slate-500">min</span></div>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-400">Turnaround is a workshop assumption, not a validated Translink rule. Confirm crew, relief, passenger and vehicle constraints before using operationally.</p>
          <div className="divide-y divide-slate-700 text-sm">
            {[
              ['AVL / running status', `${inputs.lateness} minutes late`, 'Position and running-time evidence'],
              ['Timetable / next duty', '06:30 departure', 'Duty link visible in the same view'],
              ['Layover / turnaround', `${evaluation.recoveryAllowance} minutes recoverable`, `${inputs.plannedLayover} planned − ${inputs.minimumTurnaround} protected`],
              ['Fleet / reserve readiness', inputs.reserveAvailable ? 'Ready reserve confirmed' : 'No reserve confirmed', 'Example assumes ready at departure point with crew'],
            ].map(([source, value, detail]) => <div key={source} className="py-3 flex justify-between gap-4"><div><div className="text-slate-200">{source}</div><div className="text-xs text-slate-500 mt-1">{detail}</div></div><div className="text-right text-blue-200 shrink-0">{value}</div></div>)}
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <label className="flex gap-2 items-center"><input type="checkbox" checked={inputs.reserveAvailable} disabled={Boolean(applied)} onChange={event => { updateInputs({ reserveAvailable: event.target.checked }); clearChoice(); }} />Ready reserve and crew confirmed for this example</label>
            <label className="flex gap-2 items-center"><input type="checkbox" checked={inputs.dataConfirmed} disabled={Boolean(applied)} onChange={event => { updateInputs({ dataConfirmed: event.target.checked }); clearChoice(); }} />AVL and timetable inputs confirmed current</label>
          </div>
          <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
            <strong className="text-white">Transparent calculation</strong><br />
            Next-departure delay = max(0, {inputs.lateness} + {inputs.minimumTurnaround} − {inputs.plannedLayover}) = <strong>{evaluation.nextDepartureDelay} minutes</strong>.<br />
            These are modelled values; no measured punctuality benefit is claimed.
          </div>
        </section>

        <section className="glass-card p-5 space-y-4">
          <div className={clsx('rounded-lg border p-4', evaluation.adviceReady ? 'border-blue-500/40 bg-blue-500/10' : 'border-amber-500/50 bg-amber-500/10')}>
            <div className="flex items-center gap-2 text-sm font-medium text-white">{evaluation.adviceReady ? <ShieldCheck className="w-4 h-4 text-blue-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}{evaluation.adviceReady ? `Recommended · ${evaluation.ruleId}` : 'Advice held · confirm source data'}</div>
            <p className="text-sm text-slate-300 mt-2">{evaluation.adviceReady ? evaluation.reason : 'The inputs may be stale. Confirm the running position and next duty before approving an intervention.'}</p>
          </div>
          <h3 className="font-semibold text-white">Compare the controller's options</h3>
          <div className="space-y-3">
            {evaluation.options.map(option => (
              <button key={option.id} disabled={!option.available || Boolean(applied)} onClick={() => { setSelected(option.id); setError(''); }} aria-pressed={selectedId === option.id} className={clsx('w-full text-left rounded-lg border p-4 transition-colors disabled:cursor-default', selectedId === option.id ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 bg-slate-800/40', !option.available && 'opacity-50')}>
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-white">{option.title}</span>{option.id === evaluation.recommendedId && evaluation.adviceReady && <span className="text-[10px] uppercase text-blue-300 bg-blue-500/20 px-2 py-1 rounded">Recommended</span>}</div>
                <p className="text-xs text-slate-300 mt-2">{option.explanation}</p><p className="text-xs text-slate-500 mt-2">Trade-off: {option.tradeOff}</p>
              </button>
            ))}
          </div>
          {isOverride && !applied && <label className="block text-xs text-slate-300">Reason for choosing an alternative<textarea aria-label="Reason for choosing an alternative" value={overrideReason} onChange={event => setOverrideReason(event.target.value)} className="mt-2 block w-full bg-slate-800 border border-slate-600 rounded-lg p-3" placeholder="Record the operational reason for the audit trail" /></label>}
          <button disabled={!canApprove} onClick={() => { try { approve(selectedId, overrideReason, depotName); setError(''); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Unable to approve'); } }} className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg py-3 text-sm font-medium text-white">{applied ? 'Plan recorded in simulation' : 'Approve simulated plan'}</button>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          <p className="text-xs text-slate-500">The controller approves the decision. Hand-offs below are simulated acknowledgements; no commands are sent to operational systems.</p>
        </section>
      </div>

      {applied && <section aria-live="polite" className="glass-card p-5 border-emerald-500/30">
        <h3 className="font-semibold text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{applied.option.id === 'review' ? 'Review request recorded' : 'Approved plan recorded'}</h3>
        <p className="text-sm text-slate-300 mt-2">{applied.depotName}: {applied.option.title}. {applied.option.nextDepartureDelay === null ? 'Departure outcome remains unconfirmed pending controller review.' : `Modelled next-departure delay: ${applied.option.nextDepartureDelay} minutes.`}</p>
        {!displayedPlan && <p className="text-xs text-amber-300 mt-2">This record belongs to {applied.depotName}; reset the example to make a decision for {depotName}.</p>}
        <div className="grid md:grid-cols-3 gap-3 mt-4">{applied.handoffs.map(item => <div key={item} className="bg-slate-800 p-3 rounded-lg text-xs text-slate-300"><span className="text-emerald-300 block mb-1">Simulated acknowledgement</span>{item}</div>)}</div>
      </section>}

      <section className="glass-card p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-white">Decision record</h3><span className="text-xs text-slate-500">Session only · retained when switching views</span></div>
        {history.length === 0 ? <p className="text-sm text-slate-400 mt-3">Approve a plan to record the inputs, rule, controller choice and simulated hand-offs.</p> : <div className="mt-3 space-y-3">{history.map(item => <div key={item.id} className="bg-slate-800/70 rounded-lg p-3 text-xs text-slate-300"><div className="font-medium text-white">#{item.id} · {item.depotName} · {item.option.title}</div><div className="mt-1">{new Date(item.approvedAt).toLocaleTimeString('en-GB')} · Rule {item.ruleId} · delay {item.inputs.lateness} / layover {item.inputs.plannedLayover} / minimum {item.inputs.minimumTurnaround} minutes</div><p className="mt-1">{item.reason}</p>{item.overrideReason && <p className="mt-1 text-amber-200">Controller alternative: {item.overrideReason}</p>}</div>)}</div>}
      </section>
      <section className="grid md:grid-cols-[1fr_auto] gap-4 items-center p-4 border border-slate-700 rounded-xl text-sm">
        <div><h3 className="text-white font-medium">Use the workshop to validate the rule and the value</h3><p className="text-slate-400 mt-1">Compare controller decisions on the same cases; measure decision time, consistency, downstream punctuality, lost mileage and passenger impact. Baseline first, agree targets together.</p></div>
        <button onClick={() => setCurrentView('dashboard')} className="px-4 py-2 bg-slate-800 rounded-lg text-blue-300">Open depot readiness example <ArrowRight className="inline w-4 h-4" /></button>
      </section>
    </div>
  );
}
