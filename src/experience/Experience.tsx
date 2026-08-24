import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EngineContext } from './ExperienceContext';
import { ExperienceEngine } from './timeline/engine';
import { TOTAL_SCROLL_SCREENS } from './timeline/timeline';
import { VIDEO } from './timeline/stations';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Film } from '../components/Film/Film';
import { Loader } from '../components/Loader/Loader';
import { StationLayer } from '../components/StationLayer/StationLayer';
import { Overture } from '../components/Overture/Overture';
import { Coda } from '../components/Coda/Coda';
import { StationIndex } from '../components/StationIndex/StationIndex';
import { Notes } from '../components/Notes/Notes';
import { Ledger } from '../components/Ledger/Ledger';
import './experience.css';

export function Experience(): React.JSX.Element {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const filmRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<ExperienceEngine | null>(null);
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();

  // Stable, so the loader's effect - and the timer that caps how long it may
  // hold the door - is set up once rather than restarted on every render.
  const onReady = useCallback(() => { setReady(true); }, []);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const video = videoRef.current;
    if (!stage || !video) return;
    const created = new ExperienceEngine(stage, video);
    setEngine(created);
    return () => { created.stop(); };
  }, []);

  useEffect(() => {
    if (!engine) return;
    engine.setReducedMotion(reducedMotion);
  }, [engine, reducedMotion]);

  // The film is rendered above the provider, so its surface is bound here.
  useLayoutEffect(() => {
    const film = filmRef.current;
    if (!engine || !film) return;
    return engine.bindSurface('film', film);
  }, [engine]);

  useEffect(() => {
    if (!engine || !ready) return;
    engine.start();
    return () => { engine.stop(); };
  }, [engine, ready]);

  return (
    <>
      <a className="skip-link" href="#station-index">
        Skip to the station index
      </a>

      {/* The only tall element on the page: scroll length, nothing else. */}
      <div
        className="scroll-track"
        style={{ '--screens': TOTAL_SCROLL_SCREENS } as React.CSSProperties}
        aria-hidden="true"
      />

      <div className="stage" ref={stageRef} data-ready={ready ? 'true' : 'false'}>
        <Film ref={videoRef} rootRef={filmRef} />
        <div className="stage__vignette" aria-hidden="true" />

        {engine ? (
          <EngineContext.Provider value={engine}>
            <main className="stage__content" id="experience">
              <h1 className="visually-hidden">
                PRIME — A Short Walk Through Infinity: an interactive walk through prime numbers
              </h1>
              <Ledger />
              <Overture />
              <StationLayer />
              <Coda />
            </main>
            <StationIndex />
            <Notes />
          </EngineContext.Provider>
        ) : null}
      </div>

      <Loader videoRef={videoRef} onReady={onReady} expectedDuration={VIDEO.frames / VIDEO.fps} />
    </>
  );
}
