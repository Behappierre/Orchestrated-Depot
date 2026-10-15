import { create } from 'zustand';
import { approveControlDecision, controlExamples } from '../services/serviceControl';
import type { ControlInputs, ControlOptionId } from '../services/serviceControl';

type ExampleId = keyof typeof controlExamples;
type Decision = ReturnType<typeof approveControlDecision> & { id: number; depotName: string; approvedAt: string };
const initialInputs: ControlInputs = { lateness: 15, plannedLayover: 22, minimumTurnaround: 7, reserveAvailable: true, dataConfirmed: true };

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
  exampleId: 'recovery', inputs: { ...initialInputs }, applied: null, history: [],
  setExample: (id) => set({ exampleId: id, inputs: { ...initialInputs, plannedLayover: controlExamples[id].plannedLayover }, applied: null }),
  updateInputs: (patch) => set(state => ({ inputs: { ...state.inputs, ...patch }, applied: null })),
  approve: (id, reason, depotName) => {
    const state = get();
    if (state.applied) throw new Error('This example already has an approved plan. Reset it to make another decision.');
    const decision: Decision = {
      ...approveControlDecision(state.inputs, id, reason), id: (state.history[0]?.id ?? 0) + 1,
      depotName, approvedAt: new Date().toISOString(),
    };
    set({ applied: decision, history: [decision, ...state.history].slice(0, 10) });
  },
  reset: () => set(state => ({ inputs: { ...initialInputs, plannedLayover: controlExamples[state.exampleId].plannedLayover }, applied: null })),
}));
