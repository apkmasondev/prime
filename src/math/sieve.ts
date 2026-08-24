/** The Sieve of Eratosthenes, recorded step by step so it can be replayed. */

export interface SieveStep {
  /** The prime whose multiples this step removes. */
  readonly prime: number;
  /** Composites struck out by this step, ascending. Never includes `prime`. */
  readonly removed: readonly number[];
}

export interface SieveResult {
  readonly limit: number;
  readonly primes: readonly number[];
  readonly steps: readonly SieveStep[];
  /**
   * Sieving may stop here: a composite `n <= limit` always has a factor
   * `<= sqrt(limit)`, so once the working prime passes this bound every
   * remaining unmarked number is prime.
   */
  readonly sqrtBound: number;
}

/** Primes up to and including `limit`, plus the elimination steps that found them. */
export function sieve(limit: number): SieveResult {
  const bound = Math.floor(limit);
  const sqrtBound = Math.floor(Math.sqrt(Math.max(bound, 0)));
  if (bound < 2) return { limit: bound, primes: [], steps: [], sqrtBound };

  const composite = new Uint8Array(bound + 1);
  const steps: SieveStep[] = [];

  for (let p = 2; p <= sqrtBound; p += 1) {
    if (composite[p] === 1) continue;
    const removed: number[] = [];
    for (let m = p * p; m <= bound; m += p) {
      if (composite[m] === 1) continue;
      composite[m] = 1;
      removed.push(m);
    }
    if (removed.length > 0) steps.push({ prime: p, removed });
  }

  const primes: number[] = [];
  for (let n = 2; n <= bound; n += 1) if (composite[n] === 0) primes.push(n);

  return { limit: bound, primes, steps, sqrtBound };
}

/**
 * The state of the grid after `stepCount` complete elimination steps.
 * `stepCount` is clamped, so callers can drive this straight from a scroll
 * position in either direction.
 */
export function sieveStateAt(result: SieveResult, stepCount: number): {
  readonly struck: ReadonlySet<number>;
  readonly activePrime: number | null;
} {
  const n = Math.max(0, Math.min(result.steps.length, Math.floor(stepCount)));
  const struck = new Set<number>();
  for (let i = 0; i < n; i += 1) {
    const step = result.steps[i];
    if (!step) continue;
    for (const m of step.removed) struck.add(m);
  }
  return { struck, activePrime: result.steps[n]?.prime ?? null };
}
