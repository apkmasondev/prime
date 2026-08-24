/**
 * Deckle edges.
 *
 * The exhibit cards read as sheets of handmade paper laid against the corridor
 * rather than as browser rectangles, so the edge that meets the picture is torn.
 * The other edges run off the stage, which is what keeps the film covered right
 * out to the frame.
 *
 * The tear is generated here from a fixed seed - the same card looks the same on
 * every load and on every device - and expressed in object-bounding-box units,
 * so one path fits any card size and is never recomputed.
 */

/** Small deterministic PRNG (mulberry32), so the paper never reshuffles. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A wandering offset along one edge: a bounded random walk, lightly smoothed,
 * so the result is fibrous rather than saw-toothed.
 */
function tear(random: () => number, steps: number, amplitude: number): number[] {
  const raw: number[] = [];
  let value = 0;
  for (let i = 0; i <= steps; i += 1) {
    value = Math.max(-1, Math.min(1, value * 0.8 + (random() - 0.5) * 1.15));
    raw.push(value);
  }
  return raw.map((v, i) => {
    const before = raw[i - 1] ?? v;
    const after = raw[i + 1] ?? v;
    return ((before + v * 2 + after) / 4) * amplitude;
  });
}

const fixed = (n: number): string => n.toFixed(4);

const STEPS = 72;
/** Fractions of the card's own width and height. */
const AMP_X = 0.013;
const AMP_Y = 0.016;

/**
 * A sheet torn along one edge and running off the stage on the others.
 *
 * @param edge  which edge faces the picture
 */
export function deckleEdge(edge: 'left' | 'right' | 'top', seed: number): string {
  const random = rng(seed);

  if (edge === 'top') {
    const offsets = tear(random, STEPS, AMP_Y);
    const base = AMP_Y * 1.25;
    const points = offsets.map((o, i) => `${fixed(i / STEPS)} ${fixed(base + o)}`);
    return `M ${points.join(' L ')} L 1 1 L 0 1 Z`;
  }

  const offsets = tear(random, STEPS, AMP_X);
  const base = AMP_X * 1.25;
  const points = offsets.map((o, i) => {
    const x = edge === 'left' ? base + o : 1 - base - o;
    return `${fixed(x)} ${fixed(i / STEPS)}`;
  });
  const corners = edge === 'left' ? 'L 1 1 L 1 0' : 'L 0 1 L 0 0';
  return `M ${points.join(' L ')} ${corners} Z`;
}

export const DECKLE_PATHS = {
  /** Card on the right of the frame: its left edge is the torn one. */
  tornLeft: deckleEdge('left', 20240823),
  /** Card on the left of the frame: its right edge is the torn one. */
  tornRight: deckleEdge('right', 1299709),
  /** Card slid under the film: its top edge is the torn one. */
  tornTop: deckleEdge('top', 104729),
} as const;
