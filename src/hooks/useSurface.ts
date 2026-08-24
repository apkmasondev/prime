import { useLayoutEffect, useRef } from 'react';
import { useEngine } from '../experience/ExperienceContext';
import type { Surface } from '../experience/timeline/engine';

/**
 * Registers this component's root as the destination for the timeline
 * properties it reads. Binding narrowly is what keeps a per-frame value from
 * marking the whole stage for style recalculation.
 */
export function useSurface<T extends HTMLElement>(name: Surface): React.RefObject<T | null> {
  const engine = useEngine();
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    return engine.bindSurface(name, element);
  }, [engine, name]);

  return ref;
}
