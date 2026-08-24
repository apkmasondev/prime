import { useCallback, useEffect, useRef, useState } from 'react';
import { sieve } from '../math/sieve';
import { ulamRadius, ulamSpiral } from '../math/ulam';
import { useFrame } from '../hooks/useFrame';
import './ulam-spiral.css';

interface Lattice {
  readonly side: number;
  readonly count: number;
  readonly radius: number;
  readonly xs: Int16Array;
  readonly ys: Int16Array;
  readonly primes: number;
}

const cache = new Map<number, Lattice>();

/**
 * Lattice coordinates of every prime inside a `side x side` spiral.
 * The diagonals in the finished picture are not drawn - they are what happens
 * when this data is plotted honestly.
 */
function lattice(side: number): Lattice {
  const cached = cache.get(side);
  if (cached) return cached;

  const count = side * side;
  const flags = new Uint8Array(count + 1);
  for (const p of sieve(count).primes) flags[p] = 1;

  const xs = new Int16Array(count);
  const ys = new Int16Array(count);
  let primes = 0;
  for (const point of ulamSpiral(count)) {
    if (flags[point.n] !== 1) continue;
    xs[primes] = point.x;
    ys[primes] = point.y;
    primes += 1;
  }

  const built: Lattice = {
    side,
    count,
    radius: ulamRadius(count),
    xs: xs.slice(0, primes),
    ys: ys.slice(0, primes),
    primes,
  };
  cache.set(side, built);
  return built;
}

/**
 * How many numbers to a side. The diagonals only emerge once there are enough
 * of them, so the lattice is sized from the box rather than fixed: about one
 * number every 2.8 device-independent pixels. Chosen from the CSS size, not the
 * device size, so the same picture appears on every screen and a denser display
 * only renders it more sharply.
 */
function sideFor(cssSize: number): number {
  const target = Math.round(cssSize / 2.8);
  const clamped = Math.min(151, Math.max(45, target));
  return clamped % 2 === 0 ? clamped + 1 : clamped;
}

const group = (n: number): string => n.toLocaleString('en-GB').replace(/,/g, ' ');

export function UlamSpiral({ active }: { active: boolean }): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawnRef = useRef(-1);
  const sizeRef = useRef({ css: 0, dpr: 1 });
  const initial = lattice(sideFor(300));
  const dataRef = useRef<Lattice>(initial);
  const [count, setCount] = useState(initial.count);

  const measure = useCallback((): void => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const box = parent.getBoundingClientRect();
    const css = Math.max(1, Math.floor(Math.min(box.width, box.height)));
    if (sizeRef.current.css === css && sizeRef.current.dpr === dpr) return;

    sizeRef.current = { css, dpr };
    canvas.width = Math.round(css * dpr);
    canvas.height = Math.round(css * dpr);
    canvas.style.width = `${String(css)}px`;
    canvas.style.height = `${String(css)}px`;

    const next = lattice(sideFor(css));
    dataRef.current = next;
    setCount((current) => (current === next.count ? current : next.count));
    drawnRef.current = -1;
  }, []);

  useEffect(() => {
    const parent = canvasRef.current?.parentElement;
    if (!parent) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    return () => { observer.disconnect(); };
  }, [measure]);

  useFrame((state) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = dataRef.current;
    const reveal = Math.min(1, Math.max(0, state.stationProgress * 1.18));
    const target = Math.floor(reveal * data.primes);
    if (target === drawnRef.current) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    const cell = canvas.width / (data.radius * 2 + 1);
    const mark = Math.max(1, Math.round(cell * 0.62));
    const centre = canvas.width / 2;

    // Lattice y grows upwards; canvas y grows down. Positions are rounded so a
    // mark occupies whole device pixels: it draws crisply, and erasing it later
    // clears exactly what was painted with nothing bleeding into its neighbours.
    const at = (i: number): [number, number] => [
      Math.round(centre + (data.xs[i] ?? 0) * cell - mark / 2),
      Math.round(centre - (data.ys[i] ?? 0) * cell - mark / 2),
    ];

    let from = drawnRef.current;
    if (from < 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      from = 0;
    }

    if (target < from) {
      // Scrolling back erases only the marks that are leaving, not the whole
      // spiral: a full repaint every frame is what turns a reversal into a
      // long task on a throttled phone.
      for (let i = from - 1; i >= target; i -= 1) {
        const [x, y] = at(i);
        ctx.clearRect(x, y, mark, mark);
      }
    } else {
      ctx.fillStyle = '#1c222a';
      for (let i = from; i < target; i += 1) {
        const [x, y] = at(i);
        ctx.fillRect(x, y, mark, mark);
      }
    }
    drawnRef.current = target;
  }, active);

  return (
    <div className="ulam" data-active={active ? 'true' : 'false'}>
      <div className="ulam__frame">
        <canvas ref={canvasRef} className="ulam__canvas" />
      </div>
      <p className="ulam__caption">
        <span className="ulam__mark" aria-hidden="true" />
        one mark per prime, 1 to {group(count)}
      </p>
    </div>
  );
}
