import { useState } from 'react';
import { divisors, factorPairs, isPrime } from '../math/primes';
import './prime-definition.css';

/*
 * Eighteen, in six columns: three rows keep every cell tall enough to carry a
 * number and its divisor marks at any card size, and 1 to 18 already holds
 * seven primes, the unit, and both kinds of composite.
 */
const LIMIT = 18;

interface Cell {
  readonly n: number;
  readonly prime: boolean;
  readonly divisorCount: number;
  readonly detail: string;
}

/**
 * Primality is shown by counting, not by colour: under every number sits one
 * mark per positive divisor. Primes carry exactly two. 1 carries one, which is
 * precisely why it is not prime, and 2 is the only even number with two.
 */
const CELLS: readonly Cell[] = Array.from({ length: LIMIT }, (_, i) => {
  const n = i + 1;
  const d = divisors(n);
  const pairs = factorPairs(n);
  const detail =
    n === 1
      ? '1 has a single divisor, so it is neither prime nor composite'
      : pairs.length === 0
        ? `${String(n)} = 1 x ${String(n)} only`
        : `${String(n)} = ${pairs.map(([a, b]) => `${String(a)} x ${String(b)}`).join(' = ')}`;
  return { n, prime: isPrime(n), divisorCount: d.length, detail };
});

export function PrimeDefinition({ active }: { active: boolean }): React.JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const current = CELLS.find((c) => c.n === selected);

  return (
    <div className="primes" data-active={active ? 'true' : 'false'}>
      <ul className="primes__grid">
        {CELLS.map((cell) => (
          <li
            key={cell.n}
            className="primes__cell"
            data-prime={cell.prime ? 'true' : 'false'}
            data-unit={cell.n === 1 ? 'true' : 'false'}
            style={{ '--i': cell.n } as React.CSSProperties}
          >
            <button
              type="button"
              className="primes__button"
              aria-pressed={selected === cell.n}
              onClick={() => { setSelected(selected === cell.n ? null : cell.n); }}
              onPointerEnter={() => { setSelected(cell.n); }}
              onFocus={() => { setSelected(cell.n); }}
            >
              <span className="primes__n" aria-hidden="true">
                {cell.n}
              </span>
              <span className="primes__dots" aria-hidden="true">
                {Array.from({ length: Math.min(cell.divisorCount, 6) }, (_, k) => (
                  <span key={k} className="primes__dot" />
                ))}
                {cell.divisorCount > 6 ? <span className="primes__more">+</span> : null}
              </span>
              <span className="visually-hidden">
                {cell.n}, {cell.divisorCount} divisor{cell.divisorCount === 1 ? '' : 's'}
                {cell.prime ? ', prime' : ''}. {cell.detail}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="primes__readout" aria-live="polite">
        {current ? current.detail : 'Two marks means prime. Hover or tap a number.'}
      </p>

      <p className="primes__key">
        <span className="primes__key-item">
          <span className="primes__key-swatch" data-prime="true" aria-hidden="true">
            <span className="primes__dot" />
            <span className="primes__dot" />
          </span>
          prime — two divisors
        </span>
        <span className="primes__key-item">
          <span className="primes__key-swatch" aria-hidden="true">
            <span className="primes__dot" />
            <span className="primes__dot" />
            <span className="primes__dot" />
          </span>
          composite — more
        </span>
      </p>
    </div>
  );
}
