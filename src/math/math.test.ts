import { describe, expect, it } from 'vitest';
import { divisors, factorPairs, isPrime, primesBetween, twinPrimes } from './primes';
import { sieve, sieveStateAt } from './sieve';
import { factorTree, flattenTree, primeFactors, primePowers } from './factorization';
import { ulamPosition, ulamRadius, ulamSpiral } from './ulam';

const PRIMES_UNDER_100 = [
  2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
];

describe('isPrime', () => {
  it('rejects everything below 2, including 1 and 0 and negatives', () => {
    for (const n of [-7, -1, 0, 1]) expect(isPrime(n)).toBe(false);
  });

  it('rejects non-integers', () => {
    for (const n of [2.5, Math.PI, Number.NaN, Number.POSITIVE_INFINITY]) expect(isPrime(n)).toBe(false);
  });

  it('accepts 2 as the only even prime', () => {
    expect(isPrime(2)).toBe(true);
    for (let n = 4; n <= 200; n += 2) expect(isPrime(n)).toBe(false);
  });

  it('matches the known primes below 100', () => {
    const found = Array.from({ length: 99 }, (_, i) => i + 1).filter(isPrime);
    expect(found).toEqual(PRIMES_UNDER_100);
  });

  it('rejects perfect squares of primes', () => {
    for (const p of [2, 3, 5, 7, 11, 13, 101]) expect(isPrime(p * p)).toBe(false);
  });

  it('agrees with known larger primes and their neighbours', () => {
    for (const p of [7919, 104729, 1299709, 2147483647]) {
      expect(isPrime(p)).toBe(true);
      expect(isPrime(p + 1)).toBe(false);
    }
    expect(isPrime(1_000_001)).toBe(false); // 101 x 9901
  });
});

describe('divisors and factor pairs', () => {
  it('gives exactly two divisors for a prime', () => {
    for (const p of PRIMES_UNDER_100) expect(divisors(p)).toEqual([1, p]);
  });

  it('gives one divisor for 1 and none below it', () => {
    expect(divisors(1)).toEqual([1]);
    expect(divisors(0)).toEqual([]);
    expect(divisors(-4)).toEqual([]);
  });

  it('lists divisors ascending with correct multiplicity handling', () => {
    expect(divisors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
    expect(divisors(84)).toEqual([1, 2, 3, 4, 6, 7, 12, 14, 21, 28, 42, 84]);
  });

  it('finds no non-trivial factor pair for a prime', () => {
    for (const p of PRIMES_UNDER_100) expect(factorPairs(p)).toEqual([]);
    expect(factorPairs(12)).toEqual([
      [2, 6],
      [3, 4],
    ]);
    expect(factorPairs(9)).toEqual([[3, 3]]);
  });
});

describe('primesBetween and twinPrimes', () => {
  it('collects primes inside a range', () => {
    expect(primesBetween(10, 30)).toEqual([11, 13, 17, 19, 23, 29]);
    expect(primesBetween(-5, 3)).toEqual([2, 3]);
  });

  it('finds the twin primes with both members at or below the limit', () => {
    expect(twinPrimes(60)).toEqual([
      [3, 5],
      [5, 7],
      [11, 13],
      [17, 19],
      [29, 31],
      [41, 43],
    ]);
    // 61 is outside the limit, so (59, 61) only appears once the limit reaches it.
    expect(twinPrimes(61)).toContainEqual([59, 61]);
  });
});

describe('sieve', () => {
  it('produces the primes below 100', () => {
    expect([...sieve(100).primes]).toEqual(PRIMES_UNDER_100);
  });

  it('handles degenerate limits', () => {
    for (const limit of [-3, 0, 1]) {
      const r = sieve(limit);
      expect(r.primes).toEqual([]);
      expect(r.steps).toEqual([]);
    }
    expect([...sieve(2).primes]).toEqual([2]);
  });

  it('only needs steps up to sqrt(limit)', () => {
    const r = sieve(100);
    expect(r.sqrtBound).toBe(10);
    expect(r.steps.map((s) => s.prime)).toEqual([2, 3, 5, 7]);
    for (const step of r.steps) expect(step.prime).toBeLessThanOrEqual(r.sqrtBound);
  });

  it('never strikes out the prime that drives a step', () => {
    const r = sieve(100);
    for (const step of r.steps) expect(step.removed).not.toContain(step.prime);
  });

  it('strikes every composite exactly once across all steps', () => {
    const r = sieve(100);
    const all = r.steps.flatMap((s) => [...s.removed]);
    expect(new Set(all).size).toBe(all.length);
    expect(all.length + r.primes.length + 2).toBe(101); // + 0 and 1
  });

  it('replays to a stable state in both directions', () => {
    const r = sieve(100);
    expect(sieveStateAt(r, 0).struck.size).toBe(0);
    expect(sieveStateAt(r, 0).activePrime).toBe(2);
    expect(sieveStateAt(r, 1).struck.has(4)).toBe(true);
    expect(sieveStateAt(r, 1).struck.has(9)).toBe(false);
    expect(sieveStateAt(r, 2).struck.has(9)).toBe(true);
    const full = sieveStateAt(r, r.steps.length);
    expect(full.activePrime).toBeNull();
    for (const p of PRIMES_UNDER_100) expect(full.struck.has(p)).toBe(false);
    // clamped, not thrown
    expect(sieveStateAt(r, -5).struck.size).toBe(0);
    expect(sieveStateAt(r, 999).struck.size).toBe(full.struck.size);
  });
});

describe('factorisation', () => {
  it('factorises the showcase number', () => {
    expect(primeFactors(84)).toEqual([2, 2, 3, 7]);
    expect(primePowers(84)).toEqual([
      { prime: 2, exponent: 2 },
      { prime: 3, exponent: 1 },
      { prime: 7, exponent: 1 },
    ]);
  });

  it('returns a single factor for primes and nothing below 2', () => {
    expect(primeFactors(97)).toEqual([97]);
    for (const n of [1, 0, -6, 2.5]) expect(primeFactors(n)).toEqual([]);
  });

  it('multiplies back to the original for a wide range', () => {
    for (let n = 2; n <= 500; n += 1) {
      const f = primeFactors(n);
      expect(f.reduce((a, b) => a * b, 1)).toBe(n);
      for (const p of f) expect(isPrime(p)).toBe(true);
    }
  });

  it('builds a tree whose leaves are exactly the prime factors', () => {
    const tree = factorTree(84);
    expect(tree.value).toBe(84);
    const leaves = flattenTree(tree).filter((n) => n.children.length === 0);
    expect(leaves.map((l) => l.value).sort((a, b) => a - b)).toEqual([2, 2, 3, 7]);
    for (const leaf of leaves) expect(leaf.prime).toBe(true);
  });

  it('gives a prime a leaf-only tree', () => {
    const tree = factorTree(13);
    expect(tree.children).toEqual([]);
    expect(tree.prime).toBe(true);
  });

  it('numbers nodes in a stable reveal order', () => {
    const order = flattenTree(factorTree(84)).map((n) => n.order);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(new Set(order).size).toBe(order.length);
  });
});

describe('ulam spiral', () => {
  it('places the opening numbers on the classic path', () => {
    const expected: [number, number][] = [
      [0, 0], // 1
      [1, 0], // 2
      [1, 1], // 3
      [0, 1], // 4
      [-1, 1], // 5
      [-1, 0], // 6
      [-1, -1], // 7
      [0, -1], // 8
      [1, -1], // 9
      [2, -1], // 10
    ];
    expected.forEach(([x, y], i) => {
      expect(ulamPosition(i + 1)).toEqual({ x, y });
    });
  });

  it('agrees with the bulk generator', () => {
    const points = ulamSpiral(400);
    expect(points).toHaveLength(400);
    for (const p of points) expect(ulamPosition(p.n)).toEqual({ x: p.x, y: p.y });
  });

  it('visits every cell of the completed square exactly once', () => {
    const points = ulamSpiral(49); // 7 x 7
    const seen = new Set(points.map((p) => `${String(p.x)},${String(p.y)}`));
    expect(seen.size).toBe(49);
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    expect(Math.min(...xs)).toBe(-3);
    expect(Math.max(...xs)).toBe(3);
    expect(Math.min(...ys)).toBe(-3);
    expect(Math.max(...ys)).toBe(3);
  });

  it('puts odd squares on the descending diagonal', () => {
    // 9, 25, 49 ... sit at (k, -k)
    for (const k of [1, 2, 3, 4, 5]) {
      const n = (2 * k + 1) ** 2;
      expect(ulamPosition(n)).toEqual({ x: k, y: -k });
    }
  });

  it('rejects invalid input and bounds the radius', () => {
    expect(() => ulamPosition(0)).toThrow(RangeError);
    expect(() => ulamPosition(2.5)).toThrow(RangeError);
    expect(ulamSpiral(0)).toEqual([]);
    expect(ulamRadius(49)).toBe(4);
  });
});
