/** Prime factorisation and the factor tree that visualises it. */

export interface PrimePower {
  readonly prime: number;
  readonly exponent: number;
}

/** Prime factors of `n` with multiplicity, ascending. `primeFactors(84)` is `[2, 2, 3, 7]`. */
export function primeFactors(n: number): number[] {
  if (!Number.isInteger(n) || n < 2) return [];
  const out: number[] = [];
  let rest = n;
  for (let d = 2; d * d <= rest; d += d === 2 ? 1 : 2) {
    while (rest % d === 0) {
      out.push(d);
      rest /= d;
    }
  }
  if (rest > 1) out.push(rest);
  return out;
}

/** The same factorisation grouped into prime powers: `84` becomes `2^2 . 3 . 7`. */
export function primePowers(n: number): PrimePower[] {
  const out: PrimePower[] = [];
  for (const p of primeFactors(n)) {
    const last = out.at(-1);
    if (last?.prime === p) out[out.length - 1] = { prime: p, exponent: last.exponent + 1 };
    else out.push({ prime: p, exponent: 1 });
  }
  return out;
}

export interface FactorNode {
  readonly value: number;
  readonly prime: boolean;
  /** Depth from the root, root being 0. */
  readonly depth: number;
  /** Splitting order - the node revealed at step `order` of the animation. */
  readonly order: number;
  readonly children: readonly FactorNode[];
}

/**
 * A factor tree that always splits off the *smallest* prime factor first, so
 * the shape is deterministic and the left spine reads as the prime sequence.
 */
export function factorTree(n: number): FactorNode {
  let counter = 0;
  const build = (value: number, depth: number): FactorNode => {
    const order = counter++;
    const factors = primeFactors(value);
    const first = factors[0];
    if (factors.length <= 1 || first === undefined) {
      return { value, prime: value >= 2, depth, order, children: [] };
    }
    const left = build(first, depth + 1);
    const right = build(value / first, depth + 1);
    return { value, prime: false, depth, order, children: [left, right] };
  };
  return build(n, 0);
}
