/**
 * The one animation loop.
 *
 * Scroll events do nothing but record a target. A single rAF pass smooths that
 * target, derives the timeline state from it, writes a small set of custom
 * properties and nudges the film's `currentTime`. React is told only when
 * something discrete changes.
 *
 * Those properties are written onto the narrowest element that needs each one,
 * never onto the stage. Custom properties inherit, so a value written at the top
 * marks the entire subtree for style recalculation every frame - with six
 * diagrams mounted that was measured at 71% of all main-thread work on a
 * throttled phone. Split by surface, each write invalidates only its own branch.
 */
import { STATIONS, VIDEO, frameToTime } from './stations';
import { TOTAL_SCROLL_SCREENS, clamp01, describe } from './timeline';
import {
  fitStage,
  filmToStage,
  layoutFor,
  requiredSpan,
  type BoardRequest,
  type LayoutMode,
  type StageFit,
} from './stage';
import type { Progress, StationId, TimelineState, VideoPoint } from './types';

/** Exponential smoothing time constant, in seconds. */
const TAU_POINTER = 0.105;
const TAU_TOUCH = 0.075;
/** Below this the film is left alone; half a frame is imperceptible. */
const SEEK_EPSILON = 1 / (VIDEO.fps * 2);
/** Above this a coarse keyframe seek is preferred where the browser offers one. */
const FAST_SEEK_DELTA = 0.45;
/** Focus point pan is eased separately so re-framing never feels attached to the scroll. */
const TAU_FOCUS = 0.28;
/** How quickly the exhibit field opens and closes, in seconds. */
const TAU_BOARD = 0.22;

/**
 * The elements the loop writes to. Each component binds its own root, so a
 * value only ever reaches the branch that reads it.
 */
export type Surface = 'film' | 'stations' | 'overture' | 'coda' | 'index' | 'ledger' | 'notes';

export interface DiscreteState {
  readonly stationId: StationId | null;
  readonly phaseKind: TimelineState['phase']['kind'];
  readonly phaseIndex: number;
  readonly mode: LayoutMode;
  readonly atStart: boolean;
  readonly atEnd: boolean;
}

type FrameListener = (state: TimelineState, fit: StageFit) => void;

const DEFAULT_FOCUS: VideoPoint = { x: 0.5, y: 0.36 };

export class ExperienceEngine {
  private readonly stage: HTMLElement;
  private readonly video: HTMLVideoElement;

  private target: Progress = 0;
  private rendered: Progress = 0;
  private velocity = 0;
  private lastTime = 0;
  private raf = 0;
  private running = false;

  private focus: VideoPoint = DEFAULT_FOCUS;
  private boardPresence = 0;
  private board: Omit<BoardRequest, 'presence'> | null = null;
  private box = { width: 0, height: 0 };
  private fit: StageFit;

  private discrete: DiscreteState;
  private readonly discreteListeners = new Set<(s: DiscreteState) => void>();
  private readonly frameListeners = new Set<FrameListener>();

  private readonly surfaces = new Map<Surface, HTMLElement>();
  private stationsWereLive = false;

  private reducedMotion = false;
  private touchInput = false;
  private supportsFastSeek: boolean;

  constructor(stage: HTMLElement, video: HTMLVideoElement) {
    this.stage = stage;
    this.video = video;
    this.supportsFastSeek = typeof video.fastSeek === 'function';
    this.fit = fitStage({ width: 0, height: 0 }, DEFAULT_FOCUS, null);
    this.discrete = {
      stationId: null,
      phaseKind: 'intro',
      phaseIndex: 0,
      mode: 'side',
      atStart: true,
      atEnd: false,
    };
  }

  // --- lifecycle -----------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.measure();
    this.readScroll();
    this.rendered = this.target;
    this.publish({ ...this.discrete, mode: layoutFor(this.box) });
    this.raf = requestAnimationFrame(this.tick);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('touchstart', this.onTouch, { passive: true });
    window.visualViewport?.addEventListener('resize', this.onResize);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('touchstart', this.onTouch);
    window.visualViewport?.removeEventListener('resize', this.onResize);
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  // --- subscriptions -------------------------------------------------------

  subscribe = (listener: (s: DiscreteState) => void): (() => void) => {
    this.discreteListeners.add(listener);
    return () => this.discreteListeners.delete(listener);
  };

  getDiscrete = (): DiscreteState => this.discrete;

  /** Per-frame consumers. Keep the work here imperative and tiny. */
  onFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
  }

  /**
   * Register an element as the destination for its group of properties.
   * Values that were already written are re-sent on the next frame, so a
   * surface that mounts late is never left with stale geometry.
   */
  bindSurface(name: Surface, element: HTMLElement): () => void {
    this.surfaces.set(name, element);
    for (const key of [...this.sticky.keys()]) {
      if (key.startsWith(`${name}:`)) this.sticky.delete(key);
    }
    this.updateSettledGeometry(this.discrete.stationId);
    return () => {
      if (this.surfaces.get(name) === element) this.surfaces.delete(name);
    };
  }

  // --- navigation ----------------------------------------------------------

  scrollLength(): number {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  goTo(progress: Progress, behavior: ScrollBehavior = 'smooth'): void {
    const top = clamp01(progress) * this.scrollLength();
    window.scrollTo({ top, behavior: this.reducedMotion ? 'auto' : behavior });
  }

  // --- input ---------------------------------------------------------------

  private onScroll = (): void => {
    this.readScroll();
  };

  private onTouch = (): void => {
    this.touchInput = true;
  };

  private onResize = (): void => {
    this.measure();
    this.readScroll();
  };

  private readScroll(): void {
    this.target = clamp01(window.scrollY / this.scrollLength());
  }

  private measure(): void {
    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    if (width === this.box.width && height === this.box.height) return;
    this.box = { width, height };
    this.updateSettledGeometry(this.discrete.stationId);
    const mode = layoutFor(this.box);
    if (mode !== this.discrete.mode) this.publish({ ...this.discrete, mode });
  }

  /**
   * Where the pointing hand lands once the re-framing has settled. The
   * explanation is sized against this, so its width is derived from the film
   * rather than from a breakpoint - and because it only changes on resize or
   * when the station changes, sizing it costs no layout during the scroll.
   */
  private updateSettledGeometry(stationId: StationId | null): void {
    const station = stationId ? STATION_FOCUS.get(stationId) : undefined;
    if (!station || this.box.width === 0) return;
    const request = STATION_BOARD.get(stationId ?? '');
    const settled = fitStage(this.box, station, request ? { ...request, presence: 1 } : null);
    // The board is laid out once at its settled width and then only slides, so
    // opening it costs a transform rather than a re-layout of the diagram.
    this.setSticky('--board-settled', `${String(Math.round(settled.boardSize))}px`, ['stations']);
  }

  // --- the loop ------------------------------------------------------------

  private tick = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
    this.lastTime = now;

    const tau = this.reducedMotion ? 0.001 : this.touchInput ? TAU_TOUCH : TAU_POINTER;
    const alpha = 1 - Math.exp(-dt / tau);
    const previous = this.rendered;
    const delta = this.target - this.rendered;
    this.rendered = Math.abs(delta) < 1e-5 ? this.target : this.rendered + delta * alpha;
    this.velocity = this.velocity + ((this.rendered - previous) / dt - this.velocity) * Math.min(1, dt / 0.12);

    const state = describe(this.rendered, this.reducedMotion, this.velocity);

    // Re-frame towards the station's focus point, on its own slower easing.
    const nextFocus = this.focusFor(state);
    const fAlpha = 1 - Math.exp(-dt / TAU_FOCUS);
    this.focus = {
      x: this.focus.x + (nextFocus.x - this.focus.x) * fAlpha,
      y: this.focus.y + (nextFocus.y - this.focus.y) * fAlpha,
    };

    // The field opens on its own easing so it never feels welded to the wheel.
    const request = state.stationId ? (STATION_BOARD.get(state.stationId) ?? null) : null;
    if (request) this.board = request;
    const wantedPresence = request ? this.boardTarget(state) : 0;
    const bAlpha = 1 - Math.exp(-dt / TAU_BOARD);
    this.boardPresence += (wantedPresence - this.boardPresence) * bAlpha;
    if (this.boardPresence < 0.001) this.boardPresence = 0;

    this.measure();
    this.fit = fitStage(
      this.box,
      this.focus,
      this.board && this.boardPresence > 0 ? { ...this.board, presence: this.boardPresence } : null,
    );

    this.writeStyles(state);
    this.seek(state.videoTime);
    this.publishDiscrete(state);

    for (const listener of this.frameListeners) listener(state, this.fit);

    if (this.running) this.raf = requestAnimationFrame(this.tick);
  };

  /** Trapezoid matching the board's own presence curve in CSS. */
  private boardTarget(state: TimelineState): number {
    const sp = state.stationProgress;
    const rise = Math.min(1, Math.max(0, sp / 0.11));
    const fall = Math.min(1, Math.max(0, (1 - sp) / 0.12));
    return rise * fall;
  }

  private focusFor(state: TimelineState): VideoPoint {
    const station = state.stationId;
    if (!station) return DEFAULT_FOCUS;
    return STATION_FOCUS.get(station) ?? DEFAULT_FOCUS;
  }

  /** Values whose change would cost layout are written only when they move. */
  private readonly sticky = new Map<string, string>();

  /** Write to every surface that reads this property. */
  private write(prop: string, value: string, targets: readonly Surface[]): void {
    for (const name of targets) this.surfaces.get(name)?.style.setProperty(prop, value);
  }

  /** As `write`, but skips the DOM entirely while the value is unchanged. */
  private setSticky(prop: string, value: string, targets: readonly Surface[]): void {
    for (const name of targets) {
      const key = `${name}:${prop}`;
      if (this.sticky.get(key) === value) continue;
      const element = this.surfaces.get(name);
      if (!element) continue;
      this.sticky.set(key, value);
      element.style.setProperty(prop, value);
    }
  }

  private writeStyles(state: TimelineState): void {
    this.write('--progress', state.progress.toFixed(5), ['index']);
    this.write('--intro', state.introPresence.toFixed(4), ['overture', 'index']);
    this.write('--outro', state.outroPresence.toFixed(4), ['coda']);

    this.write('--film-x', `${(Math.round(this.fit.originX * 20) / 20).toFixed(2)}px`, ['film']);
    this.write('--film-y', `${(Math.round(this.fit.originY * 20) / 20).toFixed(2)}px`, ['film']);
    this.setSticky('--film-w', `${String(Math.round(VIDEO.width * this.fit.scale))}px`, ['film']);
    this.setSticky('--film-h', `${String(Math.round(VIDEO.height * this.fit.scale))}px`, ['film']);
    this.setSticky('--film-box-h', `${String(Math.round(this.fit.filmHeight))}px`, [
      'film',
      'stations',
      'overture',
      'coda',
      'ledger',
    ]);

    // Only the station branch reads these, and only while a card is on its way
    // in, up, or on its way out. Keeping them off the stage is what stops six
    // mounted diagrams from restyling on every frame of a transit; the trailing
    // write is what leaves the last one properly closed rather than a hair open.
    const stationsLive = state.stationId !== null || this.boardPresence > 0;
    if (stationsLive || this.stationsWereLive) {
      this.write('--station-progress', state.stationProgress.toFixed(4), ['stations']);
      this.write('--board-presence', this.boardPresence.toFixed(4), ['stations']);
      const hand = state.stationId ? STATION_HAND.get(state.stationId) : undefined;
      if (hand) {
        const p = filmToStage(this.fit, hand);
        this.write('--hand-x', `${String(Math.round(p.x))}px`, ['stations']);
        this.write('--hand-y', `${String(Math.round(p.y))}px`, ['stations']);
      }
    }
    this.stationsWereLive = stationsLive;

    // Where the card is, so the index and the notes control stay clear of it.
    const horizontal = this.fit.mode === 'side' ? this.fit.boardSize : 0;
    const onLeft = this.board?.side === 'left';
    this.setSticky('--board-right', `${String(Math.round(onLeft ? 0 : horizontal))}px`, ['notes']);
    this.setSticky(
      '--board-shift',
      `${String(Math.round((onLeft ? horizontal : -horizontal) / 2))}px`,
      ['index'],
    );
  }

  private seek(time: number): void {
    const video = this.video;
    if (video.readyState < 1) return;
    const target = Math.min(time, frameToTime(VIDEO.lastFrame));
    const delta = target - video.currentTime;
    if (Math.abs(delta) < SEEK_EPSILON) return;
    if (this.supportsFastSeek && Math.abs(delta) > FAST_SEEK_DELTA) {
      video.fastSeek(target);
      return;
    }
    video.currentTime = target;
  }

  private publishDiscrete(state: TimelineState): void {
    const next: DiscreteState = {
      stationId: state.stationId,
      phaseKind: state.phase.kind,
      phaseIndex: state.phase.index,
      mode: this.fit.mode,
      atStart: state.progress < 0.002,
      atEnd: state.progress > 0.998,
    };
    const prev = this.discrete;
    if (
      prev.stationId === next.stationId &&
      prev.phaseKind === next.phaseKind &&
      prev.phaseIndex === next.phaseIndex &&
      prev.mode === next.mode &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd
    ) {
      return;
    }
    if (next.stationId !== prev.stationId) this.updateSettledGeometry(next.stationId);
    this.publish(next);
  }

  private publish(next: DiscreteState): void {
    this.discrete = next;
    const data = this.stage.dataset;
    data.mode = next.mode;
    data.phase = next.phaseKind;
    data.station = next.stationId ?? '';
    for (const listener of this.discreteListeners) listener(next);
  }
}

/** Lookups built once so the loop never searches. */
const STATION_FOCUS: ReadonlyMap<StationId, VideoPoint> = new Map(STATIONS.map((s) => [s.id, s.focus]));
const STATION_HAND: ReadonlyMap<StationId, VideoPoint> = new Map(STATIONS.map((s) => [s.id, s.hand]));

/** How much of the frame each station has to keep, and which side it opens on. */
const STATION_BOARD: ReadonlyMap<string, Omit<BoardRequest, 'presence'>> = new Map(
  STATIONS.map((s) => [
    s.id,
    { side: s.side, hand: s.hand, span: requiredSpan(s.figure.x0, s.figure.x1, s.hand.x) },
  ]),
);

export { TOTAL_SCROLL_SCREENS };
