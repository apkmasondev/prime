/**
 * The single source of truth for "where are we".
 *
 * Scroll position maps to a normalised progress, progress maps piecewise to a
 * video frame, and every visible thing is derived from that - never from
 * "this animation has already played" flags. Scrolling backwards therefore
 * unwinds the experience exactly.
 */
import { PHASES, VIDEO, frameToTime } from './stations';
import type { Progress, ResolvedPhase, StationId, TimelineState } from './types';

export const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 below `from`, 1 above `to`, linear between. Safe when `from === to`. */
export const range = (v: number, from: number, to: number): number =>
  to === from ? (v >= to ? 1 : 0) : clamp01((v - from) / (to - from));

/** Smoothstep, for entrances that should not start or stop abruptly. */
export const ease = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

export const TOTAL_SCROLL_SCREENS = PHASES.reduce((sum, p) => sum + p.scroll, 0);

export const RESOLVED_PHASES: readonly ResolvedPhase[] = (() => {
  let acc = 0;
  return PHASES.map((phase, index) => {
    const start = acc / TOTAL_SCROLL_SCREENS;
    acc += phase.scroll;
    return { ...phase, index, start, end: acc / TOTAL_SCROLL_SCREENS };
  });
})();

const requirePhase = (phase: ResolvedPhase | undefined): ResolvedPhase => {
  if (!phase) throw new Error('the phase table must not be empty');
  return phase;
};

const FIRST_PHASE = requirePhase(RESOLVED_PHASES[0]);
const LAST_PHASE = requirePhase(RESOLVED_PHASES.at(-1));

export const STATION_PROGRESS: ReadonlyMap<StationId, number> = new Map(
  RESOLVED_PHASES.flatMap((p) =>
    p.kind === 'station' && p.stationId ? ([[p.stationId, (p.start + p.end) / 2]] as const) : [],
  ),
);

export function phaseAt(progress: Progress): ResolvedPhase {
  const p = clamp01(progress);
  // Few enough phases that a linear scan is cheaper than the branch of a search.
  for (const phase of RESOLVED_PHASES) {
    if (p < phase.end) return phase;
  }
  return LAST_PHASE;
}

/** Video frame for a progress value, interpolated inside the containing phase. */
export function frameAt(progress: Progress): number {
  const phase = phaseAt(progress);
  const t = range(clamp01(progress), phase.start, phase.end);
  return lerp(phase.fromFrame, phase.toFrame, t);
}

/**
 * Reduced motion gets the same journey without the scrub: the film settles on
 * the frame each phase is composed around and steps between them.
 */
export function steadyFrameAt(progress: Progress): number {
  const phase = phaseAt(progress);
  return phase.kind === 'transit'
    ? lerp(phase.fromFrame, phase.toFrame, range(clamp01(progress), phase.start, phase.end))
    : (phase.fromFrame + phase.toFrame) / 2;
}

export function progressForStation(id: StationId): Progress {
  return STATION_PROGRESS.get(id) ?? 0;
}

export function describe(progress: Progress, reducedMotion: boolean, velocity: number): TimelineState {
  const p = clamp01(progress);
  const phase = phaseAt(p);
  const phaseProgress = range(p, phase.start, phase.end);
  const frame = reducedMotion ? steadyFrameAt(p) : frameAt(p);

  return {
    progress: p,
    videoTime: Math.min(frameToTime(frame), frameToTime(VIDEO.lastFrame)),
    phase,
    phaseProgress,
    stationId: phase.kind === 'station' ? (phase.stationId ?? null) : null,
    stationProgress: phase.kind === 'station' ? phaseProgress : 0,
    // The title clears over the first three quarters of the intro.
    introPresence: 1 - ease(range(p, FIRST_PHASE.start, FIRST_PHASE.start + (FIRST_PHASE.end - FIRST_PHASE.start) * 0.72)),
    outroPresence: ease(range(p, LAST_PHASE.start + (LAST_PHASE.end - LAST_PHASE.start) * 0.08, LAST_PHASE.start + (LAST_PHASE.end - LAST_PHASE.start) * 0.55)),
    velocity,
  };
}
