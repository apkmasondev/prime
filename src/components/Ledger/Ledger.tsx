import { useExperienceState } from '../../experience/ExperienceContext';
import { useSurface } from '../../hooks/useSurface';
import './ledger.css';

/**
 * The paper field below the film, which only the stacked layout has.
 *
 * It is always there - the composition never re-flows mid-scroll - so when no
 * board is up it carries the piece's own wall label, the way an exhibition
 * names itself between exhibits.
 */
export function Ledger(): React.JSX.Element {
  const { stationId, phaseKind } = useExperienceState();
  // Any moment with no card up: the field below the film is permanent, so it
  // always has something to say. The opening and the closing fade it out
  // themselves, in CSS, because they arrive on their own curves.
  const quiet = stationId === null && phaseKind !== 'intro';
  const surface = useSurface<HTMLDivElement>('ledger');

  return (
    <div className="ledger" ref={surface} aria-hidden="true">
      <div className="ledger__surface" />
      <p className="ledger__label" data-visible={quiet ? 'true' : 'false'}>
        <span className="ledger__mark" />
        Prime — a short walk through infinity
      </p>
    </div>
  );
}
