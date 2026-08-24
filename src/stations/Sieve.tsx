import { useState } from 'react';
import { sieve } from '../math/sieve';
import { useSteppedProgress } from '../hooks/useFrame';
import './sieve.css';

const LIMIT = 100;
const RESULT = sieve(LIMIT);

/**
 * Every strike, in the order the algorithm makes it. A number's position in
 * this list is the only thing that decides when it is crossed out, so running
 * the scroll backwards un-crosses them in exactly the reverse order.
 */
const ORDER: readonly { readonly n: number; readonly by: number }[] = RESULT.steps.flatMap((step) =>
  step.removed.map((n) => ({ n, by: step.prime })),
);

const REMOVAL_INDEX = new Map<number, number>(ORDER.map((entry, i) => [entry.n, i]));
const TOTAL = ORDER.length;

/** Which prime is doing the striking at a given point in the sequence. */
function activePrimeAt(cursor: number): number | null {
  if (cursor <= 0) return RESULT.steps[0]?.prime ?? null;
  const entry = ORDER[Math.min(TOTAL - 1, Math.floor(cursor))];
  return cursor >= TOTAL ? null : (entry?.by ?? null);
}

export function Sieve({ active }: { active: boolean }): React.JSX.Element {
  const [activePrime, setActivePrime] = useState<number | null>(RESULT.steps[0]?.prime ?? null);

  useSteppedProgress(active, TOTAL, (_step, exact) => {
    const next = activePrimeAt(exact);
    setActivePrime((current) => (current === next ? current : next));
  });

  return (
    <div className="sieve" data-active={active ? 'true' : 'false'}>
      <ol className="sieve__grid" style={{ '--total': TOTAL } as React.CSSProperties}>
        {Array.from({ length: LIMIT }, (_, i) => {
          const n = i + 1;
          const removedAt = REMOVAL_INDEX.get(n);
          const prime = RESULT.primes.includes(n);
          return (
            <li
              key={n}
              className="sieve__cell"
              data-prime={prime ? 'true' : 'false'}
              data-unit={n === 1 ? 'true' : 'false'}
              style={{ '--k': removedAt ?? -1 } as React.CSSProperties}
            >
              <span className="sieve__n">{n}</span>
              <span className="sieve__strike" aria-hidden="true" />
            </li>
          );
        })}
      </ol>

      <p className="sieve__caption" aria-live="polite">
        {activePrime === null ? (
          <>
            <strong>{RESULT.primes.length} primes</strong> remain below {LIMIT}.
          </>
        ) : (
          <>
            Striking out the multiples of <strong>{activePrime}</strong>
            <span className="sieve__caption-hint">
              {' '}
              — {activePrime}
              &nbsp;itself survives
            </span>
          </>
        )}
      </p>
    </div>
  );
}
