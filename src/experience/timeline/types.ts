/** Shared vocabulary for the scroll timeline. Nothing here renders. */

/** A normalised 0..1 position along the whole experience. */
export type Progress = number;

/** A point in the source video's normalised coordinate space (0..1 on each axis). */
export interface VideoPoint {
  readonly x: number;
  readonly y: number;
}

/** A rectangle in the source video's normalised coordinate space. */
export interface VideoRect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export type Gesture =
  | 'point-left'
  | 'point-right'
  | 'present-left'
  | 'present-right'
  | 'look-left'
  | 'neutral';

export type Side = 'left' | 'right';

export type StationId = 'prime' | 'sieve' | 'infinity' | 'ulam' | 'factors' | 'cryptography';

export interface StationNote {
  readonly kind: 'note' | 'open-problem';
  readonly text: string;
}

export interface Station {
  readonly id: StationId;
  /** 1-based index shown in the interface. */
  readonly index: number;
  readonly label: string;
  readonly title: string;
  /** One-line core statement. */
  readonly statement: string;
  /**
   * Optional single curiosity. The label is part of the data because it carries
   * meaning: an open problem must never be presented as a settled result.
   */
  readonly note?: StationNote;
  /** Concise textual equivalent of the diagram, for assistive technology. */
  readonly diagramSummary: string;
  readonly gesture: Gesture;
  /** Which half of the frame the explanation occupies. */
  readonly side: Side;
  /**
   * What the explanation is made of. `paper` is a torn-edge sheet laid against
   * the corridor; `slate` is a rigid blackboard plate, used for the one station
   * the professor turns his head towards rather than points at.
   */
  readonly surface: 'paper' | 'slate';
  /**
   * Where the gesture lands at the anchor frame - a fingertip, an open palm, or
   * for a head turn the point the gaze falls on. Measured from the footage.
   * The explanation is laid out beyond this point, never across it.
   */
  readonly hand: VideoPoint;
  /** The professor's silhouette at the anchor frame - a keep-out region. */
  readonly figure: VideoRect;
  /** Video point that must stay comfortably inside the stage at this station. */
  readonly focus: VideoPoint;
  /** Frame the composition is built around; the hold advances slowly through it. */
  readonly anchorFrame: number;
}

export type PhaseKind = 'intro' | 'transit' | 'station' | 'outro';

export interface Phase {
  readonly kind: PhaseKind;
  /** Present only for `kind === 'station'`. */
  readonly stationId?: StationId;
  /** Inclusive first video frame of the phase. */
  readonly fromFrame: number;
  /** Inclusive last video frame of the phase. */
  readonly toFrame: number;
  /** Scroll length in viewport heights. */
  readonly scroll: number;
}

/** A phase with its resolved position along the 0..1 scroll range. */
export interface ResolvedPhase extends Phase {
  readonly index: number;
  readonly start: Progress;
  readonly end: Progress;
}

export interface TimelineState {
  /** Smoothed 0..1 position along the experience. */
  readonly progress: Progress;
  /** Video time in seconds, derived from `progress`. */
  readonly videoTime: number;
  readonly phase: ResolvedPhase;
  /** 0..1 within the current phase. */
  readonly phaseProgress: number;
  /** The station being read, or null between stations. */
  readonly stationId: StationId | null;
  /** 0..1 within the active station, or 0 when none is active. */
  readonly stationProgress: number;
  /** How far the intro title has cleared: 1 while the intro is fully present. */
  readonly introPresence: number;
  /** How far the closing composition has arrived. */
  readonly outroPresence: number;
  /** Signed scroll velocity in progress units per second, lightly smoothed. */
  readonly velocity: number;
}
