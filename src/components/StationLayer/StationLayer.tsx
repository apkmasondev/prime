import { useExperienceState } from '../../experience/ExperienceContext';
import { useSurface } from '../../hooks/useSurface';
import { RESOLVED_PHASES } from '../../experience/timeline/timeline';
import { STATIONS } from '../../experience/timeline/stations';
import type { StationId } from '../../experience/timeline/types';
import { StationPanel } from './StationPanel';
import { Connector } from './Connector';
import { PaperEdges } from './PaperEdges';
import { PrimeDefinition } from '../../stations/PrimeDefinition';
import { Sieve } from '../../stations/Sieve';
import { InfinityProof } from '../../stations/InfinityProof';
import { UlamSpiral } from '../../stations/UlamSpiral';
import { FactorTree } from '../../stations/FactorTree';
import { Cryptography } from '../../stations/Cryptography';
import './station-layer.css';

const DIAGRAMS: Record<StationId, (props: { active: boolean }) => React.JSX.Element> = {
  prime: PrimeDefinition,
  sieve: Sieve,
  infinity: InfinityProof,
  ulam: UlamSpiral,
  factors: FactorTree,
  cryptography: Cryptography,
};

/** Phase index of each station, so neighbours can be built before they are needed. */
const PHASE_OF = new Map<StationId, number>(
  RESOLVED_PHASES.flatMap((p) => (p.stationId ? ([[p.stationId, p.index]] as const) : [])),
);

export function StationLayer(): React.JSX.Element {
  const { stationId, phaseIndex } = useExperienceState();
  const surface = useSurface<HTMLDivElement>('stations');

  return (
    <div className="station-layer" ref={surface}>
      <PaperEdges />
      {STATIONS.map((station) => {
        const own = PHASE_OF.get(station.id) ?? -99;
        // Build one phase ahead in both directions so nothing is constructed
        // in the frame it first becomes visible.
        if (Math.abs(own - phaseIndex) > 1) return null;
        const active = stationId === station.id;
        const Diagram = DIAGRAMS[station.id];
        return (
          <StationPanel key={station.id} station={station} active={active}>
            <Diagram active={active} />
          </StationPanel>
        );
      })}
      <Connector />
    </div>
  );
}
