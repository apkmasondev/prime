import { useEngine, useExperienceState } from '../../experience/ExperienceContext';
import { STATIONS } from '../../experience/timeline/stations';
import { progressForStation } from '../../experience/timeline/timeline';
import { useSurface } from '../../hooks/useSurface';
import './station-index.css';

const pad = (n: number): string => n.toString().padStart(2, '0');

/**
 * A thin academic index rather than a progress bar: six numbered stops and a
 * rule that fills as the walk proceeds. Each stop is a real button, so the
 * whole experience is reachable without scrolling at all.
 */
export function StationIndex(): React.JSX.Element {
  const engine = useEngine();
  const { stationId, phaseKind } = useExperienceState();
  const surface = useSurface<HTMLElement>('index');

  return (
    <nav
      className="index"
      ref={surface}
      aria-label="Stations"
      data-phase={phaseKind}
      id="station-index"
    >
      <div className="index__rail" aria-hidden="true">
        <span className="index__fill" />
      </div>
      <ul className="index__list">
        {STATIONS.map((station) => {
          const current = stationId === station.id;
          return (
            <li key={station.id}>
              <button
                type="button"
                className="index__stop"
                aria-current={current ? 'step' : undefined}
                onClick={() => { engine.goTo(progressForStation(station.id)); }}
              >
                <span className="index__tick" aria-hidden="true" />
                <span className="index__number">{pad(station.index)}</span>
                <span className="visually-hidden">
                  {' '}
                  — {station.label}: {station.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
