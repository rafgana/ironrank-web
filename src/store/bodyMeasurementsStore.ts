import { create } from "zustand";
import { db } from "../db/database";
import type { BodyMeasurement } from "../models/types";

interface BodyMeasurementsState {
  measurements: BodyMeasurement[];
  loading: boolean;
  loadMeasurements: () => Promise<void>;
  addMeasurement: (m: Omit<BodyMeasurement, "id">) => Promise<number>;
  deleteMeasurement: (id: number) => Promise<void>;
  getLatest: () => BodyMeasurement | null;
}

export const useBodyMeasurementsStore = create<BodyMeasurementsState>((set, get) => ({
  measurements: [],
  loading: false,

  loadMeasurements: async () => {
    set({ loading: true });
    const items = await db.bodyMeasurements.orderBy("date").reverse().toArray();
    set({ measurements: items, loading: false });
  },

  addMeasurement: async (m) => {
    const id = await db.bodyMeasurements.add(m);
    await get().loadMeasurements();
    return id;
  },

  deleteMeasurement: async (id) => {
    await db.bodyMeasurements.delete(id);
    await get().loadMeasurements();
  },

  getLatest: () => {
    const { measurements } = get();
    return measurements[0] ?? null;
  },
}));
