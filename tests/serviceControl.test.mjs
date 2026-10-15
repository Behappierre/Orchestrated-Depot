import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateControl, approveControlDecision } from '../src/services/serviceControl.ts';

const recovery = { lateness: 15, plannedLayover: 22, minimumTurnaround: 7, reserveAvailable: true, dataConfirmed: true };

test('15 minutes late can recover without consuming the protected turnaround', () => {
  const result = evaluateControl(recovery);
  assert.equal(result.recommendedId, 'monitor');
  assert.equal(result.nextDepartureDelay, 0);
  assert.equal(evaluateControl({ ...recovery, lateness: 16 }).nextDepartureDelay, 1);
});

test('shorter layover changes the decision on the same delay', () => {
  const result = evaluateControl({ ...recovery, plannedLayover: 12 });
  assert.equal(result.nextDepartureDelay, 10);
  assert.equal(result.recommendedId, 'reserve');
});

test('no confirmed reserve requires review rather than inventing capacity', () => {
  const inputs = { ...recovery, plannedLayover: 12, reserveAvailable: false };
  assert.equal(evaluateControl(inputs).recommendedId, 'review');
  assert.throws(() => approveControlDecision(inputs, 'reserve', ''), /unavailable/);
  const record = approveControlDecision(inputs, 'review', '');
  assert.equal(record.option.nextDepartureDelay, null);
  assert.ok(record.handoffs.some(item => item.includes('no vehicle reassignment')));
});

test('unconfirmed source data blocks approval even with a recommended option', () => {
  assert.throws(() => approveControlDecision({ ...recovery, dataConfirmed: false }, 'monitor', ''), /Confirm the AVL/);
});

test('choosing an alternative needs an operational reason', () => {
  assert.throws(() => approveControlDecision(recovery, 'review', '  '), /Record a reason/);
  assert.equal(approveControlDecision(recovery, 'review', 'Driver relief uncertain').overrideReason, 'Driver relief uncertain');
});

test('decision record keeps the original inputs after later edits', () => {
  const inputs = { ...recovery };
  const record = approveControlDecision(inputs, 'monitor', '');
  inputs.lateness = 50;
  assert.equal(record.inputs.lateness, 15);
  assert.equal(record.option.nextDepartureDelay, 0);
});

test('invalid and missing time inputs cannot produce an apparently valid recommendation', () => {
  for (const patch of [{ lateness: NaN }, { plannedLayover: -1 }, { minimumTurnaround: 0 }, { lateness: 61 }]) {
    assert.throws(() => evaluateControl({ ...recovery, ...patch }), /valid minutes/);
  }
});

test('zero delay still exposes an infeasible planned turnaround', () => {
  const result = evaluateControl({ ...recovery, lateness: 0, plannedLayover: 5 });
  assert.equal(result.nextDepartureDelay, 2);
  assert.notEqual(result.recommendedId, 'monitor');
});
