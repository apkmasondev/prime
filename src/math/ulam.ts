/**
 * Ulam spiral geometry.
 *
 * The integers are laid on a square lattice starting at 1 and turning
 * counter-clockwise, so run lengths go 1, 1, 2, 2, 3, 3, ... in the directions
 * right, up, left, down. Marking only the primes makes diagonal streaks appear,
 * because many quadratics of the form 4k^2 + bk + c lie along the diagonals and
 * some of them are unusually prime-rich.
 *
 * Coordinates are mathematical (y grows upwards); the renderer flips y.
 */

export interface UlamPoint {
  readonly n: number;
  readonly x: number;
  readonly y: number;
}

/** Lattice coordinate of the integer `n >= 1`. */
export function ulamPosition(n: number): { x: number; y: number } {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('ulamPosition expects an integer >= 1');
  let x = 0;
  let y = 0;
  let current = 1;
  let run = 1;
  // Directions: right, up, left, down.
  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];
  let dir = 0;
  while (current < n) {
    for (let leg = 0; leg < 2 && current < n; leg += 1) {
      const stepDx = dx[dir] ?? 0;
      const stepDy = dy[dir] ?? 0;
      for (let s = 0; s < run && current < n; s += 1) {
        x += stepDx;
        y += stepDy;
        current += 1;
      }
      dir = (dir + 1) % 4;
    }
    run += 1;
  }
  return { x, y };
}

/**
 * All lattice positions for `1..count`, generated in one pass.
 * `size x size` where `size = ceil(sqrt(count))` bounds the extent.
 */
export function ulamSpiral(count: number): UlamPoint[] {
  const total = Math.max(0, Math.floor(count));
  const points: UlamPoint[] = [];
  if (total < 1) return points;

  let x = 0;
  let y = 0;
  let n = 1;
  points.push({ n, x, y });

  const dx = [1, 0, -1, 0];
  const dy = [0, 1, 0, -1];
  let dir = 0;
  let run = 1;

  while (n < total) {
    for (let leg = 0; leg < 2 && n < total; leg += 1) {
      const stepDx = dx[dir] ?? 0;
      const stepDy = dy[dir] ?? 0;
      for (let s = 0; s < run && n < total; s += 1) {
        x += stepDx;
        y += stepDy;
        n += 1;
        points.push({ n, x, y });
      }
      dir = (dir + 1) % 4;
    }
    run += 1;
  }
  return points;
}

/** Half-extent of the spiral holding `1..count`, in lattice cells. */
export function ulamRadius(count: number): number {
  const side = Math.ceil(Math.sqrt(Math.max(1, count)));
  return Math.ceil(side / 2);
}
