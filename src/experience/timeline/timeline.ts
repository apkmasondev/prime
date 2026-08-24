/**
 * The single source of truth for "where are we".
 *
 * Scroll position maps to a normalised progress, progress maps piecewise to a
 * video frame, and every visible thing is derived from that - never from
 * "this animation has already played" flags. Scrolling backwards therefore
 * unwinds the experience exactly.
 */
import { PHASES, STATIONS, VIDEO, frameToTime } from './stations';
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

/**
 * How much of the film's own pace is given up at the anchor, where 0 crosses the
 * station at a constant rate and 1 would stop on the frame entirely.
 *
 * Scroll is geared to the film about four times more finely inside a station
 * than along a transit - some 38 px of scroll per source frame against 8 -
 * because a station is where the reader stops to read. At that gearing a 24 fps
 * film advances about eight frames a second under an ordinary scroll, so the
 * picture holds for an eighth of a second and then steps, and it does that
 * exactly where the reader is looking hardest at it.
 *
 * So the film eases through a station rather than creeping across it: it comes
 * nearly to rest on the frame the station is composed around, and makes the
 * distance up towards the edges, where the eye is already moving on. The walk
 * is unchanged - the anchor is still reached at the same scroll position, on
 * the same frame, and the curve is monotone, so nothing reverses.
 */
const DWELL = 0.7;

/** Monotone on [0,1]; fixes 0, 1/2 and 1, and is slowest in the middle. */
const slowMiddle = (t: number): number => t + (DWELL * Math.sin(2 * Math.PI * t)) / (2 * Math.PI);

/**
 * `slowMiddle` around an anchor that is not the middle: straighten the phase so
 * the anchor sits at 1/2, ease there, then put it back. The two straightenings
 * cancel, so the result is still monotone, still fixes both ends, and passes
 * through the anchor with the same value as before.
 */
const aroundAnchor = (t: number, anchor: number): number => {
  const straight = t <= anchor ? t / (2 * anchor) : 0.5 + (t - anchor) / (2 * (1 - anchor));
  const eased = slowMiddle(straight);
  return eased <= 0.5 ? 2 * anchor * eased : anchor + (2 * eased - 1) * (1 - anchor);
};

/**
 * Where each station's anchor falls inside its own phase. Stations whose anchor
 * sits against an edge are left to cross at a constant rate, because there is
 * no middle there to rest in.
 */
const ANCHOR_IN_PHASE: ReadonlyMap<number, number> = new Map(
  RESOLVED_PHASES.flatMap((phase) => {
    const station = STATIONS.find((s) => s.id === phase.stationId);
    const span = phase.toFrame - phase.fromFrame;
    if (phase.kind !== 'station' || !station || span <= 0) return [];
    const anchor = (station.anchorFrame - phase.fromFrame) / span;
    return anchor > 0.05 && anchor < 0.95 ? ([[phase.index, anchor]] as const) : [];
  }),
);

/** Video frame for a progress value, interpolated inside the containing phase. */
export function frameAt(progress: Progress): number {
  const phase = phaseAt(progress);
  const t = range(clamp01(progress), phase.start, phase.end);
  const anchor = ANCHOR_IN_PHASE.get(phase.index);
  return lerp(phase.fromFrame, phase.toFrame, anchor === undefined ? t : aroundAnchor(t, anchor));
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
