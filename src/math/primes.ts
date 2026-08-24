/**
 * Deterministic prime-number primitives.
 *
 * Everything the experience shows about primes is computed here, so the
 * mathematics on screen is derived rather than transcribed.
 */

/**
 * Trial division by 2, 3 and then 6k +/- 1 up to sqrt(n).
 *
 * Non-integers, and every integer below 2, are not prime - 1 in particular is
 * excluded because it has a single positive divisor, not two.
 */
export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n < 4) return true; // 2, 3
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let k = 5; k * k <= n; k += 6) {
    if (n % k === 0 || n % (k + 2) === 0) return false;
  }
  return true;
}

/** Every positive divisor of `n`, ascending. Returns `[]` for n < 1. */
export function divisors(n: number): number[] {
  if (!Number.isInteger(n) || n < 1) return [];
  const small: number[] = [];
  const large: number[] = [];
  for (let d = 1; d * d <= n; d += 1) {
    if (n % d !== 0) continue;
    small.push(d);
    const pair = n / d;
    if (pair !== d) large.push(pair);
  }
  large.reverse();
  return [...small, ...large];
}

/**
 * The non-trivial factor pairs of `n`, i.e. `a x b = n` with `1 < a <= b < n`.
 * Primes (and 1) have none - which is exactly what makes them prime.
 */
export function factorPairs(n: number): [number, number][] {
  const pairs: [number, number][] = [];
  if (!Number.isInteger(n) || n < 2) return pairs;
  for (let a = 2; a * a <= n; a += 1) {
    if (n % a === 0) pairs.push([a, n / a]);
  }
  return pairs;
}

/** The n-th prime gap sequence helper: primes in `[from, to]`, ascending. */
export function primesBetween(from: number, to: number): number[] {
  const out: number[] = [];
  for (let n = Math.max(2, Math.ceil(from)); n <= to; n += 1) {
    if (isPrime(n)) out.push(n);
  }
  return out;
}
