import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { evaluateControl } from "../src/services/serviceControl.ts";

const bundled = await build({
  stdin: {
    contents: `export { useAppStore } from './src/stores/useAppStore'; export { useControlStore } from './src/stores/useControlStore';`,
    resolveDir: fileURLToPath(new URL("..", import.meta.url)),
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
let serial = 0;
async function fresh(path = "/Translink") {
  globalThis.window = { location: { pathname: path } };
  const stores = await import(
    `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}#${++serial}`
  );
  stores.useAppStore.getState().runOrchestrationCheck();
  delete globalThis.window;
  return stores;
}
const snapshot = (store) => {
  const {
    vehicles,
    schedule,
    chargers,
    depots,
    alerts,
    simulationTime,
    simulationSpeed,
    isSimulationRunning,
    highlightedVehicleIds,
  } = store.getState();
  return {
    vehicles,
    schedule,
    chargers,
    depots,
    alerts,
    simulationTime,
    simulationSpeed,
    isSimulationRunning,
    highlightedVehicleIds,
  };
};

test("reserve approval updates one duty, both fleet assignments, map focus and immutable record", async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  control.getState().setExample("intervention");
  const original = app.getState().schedule.find((d) => d.id === "DUTY-003");
  control.getState().approve("reserve", "", app.getState().depots[0].name);
  const approved = control.getState().applied;
  const duty = app.getState().schedule.find((d) => d.id === original.id);
  assert.notEqual(duty.vehicleId, original.vehicleId);
  assert.equal(
    app.getState().vehicles.find((v) => v.id === original.vehicleId)
      .assignedDuty,
    null,
  );
  assert.equal(
    app.getState().vehicles.find((v) => v.id === duty.vehicleId).assignedDuty,
    duty.id,
  );
  assert.equal(
    app.getState().schedule.filter((d) => d.vehicleId === duty.vehicleId)
      .length,
    1,
  );
  assert.deepEqual(app.getState().highlightedVehicleIds, approved.vehicleIds);
  assert.equal(approved.departureTime, "06:30");
  assert.throws(
    () => control.getState().approve("reserve", "", approved.depotName),
    /already/,
  );
  control.getState().updateInputs({ lateness: 40 });
  assert.equal(control.getState().applied.inputs.lateness, 15);
});

test("a reserve taken after recommendation cannot be double-booked at approval", async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  control.getState().setExample("intervention");
  app.setState({
    vehicles: app
      .getState()
      .vehicles.map((v) =>
        v.assignedDuty ? v : { ...v, assignedDuty: "OTHER-DUTY" },
      ),
  });
  const before = snapshot(app);
  assert.throws(
    () =>
      control.getState().approve("reserve", "", app.getState().depots[0].name),
    /No eligible reserve/,
  );
  assert.deepEqual(snapshot(app), before);
  assert.equal(control.getState().history.length, 0);
});

test("all three depots have usable workshop duties and genuinely unassigned reserves", async () => {
  for (const depotId of ["central", "north", "east"]) {
    const { useAppStore: app, useControlStore: control } = await fresh();
    app.getState().setSelectedDepotId(depotId);
    control.getState().setExample("intervention");
    control
      .getState()
      .approve(
        "reserve",
        "",
        app.getState().depots.find((d) => d.id === depotId).name,
      );
    assert.equal(control.getState().applied.vehicleIds.length, 2);
    assert.ok(
      control
        .getState()
        .applied.vehicleIds.every(
          (id) =>
            app.getState().vehicles.find((v) => v.id === id).depotId ===
            depotId,
        ),
    );
  }
});

test("whole reset restores exact fixture, clock and history; reload yields same fleet", async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  control.getState().setExample("intervention");
  const baseline = snapshot(app);
  app.getState().setSimulationRunning(true);
  for (let i = 0; i < 8; i++) app.getState().tick();
  control.getState().approve("reserve", "", app.getState().depots[0].name);
  control.getState().reset();
  assert.deepEqual(snapshot(app), baseline);
  assert.deepEqual(control.getState().history, []);
  assert.equal(control.getState().applied, null);
  const other = await fresh();
  assert.deepEqual(other.useAppStore.getState().vehicles, baseline.vehicles);
});

test("headway hold accounts for relief feasibility, passenger cost and retimes actual simulated duty", async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  control.getState().setExample("headway");
  const inputs = control.getState().inputs;
  const result = evaluateControl(inputs);
  assert.equal(result.recommendedId, "hold");
  assert.equal(result.holdMinutes, 7);
  assert.match(
    result.options.find((o) => o.id === "hold").tradeOff,
    /266 passenger-minutes/,
  );
  assert.equal(
    evaluateControl({ ...inputs, reliefSlack: 6 }).recommendedId,
    "review",
  );
  assert.equal(
    evaluateControl({ ...inputs, frontGap: 10, followingGap: 10 })
      .recommendedId,
    "monitor",
  );
  control.getState().approve("hold", "", app.getState().depots[0].name);
  assert.equal(
    app.getState().schedule.find((d) => d.id === "DUTY-003").departureTime,
    "06:37",
  );
});

test("unconfirmed data and overrides fail without changing fleet; escalation leaves dispatch unchanged", async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  const before = snapshot(app);
  control.getState().updateInputs({ dataConfirmed: false });
  assert.throws(
    () =>
      control.getState().approve("monitor", "", app.getState().depots[0].name),
    /Confirm/,
  );
  assert.deepEqual(snapshot(app), before);
  control.getState().updateInputs({ dataConfirmed: true });
  assert.throws(
    () =>
      control.getState().approve("review", "", app.getState().depots[0].name),
    /reason/,
  );
  control
    .getState()
    .approve(
      "review",
      "Await local rule validation",
      app.getState().depots[0].name,
    );
  assert.deepEqual(app.getState().vehicles, before.vehicles);
  assert.deepEqual(app.getState().schedule, before.schedule);
});

test("general profile retains London and Translink cannot expose unimplemented legacy actions", async () => {
  const general = await fresh("/");
  assert.equal(general.useAppStore.getState().currentView, "dashboard");
  assert.equal(general.useAppStore.getState().depots[0].name, "Central Depot");
  assert.ok(
    general.useAppStore
      .getState()
      .vehicles.every((v) => v.lat > 51 && v.lat < 52),
  );
  const translink = await fresh();
  assert.ok(
    translink.useAppStore
      .getState()
      .alerts.every((a) => !a.proposedActions.length),
  );
});

test('passed departures and changed depots cannot silently approve a stale plan', async () => {
  const { useAppStore: app, useControlStore: control } = await fresh();
  const depotName = app.getState().depots[0].name;
  app.getState().setSimulationTime(new Date(2026, 9, 19, 6, 31));
  const before = snapshot(app);
  assert.throws(() => control.getState().approve('monitor', '', depotName), /departure has passed/);
  assert.deepEqual(snapshot(app), before);
  control.getState().reset();
  app.getState().setSelectedDepotId('north');
  assert.throws(() => control.getState().approve('monitor', '', depotName), /depot changed/);
  assert.equal(control.getState().history.length, 0);
});

test('general depot swaps reject later-assigned vehicles and recheck candidates at execution', async () => {
  const { useAppStore: app } = await fresh('/');
  const alert = app.getState().alerts.find(a => a.vehicleId === 'BUS-101' && a.proposedActions.some(p => p.type === 'swap'));
  assert.ok(alert);
  assert.ok(alert.proposedActions.every(action => action.targetVehicleId !== 'BUS-102'));
  const action = alert.proposedActions.find(p => p.type === 'swap');
  app.getState().updateVehicle(action.targetVehicleId, { assignedDuty: 'NOW-OCCUPIED' });
  const schedule = app.getState().schedule;
  app.getState().resolveAlert(alert.id, action.id);
  assert.deepEqual(app.getState().schedule, schedule);
});

test("public map data has source dates, attribution, unique stop IDs and valid Belfast geometry", () => {
  const data = JSON.parse(
    readFileSync(new URL("../src/data/publicContext.json", import.meta.url)),
  );
  assert.equal(data.metadata.routeSnapshotDate, "2025-09-23");
  assert.equal(data.metadata.stopCatalogueDate, "2026-10-02");
  assert.match(data.metadata.attribution, /Translink/);
  assert.equal(new Set(data.stops.map((s) => s.id)).size, data.stops.length);
  assert.ok(data.stops.length > 100);
  assert.ok(
    data.routes.every(
      (r) =>
        r.segments.length > 0 &&
        r.segments.every((segment) =>
          segment.every(
            ([lat, lng]) => lat > 54 && lat < 55 && lng > -7 && lng < -5,
          ),
        ),
    ),
  );
});
