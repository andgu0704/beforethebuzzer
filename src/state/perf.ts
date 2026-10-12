import { create } from 'zustand';

/** Timings the performance overlay shows (God Mode builds only). */
export interface Perf {
  overlay: boolean;
  /** Milliseconds the last engine call took (a week, a decision). */
  lastEngineMs: number;
  /** Milliseconds the last save took, serialising and writing. */
  lastSaveMs: number;
}

export const usePerf = create<Perf>()(() => ({ overlay: false, lastEngineMs: 0, lastSaveMs: 0 }));

export function timed<T>(key: 'lastEngineMs' | 'lastSaveMs', fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    usePerf.setState({ [key]: performance.now() - start });
  }
}
