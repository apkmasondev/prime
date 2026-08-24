import { useSurface } from '../../hooks/useSurface';
import './coda.css';

/**
 * The closing. The professor has stopped; nothing large is placed over him.
 * The words settle into the corridor beside him and stay there.
 */
export function Coda(): React.JSX.Element {
  const surface = useSurface<HTMLDivElement>('coda');

  return (
    <div className="coda" ref={surface} aria-hidden="true">
      <div className="coda__block">
        <p className="coda__eyebrow">
          <span className="coda__rule" />
          Prime numbers
        </p>
        <p className="coda__line">Simple to define.</p>
        <p className="coda__line coda__line--second">Impossible to exhaust.</p>
        <p className="coda__tail">The sequence never ends. Our walk does.</p>
      </div>
    </div>
  );
}
