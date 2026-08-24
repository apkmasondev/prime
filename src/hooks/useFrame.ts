import { useEffect, useRef } from 'react';
import { useEngine } from '../experience/ExperienceContext';
import type { StageFit } from '../experience/timeline/stage';
import type { TimelineState } from '../experience/timeline/types';

export type FrameHandler = (state: TimelineState, fit: StageFit) => void;

/**
 * Runs `handler` inside the shared animation loop. The handler is held in a ref
 * so it can close over fresh values without re-subscribing every render, and
 * nothing here ever calls `setState`.
 */
export function useFrame(handler: FrameHandler, enabled = true): void {
  const engine = useEngine();
  const ref = useRef(handler);
  // Assigned after commit rather than during render, so the loop always calls
  // the latest closure without the subscription churning every render.
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    return engine.onFrame((state, fit) => { ref.current(state, fit); });
  }, [engine, enabled]);
}

/**
 * Calls `onChange` only when an integer derived from station progress moves.
 * Diagram internals step; they do not need a value sixty times a second.
 */
export function useSteppedProgress(
  enabled: boolean,
  steps: number,
  onChange: (step: number, exact: number) => void,
): void {
  const last = useRef(-1);
  useFrame((state) => {
    const exact = state.stationProgress * steps;
    const step = Math.round(exact);
    if (step === last.current) return;
    last.current = step;
    onChange(step, exact);
  }, enabled);

  useEffect(() => {
    if (!enabled) last.current = -1;
  }, [enabled]);
}
