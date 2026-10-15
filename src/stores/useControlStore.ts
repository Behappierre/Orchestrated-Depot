import { create } from "zustand";
import {
  approveControlDecision,
  controlExamples,
} from "../services/serviceControl";
import type {
  ControlInputs,
  ControlOptionId,
} from "../services/serviceControl";
import { useAppStore } from "./useAppStore";
import { workshopDuty } from "../data/workshopState";

type ExampleId = keyof typeof controlExamples;
type Decision = ReturnType<typeof approveControlDecision> & {
  id: number;
  depotName: string;
  approvedAt: string;
  vehicleIds: string[];
  dutyId: string;
  departureTime: string;
};
const initialInputs: ControlInputs = {
  lateness: 15,
  plannedLayover: 22,
  minimumTurnaround: 7,
  reserveAvailable: true,
  dataConfirmed: true,
};

interface ControlStore {
  exampleId: ExampleId;
  inputs: ControlInputs;
  applied: Decision | null;
  history: Decision[];
  setExample: (id: ExampleId) => void;
  updateInputs: (patch: Partial<ControlInputs>) => void;
  approve: (id: ControlOptionId, reason: string, depotName: string) => void;
  reset: () => void;
}

export const useControlStore = create<ControlStore>((set, get) => ({
  exampleId: "recovery",
  inputs: { ...initialInputs },
  applied: null,
  history: [],
  setExample: (id) => {
    useAppStore.getState().resetDemo();
    set({
      exampleId: id,
      inputs: {
        ...initialInputs,
        plannedLayover: controlExamples[id].plannedLayover,
        headwayCase: id === "headway",
        frontGap: 3,
        followingGap: 17,
        reliefSlack: 12,
        onBoard: 38,
        waiting: 24,
      },
      applied: null,
      history: [],
    });
  },
  updateInputs: (patch) => {
    if (!get().applied)
      set((state) => ({ inputs: { ...state.inputs, ...patch } }));
  },
  approve: (id, reason, depotName) => {
    const state = get();
    if (state.applied)
      throw new Error(
        "This example already has an approved plan. Reset it to make another decision.",
      );
    const app = useAppStore.getState();
    const duty = workshopDuty(app.schedule, app.selectedDepotId);
    const source = app.vehicles.find((v) => v.id === duty?.vehicleId);
    if (!duty || !source || duty.status !== "Scheduled")
      throw new Error(
        "The simulated duty changed. Reset the demo before approving.",
      );
    const depot = app.depots.find((d) => d.id === app.selectedDepotId);
    if (depot?.name !== depotName)
      throw new Error("The selected depot changed. Recheck the plan.");
    const reserve = app.vehicles.find(
      (v) =>
        v.depotId === duty.depotId &&
        v.id !== source.id &&
        v.status === "Idle" &&
        !v.chargerId &&
        !v.assignedDuty &&
        v.soc >= duty.requiredSoC &&
        !app.schedule.some(
          (d) =>
            d.vehicleId === v.id &&
            !["Completed", "Cancelled"].includes(d.status),
        ),
    );
    const approved = approveControlDecision(state.inputs, id, reason);
    if (id === "reserve" && !reserve)
      throw new Error(
        "No eligible reserve remains. Reset or choose controller review.",
      );
    const vehicleIds =
      id === "reserve" ? [source.id, reserve!.id] : [source.id];
    const delay = approved.option.nextDepartureDelay ?? 0;
    const [hour, minute] = duty.departureTime.split(":").map(Number);
    if (app.simulationTime.getHours() * 60 + app.simulationTime.getMinutes() > hour * 60 + minute) {
      throw new Error("The simulated departure has passed. Reset the demo before approving.");
    }
    const departureTime = `${String(Math.floor((hour * 60 + minute + delay) / 60) % 24).padStart(2, "0")}:${String((minute + delay) % 60).padStart(2, "0")}`;
    const decision: Decision = {
      ...approved,
      id: (state.history[0]?.id ?? 0) + 1,
      depotName,
      approvedAt: app.simulationTime.toISOString(),
      vehicleIds,
      dutyId: duty.id,
      departureTime,
    };
    // Validate everything above before committing either store; this synchronous
    // transaction uses the latest fleet, rather than the displayed recommendation.
    useAppStore.setState({
      highlightedVehicleIds: vehicleIds,
      isSimulationRunning: false,
      schedule: app.schedule.map((d) =>
        d.id === duty.id && id !== "review"
          ? {
              ...d,
              vehicleId: id === "reserve" ? reserve!.id : source.id,
              departureTime,
            }
          : d,
      ),
      vehicles: app.vehicles.map((v) =>
        id === "reserve" && v.id === source.id
          ? {
              ...v,
              assignedDuty: null,
              location: "Recovering · reserve covers next duty",
            }
          : id === "reserve" && v.id === reserve!.id
            ? {
                ...v,
                assignedDuty: duty.id,
                location: `Reserve held for ${duty.id}`,
                lat: source.lat + 0.00015,
                lng: source.lng + 0.00015,
              }
            : v,
      ),
    });
    set({
      applied: decision,
      history: [decision, ...state.history].slice(0, 10),
    });
    app.runOrchestrationCheck();
  },
  reset: () => get().setExample(get().exampleId),
}));
