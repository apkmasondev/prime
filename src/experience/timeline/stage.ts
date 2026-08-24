/**
 * How the 16:9 film is placed inside whatever box the device gives us, where
 * the exhibit board sits, and how a point measured on the film turns into a
 * point on the glass.
 *
 * The film always bleeds edge to edge and always keeps its scale, so the picture
 * never pulses in and out six times. What changes at a station is where it is
 * aimed: an exhibit card opens on the side the professor gestures towards, and
 * the frame pans so that everything worth seeing - his figure and his gesture -
 * sits in the part of the stage the card does not cover.
 *
 * The width of that card is not a breakpoint. It is whatever is left over once
 * the film has kept enough of the frame, a span measured from the footage
 * station by station.
 */
import { VIDEO } from './stations';
import type { Side, VideoPoint } from './types';

/** Below this stage aspect ratio the explanation cannot fit beside the film. */
export const STACK_ASPECT = 1.18;

export type LayoutMode = 'side' | 'stacked';

/**
 * Share of stage height given to the film when the layout stacks. Kept constant
 * rather than derived from the aspect ratio, so a collapsing mobile URL bar can
 * never make the picture jump mid-scroll. 0.44 leaves the professor reading
 * clearly while giving the sheet below him room for a real diagram.
 */
export const STACKED_FILM_SHARE = 0.44;

/** Preferred, smallest and largest widths for the exhibit field, in stage pixels. */
const BOARD_SHARE = 0.36;
const BOARD_MIN = 288;
const BOARD_MAX = 560;
/** Clear air the pan leaves between the gesture and the card's edge. */
const GESTURE_GAP = 0.035;
const GESTURE_GAP_MIN = 22;
const GESTURE_GAP_MAX = 72;

export interface StageBox {
  readonly width: number;
  readonly height: number;
}

export interface BoardRequest {
  readonly side: Side;
  /** Film-width fraction that must stay visible: the figure, the gesture, and margin. */
  readonly span: number;
  /** Where the gesture lands on the film; the pan brings it to the card's edge. */
  readonly hand: VideoPoint;
  /** 0 while the board is away, 1 once it has fully arrived. */
  readonly presence: number;
}

export interface StageFit {
  readonly mode: LayoutMode;
  /** The visible film window, in stage coordinates. */
  readonly filmLeft: number;
  readonly filmTop: number;
  readonly filmWidth: number;
  readonly filmHeight: number;
  /** Film pixels per stage pixel. Constant across a station opening. */
  readonly scale: number;
  /** Stage position of the film's (0, 0) corner - usually negative. */
  readonly originX: number;
  readonly originY: number;
  /** Stage pixels the board occupies along its axis. */
  readonly boardSize: number;
  /** Portion of the film inside the visible window, in normalised film coordinates. */
  readonly visibleX0: number;
  readonly visibleX1: number;
  readonly visibleY0: number;
  readonly visibleY1: number;
}

export const layoutFor = (box: StageBox): LayoutMode =>
  box.height > 0 && box.width / box.height < STACK_ASPECT ? 'stacked' : 'side';

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** The film-width fraction a station needs: its figure, its gesture, and margin. */
export function requiredSpan(figureX0: number, figureX1: number, handX: number, margin = 0.05): number {
  const lo = Math.min(figureX0, handX) - margin;
  const hi = Math.max(figureX1, handX) + margin;
  return clamp(hi - lo, 0, 1);
}

/**
 * @param focus  film point to bring towards the centre of the film window
 * @param board  the exhibit field, or null when the film has the whole stage
 */
export function fitStage(box: StageBox, focus: VideoPoint, board: BoardRequest | null = null): StageFit {
  const mode = layoutFor(box);

  if (mode === 'stacked') {
    // The field below the film is permanent, so the film's scale never changes.
    const filmHeight = box.height * STACKED_FILM_SHARE;
    return place(
      box,
      focus,
      {
        mode,
        filmLeft: 0,
        filmTop: 0,
        filmWidth: box.width,
        filmHeight,
        scale: Math.max(box.width / VIDEO.width, filmHeight / VIDEO.height) || 0,
        boardSize: box.height - filmHeight,
      },
      board,
    );
  }

  // Cover the whole stage; opening the board only crops the film, never rescales it.
  const scale = Math.max(box.width / VIDEO.width, box.height / VIDEO.height) || 0;
  const scaledWidth = VIDEO.width * scale;

  let boardSize = 0;
  if (board && board.presence > 0 && scaledWidth > 0) {
    const wanted = clamp(box.width * BOARD_SHARE, BOARD_MIN, BOARD_MAX);
    const affordable = box.width - board.span * scaledWidth;
    boardSize = Math.max(0, Math.min(wanted, affordable)) * clamp(board.presence, 0, 1);
  }

  return place(
    box,
    focus,
    {
      mode,
      filmLeft: board?.side === 'left' ? boardSize : 0,
      filmTop: 0,
      filmWidth: box.width - boardSize,
      filmHeight: box.height,
      scale,
      boardSize,
    },
    board,
  );
}

type Placement = Omit<StageFit, 'originX' | 'originY' | 'visibleX0' | 'visibleX1' | 'visibleY0' | 'visibleY1'>;

/**
 * With a card up, the pan is aimed so the gesture comes to rest just clear of
 * the card's inner edge - the professor points at the card rather than into it.
 * Without one, it simply centres the station's focus point.
 *
 * Either way the origin is clamped so the film still covers every part of the
 * stage the card does not: the picture slides behind the card, and no gap can
 * open at the far edge.
 */
function place(box: StageBox, focus: VideoPoint, p: Placement, board: BoardRequest | null): StageFit {
  const scaledW = VIDEO.width * p.scale;
  const scaledH = VIDEO.height * p.scale;
  const filmRight = p.filmLeft + p.filmWidth;
  const gap = clamp(box.width * GESTURE_GAP, GESTURE_GAP_MIN, GESTURE_GAP_MAX);

  const wantedX =
    board && p.mode === 'side'
      ? (board.side === 'right' ? filmRight - gap : p.filmLeft + gap) - board.hand.x * scaledW
      : p.filmLeft + p.filmWidth / 2 - focus.x * scaledW;

  const originX = clamp(wantedX, filmRight - scaledW, p.filmLeft);
  const originY = clamp(
    p.filmTop + p.filmHeight / 2 - focus.y * scaledH,
    p.filmTop + p.filmHeight - scaledH,
    p.filmTop,
  );

  return {
    ...p,
    originX,
    originY,
    visibleX0: scaledW > 0 ? (p.filmLeft - originX) / scaledW : 0,
    visibleX1: scaledW > 0 ? (p.filmLeft + p.filmWidth - originX) / scaledW : 1,
    visibleY0: scaledH > 0 ? (p.filmTop - originY) / scaledH : 0,
    visibleY1: scaledH > 0 ? (p.filmTop + p.filmHeight - originY) / scaledH : 1,
  };
}

/** Film point -> stage pixels. */
export function filmToStage(fit: StageFit, point: VideoPoint): { x: number; y: number } {
  return {
    x: fit.originX + point.x * VIDEO.width * fit.scale,
    y: fit.originY + point.y * VIDEO.height * fit.scale,
  };
}

/** True when the film point is inside the visible window, with a normalised margin. */
export function isVisible(fit: StageFit, point: VideoPoint, margin = 0): boolean {
  return (
    point.x >= fit.visibleX0 + margin &&
    point.x <= fit.visibleX1 - margin &&
    point.y >= fit.visibleY0 + margin &&
    point.y <= fit.visibleY1 - margin
  );
}
