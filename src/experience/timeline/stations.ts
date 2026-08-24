/**
 * The walk, as measured from the finished footage.
 *
 * The three source clips join without a visible cut and were concatenated into
 * one 720-frame, 24 fps master. Every frame number below is an index into that
 * master, chosen by inspecting the film - not by reusing the numbers from the
 * prompts that generated it.
 *
 * Gestures found in the footage, in order:
 *   frames  56- 88  index finger, screen right
 *   frames 156-190  index finger, screen left
 *   frames 288-328  head turns to a full profile, looking screen left
 *   frames 406-436  index finger, screen left - the only full stop
 *   frames 548-578  open hand, screen right
 *   frames 654-684  open hand, screen left
 *   frames 690-719  stationary, arms down - the closing pose
 *
 * Station three lands on the head turn rather than on the walk that follows it,
 * because that is the moment the film offers. What he is looking at is a
 * blackboard, so that station is a slate plate rather than a paper sheet -
 * which is also what keeps three left-hand stations in a row from reading as a
 * repetition.
 */
import type { Phase, Station } from './types';

export const VIDEO = {
  src: 'media/prime-walk.mp4',
  posterWebp: 'media/poster.webp',
  posterAvif: 'media/poster.avif',
  width: 1280,
  height: 720,
  fps: 24,
  frames: 720,
  /**
   * Last frame we ever seek to. Stopping one frame short of the container
   * duration avoids the end-of-stream frame, which some decoders present as a
   * repeat or a blank.
   */
  lastFrame: 717,
} as const;

export const frameToTime = (frame: number): number => frame / VIDEO.fps;

export const STATIONS: readonly Station[] = [
  {
    id: 'prime',
    index: 1,
    label: 'Definition',
    title: 'Exactly two divisors',
    statement: 'A prime is a whole number greater than 1 that is divisible only by 1 and itself.',
    note: {
      kind: 'note',
      text: '2 is the only even prime — every other even number has 2 as a third divisor.',
    },
    diagramSummary:
      'The numbers 1 to 24. Primes are marked with a filled disc; composite numbers open into their factor pairs; 1 stands apart because it has only one divisor.',
    gesture: 'point-right',
    side: 'right',
    surface: 'paper',
    hand: { x: 0.746, y: 0.34 },
    figure: { x0: 0.355, y0: 0.09, x1: 0.565, y1: 1 },
    focus: { x: 0.58, y: 0.34 },
    anchorFrame: 72,
  },
  {
    id: 'sieve',
    index: 2,
    label: 'Sieve of Eratosthenes',
    title: 'Remove the multiples',
    statement: 'Strike out every multiple of each prime in turn. What survives is prime.',
    note: {
      kind: 'note',
      text: 'Striking can stop at 7: any composite up to 100 must have a factor no larger than 10.',
    },
    diagramSummary:
      'A grid of the numbers 1 to 100. Multiples of 2, then 3, then 5, then 7 are struck through in turn, leaving the 25 primes below 100 standing.',
    gesture: 'point-left',
    side: 'left',
    surface: 'paper',
    hand: { x: 0.324, y: 0.285 },
    figure: { x0: 0.42, y0: 0.09, x1: 0.575, y1: 1 },
    focus: { x: 0.44, y: 0.3 },
    anchorFrame: 172,
  },
  {
    id: 'infinity',
    index: 3,
    label: "Euclid's argument",
    title: 'There is no last prime',
    statement: 'Any list claiming to hold every prime can be used to build a number it missed.',
    diagramSummary:
      'Take any finite list of primes, multiply them together and add 1. The result leaves a remainder of 1 when divided by each prime on the list, so either it is prime itself or it has a prime factor the list never contained.',
    gesture: 'look-left',
    side: 'left',
    surface: 'slate',
    hand: { x: 0.38, y: 0.22 },
    figure: { x0: 0.44, y0: 0.11, x1: 0.59, y1: 1 },
    focus: { x: 0.44, y: 0.3 },
    anchorFrame: 304,
  },
  {
    id: 'ulam',
    index: 4,
    label: 'Ulam spiral',
    title: 'Irregular is not structureless',
    statement: 'Wind the whole numbers into a square spiral and the primes fall along diagonals.',
    note: {
      kind: 'open-problem',
      text: 'Nobody knows whether twin primes such as 17 and 19 go on for ever.',
    },
    diagramSummary:
      'The whole numbers spiral outward from the centre of a square lattice. Marking only the primes reveals diagonal streaks, because several quadratic sequences that run along those diagonals are unusually rich in primes.',
    gesture: 'point-left',
    side: 'left',
    surface: 'paper',
    hand: { x: 0.305, y: 0.29 },
    figure: { x0: 0.435, y0: 0.11, x1: 0.575, y1: 1 },
    focus: { x: 0.43, y: 0.32 },
    anchorFrame: 422,
  },
  {
    id: 'factors',
    index: 5,
    label: 'Fundamental theorem',
    title: 'The atoms of arithmetic',
    statement: 'Every whole number above 1 is a product of primes, in exactly one way apart from order.',
    diagramSummary:
      'A factor tree for 84. It splits into 2 and 42, then 42 into 2 and 21, then 21 into 3 and 7, leaving the prime leaves 2, 2, 3 and 7.',
    gesture: 'present-right',
    side: 'right',
    surface: 'paper',
    hand: { x: 0.715, y: 0.245 },
    figure: { x0: 0.435, y0: 0.11, x1: 0.6, y1: 1 },
    focus: { x: 0.6, y: 0.32 },
    anchorFrame: 566,
  },
  {
    id: 'cryptography',
    index: 6,
    label: 'Public-key cryptography',
    title: 'Easy to multiply, hard to undo',
    statement: 'Large primes power classic public-key systems such as RSA.',
    note: {
      kind: 'note',
      text: 'Multiplying two 300-digit primes is instant. Recovering them from the product is not.',
    },
    diagramSummary:
      'Two large primes p and q multiply into a modulus n. The product may be published; without p and q, recovering them from n by factoring is impractical at cryptographic sizes.',
    gesture: 'present-left',
    side: 'left',
    surface: 'paper',
    hand: { x: 0.365, y: 0.39 },
    figure: { x0: 0.435, y0: 0.11, x1: 0.575, y1: 1 },
    focus: { x: 0.45, y: 0.34 },
    anchorFrame: 670,
  },
];

/**
 * Scroll is allocated per phase, in viewport heights. Stations get a fixed,
 * generous allowance so the mathematics has room; the walk between them is paid
 * for at a constant rate so the professor's pace never changes character.
 */
const TRANSIT_FRAMES_PER_SCREEN = 108;
const STATION_SCROLL = 1.35;

const transitScroll = (from: number, to: number): number =>
  Math.max(0.45, Math.round(((to - from) / TRANSIT_FRAMES_PER_SCREEN) * 100) / 100);

/**
 * Station windows open a beat before the gesture reads and close a beat before
 * it releases, so the board is already standing while the professor holds the
 * pose - never arriving as he turns away from it.
 */
export const PHASES: readonly Phase[] = [
  { kind: 'intro', fromFrame: 0, toFrame: 54, scroll: 1 },
  { kind: 'station', stationId: 'prime', fromFrame: 54, toFrame: 86, scroll: STATION_SCROLL },
  { kind: 'transit', fromFrame: 86, toFrame: 154, scroll: transitScroll(86, 154) },
  { kind: 'station', stationId: 'sieve', fromFrame: 154, toFrame: 188, scroll: STATION_SCROLL },
  { kind: 'transit', fromFrame: 188, toFrame: 284, scroll: transitScroll(188, 284) },
  { kind: 'station', stationId: 'infinity', fromFrame: 284, toFrame: 326, scroll: STATION_SCROLL },
  { kind: 'transit', fromFrame: 326, toFrame: 402, scroll: transitScroll(326, 402) },
  { kind: 'station', stationId: 'ulam', fromFrame: 402, toFrame: 434, scroll: STATION_SCROLL },
  { kind: 'transit', fromFrame: 434, toFrame: 544, scroll: transitScroll(434, 544) },
  { kind: 'station', stationId: 'factors', fromFrame: 544, toFrame: 576, scroll: STATION_SCROLL },
  { kind: 'transit', fromFrame: 576, toFrame: 648, scroll: transitScroll(576, 648) },
  { kind: 'station', stationId: 'cryptography', fromFrame: 648, toFrame: 680, scroll: STATION_SCROLL },
  { kind: 'outro', fromFrame: 680, toFrame: VIDEO.lastFrame, scroll: 1.3 },
];

export const stationById = (id: string): Station | undefined => STATIONS.find((s) => s.id === id);
