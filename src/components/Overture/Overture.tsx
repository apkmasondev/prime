import { Wordmark } from '../Wordmark/Wordmark';
import { useSurface } from '../../hooks/useSurface';
import './overture.css';

/**
 * The opening. It is not a hero section: it lives in the same frame as
 * everything else and simply clears as the walk begins.
 */
export function Overture(): React.JSX.Element {
  const surface = useSurface<HTMLDivElement>('overture');

  return (
    <div className="overture" ref={surface} aria-hidden="true">
      <div className="overture__block">
        <Wordmark className="overture__mark" />
        <p className="overture__subtitle">A Short Walk Through Infinity</p>
        <p className="overture__prompt">
          <span className="overture__prompt-rule" />
          Scroll to begin
        </p>
      </div>
    </div>
  );
}
