import { isPrime } from '../math/primes';
import './cryptography.css';

/**
 * Small enough to print, large enough to make the point. Both are checked at
 * module load rather than trusted, and the product is computed, not typed.
 */
export const P = 1_000_003;
export const Q = 1_000_033;
export const N = P * Q;

const group = (n: number): string => n.toLocaleString('en-GB').replace(/,/g, ' ');

export function Cryptography({ active }: { active: boolean }): React.JSX.Element {
  return (
    <div className="rsa" data-active={active ? 'true' : 'false'}>
      <div className="rsa__inputs">
        <p className="rsa__prime" style={{ '--s': 0 } as React.CSSProperties}>
          <span className="rsa__var">p</span>
          <span className="rsa__value">{group(P)}</span>
          <span className="rsa__tag">{isPrime(P) ? 'prime' : 'not prime'}</span>
        </p>
        <p className="rsa__prime" style={{ '--s': 0.35 } as React.CSSProperties}>
          <span className="rsa__var">q</span>
          <span className="rsa__value">{group(Q)}</span>
          <span className="rsa__tag">{isPrime(Q) ? 'prime' : 'not prime'}</span>
        </p>
      </div>

      <div className="rsa__flow" style={{ '--s': 1 } as React.CSSProperties}>
        <span className="rsa__arrow" aria-hidden="true">
          <span className="rsa__arrow-line" />
          <span className="rsa__arrow-head" />
        </span>
        <span className="rsa__flow-label">multiply — instant</span>
      </div>

      <p className="rsa__modulus" style={{ '--s': 1.35 } as React.CSSProperties}>
        <span className="rsa__var">n</span>
        <span className="rsa__value rsa__value--large">{group(N)}</span>
        <span className="rsa__tag rsa__tag--public">may be published</span>
      </p>

      <div className="rsa__flow rsa__flow--hard" style={{ '--s': 2 } as React.CSSProperties}>
        <span className="rsa__arrow rsa__arrow--blocked" aria-hidden="true">
          <span className="rsa__arrow-head rsa__arrow-head--back" />
          <span className="rsa__arrow-line" />
          <span className="rsa__block" />
        </span>
        <span className="rsa__flow-label">
          factor back to <span className="rsa__var">p</span> and <span className="rsa__var">q</span>{' '}
          — the hard direction
        </span>
      </div>

      <p className="rsa__footnote" style={{ '--s': 2.5 } as React.CSSProperties}>
        Real keys use primes of roughly 300 digits. At that size no published classical method
        recovers <span className="rsa__var">p</span> and <span className="rsa__var">q</span> from{' '}
        <span className="rsa__var">n</span> in practical time.
      </p>
    </div>
  );
}
