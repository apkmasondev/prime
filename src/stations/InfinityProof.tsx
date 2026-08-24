import { Fragment } from 'react';
import { primeFactors } from '../math/factorization';
import { primesBetween } from '../math/primes';
import './infinity-proof.css';

/** A deliberately small "complete" list, so the whole argument stays readable. */
const LIST = primesBetween(2, 13);
const PRODUCT = LIST.reduce((a, b) => a * b, 1);
const N = PRODUCT + 1;
const FACTORS = primeFactors(N);

const group = (n: number): string => n.toLocaleString('en-GB').replace(/,/g, ' ');

export function InfinityProof({ active }: { active: boolean }): React.JSX.Element {
  return (
    <div className="euclid" data-active={active ? 'true' : 'false'}>
      <ol className="euclid__steps">
        <li className="euclid__step" style={{ '--s': 0 } as React.CSSProperties}>
          <p className="euclid__lead">Suppose this list held every prime.</p>
          <p className="euclid__list">
            {LIST.map((p, i) => (
              <Fragment key={p}>
                {i > 0 ? <span className="euclid__sep" aria-hidden="true" /> : null}
                <span>{p}</span>
              </Fragment>
            ))}
          </p>
        </li>

        <li className="euclid__step" style={{ '--s': 1 } as React.CSSProperties}>
          <p className="euclid__lead">Multiply them all, then add one.</p>
          <p className="euclid__equation">
            <span className="euclid__var">N</span>
            <span className="euclid__op">=</span>
            {LIST.map((p, i) => (
              <Fragment key={p}>
                {i > 0 ? <span className="euclid__times">×</span> : null}
                <span>{p}</span>
              </Fragment>
            ))}
            <span className="euclid__op">+</span>
            <span>1</span>
            <span className="euclid__op">=</span>
            <strong>{group(N)}</strong>
          </p>
        </li>

        <li className="euclid__step" style={{ '--s': 2 } as React.CSSProperties}>
          <p className="euclid__lead">Divide by any prime on the list. One is always left over.</p>
          <table className="euclid__table">
            <caption className="visually-hidden">
              {group(N)} divided by each prime on the list, showing a remainder of 1 every time
            </caption>
            <tbody>
              {LIST.map((p) => (
                <tr key={p}>
                  <th scope="row">{group(N)}</th>
                  <td className="euclid__op">=</td>
                  <td className="euclid__factor">{p}</td>
                  <td className="euclid__times">×</td>
                  <td className="euclid__quotient">{group(PRODUCT / p)}</td>
                  <td className="euclid__op">+</td>
                  <td className="euclid__remainder">1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </li>

        <li className="euclid__step" style={{ '--s': 3 } as React.CSSProperties}>
          <p className="euclid__lead">
            So {group(N)} is either prime, or built from primes the list never had.
          </p>
          <p className="euclid__equation euclid__equation--result">
            <strong>{group(N)}</strong>
            <span className="euclid__op">=</span>
            {FACTORS.map((f, i) => (
              <Fragment key={f}>
                {i > 0 ? <span className="euclid__times">×</span> : null}
                <span className="euclid__new">{group(f)}</span>
              </Fragment>
            ))}
          </p>
          <p className="euclid__coda">
            Both are prime. Neither is on the list. Every list of primes is incomplete.
          </p>
        </li>
      </ol>
    </div>
  );
}
