import { useEffect, useRef, useState } from 'react';
import './loader.css';

/** The first primes, which is all the loader ever needs to say. */
const MARKS = [2, 3, 5, 7, 11, 13];

/** Never hold the door shut longer than this, whatever the network is doing. */
const MAX_WAIT = 7000;

interface Props {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly onReady: () => void;
  readonly expectedDuration: number;
}

export function Loader({ videoRef, onReady, expectedDuration }: Props): React.JSX.Element | null {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);
  const released = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;

    const release = (): void => {
      if (released.current) return;
      released.current = true;
      setProgress(1);
      setDone(true);
      onReady();
    };

    const sample = (): void => {
      // How much of the opening stretch is buffered, plus a floor from
      // readyState so a fast connection never sits at zero.
      let buffered = 0;
      for (let i = 0; i < video.buffered.length; i += 1) {
        if (video.buffered.start(i) > 0.05) continue;
        buffered = video.buffered.end(i);
      }
      const share = Math.min(1, buffered / Math.max(1, expectedDuration * 0.3));
      const floor = video.readyState >= 3 ? 0.55 : video.readyState >= 2 ? 0.3 : 0.05;
      setProgress((current) => Math.max(current, Math.max(share, floor)));
      if (video.readyState >= 3 && share >= 0.35) release();
      else raf = requestAnimationFrame(sample);
    };

    raf = requestAnimationFrame(sample);
    const timer = setTimeout(release, MAX_WAIT);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [videoRef, onReady, expectedDuration]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => { setGone(true); }, 780);
    return () => { clearTimeout(timer); };
  }, [done]);

  if (gone) return null;

  const revealed = Math.round(progress * MARKS.length);

  return (
    <div className="loader" data-done={done ? 'true' : 'false'} role="status" aria-live="polite">
      <p className="loader__marks" aria-hidden="true">
        {MARKS.map((mark, i) => (
          <span key={mark} className="loader__mark" data-on={i < revealed ? 'true' : 'false'}>
            {mark}
          </span>
        ))}
      </p>
      <p className="loader__label">
        {done ? 'Ready' : 'Preparing the walk'}
        <span className="visually-hidden"> — {Math.round(progress * 100)} per cent</span>
      </p>
    </div>
  );
}
