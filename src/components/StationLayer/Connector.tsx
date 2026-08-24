import { useExperienceState } from '../../experience/ExperienceContext';
import { stationById } from '../../experience/timeline/stations';

/**
 * A hairline that leaves the gesture and travels towards the board.
 *
 * It stops well short of the hand and never touches it: the point is to say
 * "over there", in the register of a printed exhibit label, not to pretend
 * something is being projected from a finger. Stations where the professor only
 * turns his head get no line - the placement is the whole relationship.
 */
export function Connector(): React.JSX.Element | null {
  const { stationId } = useExperienceState();
  const station = stationId ? stationById(stationId) : undefined;
  // Only an arm earns a line. A head turn is answered by placement alone.
  if (!station || station.gesture === 'neutral' || station.gesture === 'look-left') return null;

  return (
    <div className="connector" data-side={station.side} aria-hidden="true">
      <span className="connector__mark" />
      <span className="connector__line" />
    </div>
  );
}
