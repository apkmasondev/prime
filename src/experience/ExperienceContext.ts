import { createContext, useContext, useSyncExternalStore } from 'react';
import type { DiscreteState, ExperienceEngine } from './timeline/engine';

export const EngineContext = createContext<ExperienceEngine | null>(null);

export function useEngine(): ExperienceEngine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error('useEngine must be used inside the experience');
  return engine;
}

/** Re-renders only when something discrete about the timeline changes. */
export function useExperienceState(): DiscreteState {
  const engine = useEngine();
  return useSyncExternalStore(engine.subscribe, engine.getDiscrete, engine.getDiscrete);
}
