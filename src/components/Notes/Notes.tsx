import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { STATIONS } from '../../experience/timeline/stations';
import { useEngine } from '../../experience/ExperienceContext';
import { Wordmark } from '../Wordmark/Wordmark';
import './notes.css';

interface Reference {
  readonly station: string;
  readonly title: string;
  readonly href: string;
  readonly source: string;
}

const REFERENCES: readonly Reference[] = [
  {
    station: '01',
    title: 'Prime number',
    source: 'Encyclopaedia Britannica',
    href: 'https://www.britannica.com/science/prime-number',
  },
  {
    station: '02',
    title: 'Sieve of Eratosthenes',
    source: 'Encyclopaedia Britannica',
    href: 'https://www.britannica.com/science/Sieve-of-Eratosthenes',
  },
  {
    station: '03',
    title: "Euclid's Elements, Book IX, Proposition 20",
    source: 'Clark University — D. E. Joyce',
    href: 'https://mathcs.clarku.edu/~djoyce/elements/bookIX/propIX20.html',
  },
  {
    station: '04',
    title: 'Ulam spiral · Twin prime conjecture',
    source: 'Wolfram MathWorld',
    href: 'https://mathworld.wolfram.com/PrimeSpiral.html',
  },
  {
    station: '05',
    title: 'Fundamental theorem of arithmetic',
    source: 'Wolfram MathWorld',
    href: 'https://mathworld.wolfram.com/FundamentalTheoremofArithmetic.html',
  },
  {
    station: '06',
    title: 'RSA (PKCS #1) — RFC 8017',
    source: 'IETF',
    href: 'https://www.rfc-editor.org/rfc/rfc8017',
  },
];

/**
 * One unobtrusive drawer holding the whole lesson as plain text and the
 * references behind it. It doubles as the linear reading of the piece for
 * anyone who would rather not scrub a film to get at the mathematics.
 */
export function Notes(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [open]);

  // The control keeps clear of an open card, so it reads the board's width.
  const engine = useEngine();
  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    return engine.bindSurface('notes', trigger);
  }, [engine]);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="notes__trigger"
        aria-expanded={open}
        aria-controls="notes-panel"
        onClick={() => { setOpen(true); }}
      >
        Notes &amp; sources
      </button>

      <div className="notes" data-open={open ? 'true' : 'false'} id="notes-panel">
        <button
          type="button"
          className="notes__scrim"
          tabIndex={open ? 0 : -1}
          aria-label="Close notes"
          onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
        />
        <div
          className="notes__sheet"
          role="dialog"
          aria-modal="false"
          aria-label="Notes and sources"
          tabIndex={-1}
          ref={dialogRef}
          inert={!open}
        >
          <div className="notes__head">
            <Wordmark className="notes__mark" width={200} tone="ink" />
            <button
              type="button"
              className="notes__close"
              onClick={() => { setOpen(false); triggerRef.current?.focus(); }}
            >
              Close
            </button>
          </div>

          <div className="notes__body">
            <section>
              <h2 className="notes__heading">The walk, in words</h2>
              <ol className="notes__stations">
                {STATIONS.map((station) => (
                  <li key={station.id}>
                    <p className="notes__station-head">
                      <span className="notes__number">
                        {station.index.toString().padStart(2, '0')}
                      </span>
                      <span className="notes__station-title">{station.title}</span>
                    </p>
                    <p className="notes__statement">{station.statement}</p>
                    <p className="notes__summary">{station.diagramSummary}</p>
                    {station.note ? (
                      <p className="notes__aside" data-kind={station.note.kind}>
                        {station.note.kind === 'open-problem' ? (
                          <span className="notes__aside-label">Open problem</span>
                        ) : null}
                        {station.note.text}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="notes__heading">Sources</h2>
              <ul className="notes__refs">
                {REFERENCES.map((ref) => (
                  <li key={ref.href}>
                    <span className="notes__number">{ref.station}</span>
                    <a href={ref.href} target="_blank" rel="noreferrer noopener">
                      {ref.title}
                    </a>
                    <span className="notes__source">{ref.source}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="notes__colophon">
              Every diagram on this page is computed in the browser from the definitions above —
              the sieve, the spiral, the factor tree and the modulus are generated, not drawn.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
