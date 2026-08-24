import { describe, expect, it } from 'vitest';
import { PHASES, STATIONS, VIDEO, frameToTime } from './stations';
import {
  RESOLVED_PHASES,
  TOTAL_SCROLL_SCREENS,
  clamp01,
  describe as describeState,
  ease,
  frameAt,
  phaseAt,
  progressForStation,
  range,
  steadyFrameAt,
} from './timeline';
import {
  STACK_ASPECT,
  STACKED_FILM_SHARE,
  filmToStage,
  fitStage,
  isVisible,
  layoutFor,
  requiredSpan,
} from './stage';

describe('phase table', () => {
  it('covers the film from the first frame to the last usable one', () => {
    expect(PHASES[0]?.fromFrame).toBe(0);
    expect(PHASES.at(-1)?.toFrame).toBe(VIDEO.lastFrame);
    expect(VIDEO.lastFrame).toBeLessThan(VIDEO.frames);
  });

  it('is contiguous and strictly forward', () => {
    PHASES.forEach((phase, i) => {
      expect(phase.toFrame).toBeGreaterThan(phase.fromFrame);
      const next = PHASES[i + 1];
      if (next) expect(next.fromFrame).toBe(phase.toFrame);
    });
  });

  it('resolves into a gapless 0..1 range', () => {
    expect(RESOLVED_PHASES[0]?.start).toBe(0);
    expect(RESOLVED_PHASES.at(-1)?.end).toBeCloseTo(1, 12);
    RESOLVED_PHASES.forEach((phase, i) => {
      const next = RESOLVED_PHASES[i + 1];
      if (next) expect(next.start).toBeCloseTo(phase.end, 12);
    });
    expect(TOTAL_SCROLL_SCREENS).toBeGreaterThan(8);
    expect(TOTAL_SCROLL_SCREENS).toBeLessThan(24);
  });

  it('has one phase per station, in the order the stations are numbered', () => {
    const ids = RESOLVED_PHASES.filter((p) => p.kind === 'station').map((p) => p.stationId);
    expect(ids).toEqual(STATIONS.map((s) => s.id));
  });

  it('holds every station anchor inside its own phase', () => {
    for (const station of STATIONS) {
      const phase = RESOLVED_PHASES.find((p) => p.stationId === station.id);
      expect(phase).toBeDefined();
      expect(station.anchorFrame).toBeGreaterThanOrEqual(phase?.fromFrame ?? -1);
      expect(station.anchorFrame).toBeLessThanOrEqual(phase?.toFrame ?? -1);
    }
  });
});

describe('progress to frame', () => {
  it('is monotone across the whole range', () => {
    let previous = -1;
    for (let i = 0; i <= 2000; i += 1) {
      const f = frameAt(i / 2000);
      expect(f).toBeGreaterThanOrEqual(previous);
      previous = f;
    }
  });

  it('starts at the first frame and ends at the last usable frame', () => {
    expect(frameAt(0)).toBe(0);
    expect(frameAt(1)).toBeCloseTo(VIDEO.lastFrame, 6);
    expect(frameAt(-2)).toBe(0);
    expect(frameAt(9)).toBeCloseTo(VIDEO.lastFrame, 6);
  });

  it('reaches each station anchor somewhere inside its phase', () => {
    for (const station of STATIONS) {
      const phase = RESOLVED_PHASES.find((p) => p.stationId === station.id);
      if (!phase) throw new Error('missing phase');
      const mid = frameAt((phase.start + phase.end) / 2);
      expect(Math.abs(mid - station.anchorFrame)).toBeLessThanOrEqual(9);
    }
  });

  it('reaches each anchor on the frame, and at the scroll position, it always did', () => {
    for (const station of STATIONS) {
      const phase = RESOLVED_PHASES.find((p) => p.stationId === station.id);
      if (!phase) throw new Error('missing phase');
      // The progress a constant-rate crossing would reach the anchor at.
      const at =
        phase.start +
        (phase.end - phase.start) *
          ((station.anchorFrame - phase.fromFrame) / (phase.toFrame - phase.fromFrame));
      expect(frameAt(at)).toBeCloseTo(station.anchorFrame, 6);
    }
  });

  it('rests on the anchor and makes the distance up at the station edges', () => {
    for (const station of STATIONS) {
      const phase = RESOLVED_PHASES.find((p) => p.stationId === station.id);
      if (!phase) throw new Error('missing phase');
      const span = phase.end - phase.start;
      const step = span / 400;
      const rate = (at: number): number => (frameAt(at + step) - frameAt(at - step)) / (2 * step);

      const anchor =
        phase.start +
        span * ((station.anchorFrame - phase.fromFrame) / (phase.toFrame - phase.fromFrame));
      const constant = (phase.toFrame - phase.fromFrame) / span;

      // Slowest where the station is composed, fastest where it hands over.
      expect(rate(anchor)).toBeLessThan(constant * 0.5);
      expect(rate(phase.start + span * 0.02)).toBeGreaterThan(constant);
      expect(rate(phase.end - span * 0.02)).toBeGreaterThan(constant);
    }
  });

  it('crosses a transit at a constant rate', () => {
    const phase = RESOLVED_PHASES.find((p) => p.kind === 'transit');
    if (!phase) throw new Error('missing phase');
    const span = phase.end - phase.start;
    for (const at of [0.15, 0.5, 0.85]) {
      expect(frameAt(phase.start + span * at)).toBeCloseTo(
        phase.fromFrame + (phase.toFrame - phase.fromFrame) * at,
        6,
      );
    }
  });

  it('never seeks past the clamped last frame', () => {
    for (let i = 0; i <= 500; i += 1) {
      const s = describeState(i / 500, false, 0);
      expect(s.videoTime).toBeLessThanOrEqual(frameToTime(VIDEO.lastFrame) + 1e-9);
      expect(s.videoTime).toBeGreaterThanOrEqual(0);
    }
  });

  it('settles on a composed frame per phase when motion is reduced', () => {
    for (const phase of RESOLVED_PHASES) {
      if (phase.kind === 'transit') continue;
      const mid = (phase.start + phase.end) / 2;
      const held = (phase.fromFrame + phase.toFrame) / 2;
      expect(steadyFrameAt(phase.start + (phase.end - phase.start) * 0.1)).toBe(held);
      expect(steadyFrameAt(mid)).toBe(held);
      expect(steadyFrameAt(phase.start + (phase.end - phase.start) * 0.9)).toBe(held);
    }
  });
});

describe('derived state', () => {
  it('reports the station only inside station phases', () => {
    for (const phase of RESOLVED_PHASES) {
      const s = describeState((phase.start + phase.end) / 2, false, 0);
      expect(s.stationId).toBe(phase.kind === 'station' ? phase.stationId : null);
    }
  });

  it('runs station progress from 0 to 1 and back again', () => {
    const phase = RESOLVED_PHASES.find((p) => p.stationId === 'sieve');
    if (!phase) throw new Error('missing phase');
    const forward = [0, 0.25, 0.5, 0.75, 1].map((t) =>
      describeState(phase.start + (phase.end - phase.start) * t * 0.999, false, 0).stationProgress,
    );
    expect(forward[0]).toBeCloseTo(0, 3);
    expect(forward.at(-1)).toBeGreaterThan(0.99);
    expect([...forward].sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(forward);
  });

  it('clears the intro title and brings the outro in', () => {
    expect(describeState(0, false, 0).introPresence).toBe(1);
    expect(describeState(0.3, false, 0).introPresence).toBe(0);
    expect(describeState(0.3, false, 0).outroPresence).toBe(0);
    expect(describeState(1, false, 0).outroPresence).toBe(1);
  });

  it('lands on a station when navigating to it', () => {
    for (const station of STATIONS) {
      const s = describeState(progressForStation(station.id), false, 0);
      expect(s.stationId).toBe(station.id);
    }
  });

  it('picks the same phase from either side of a boundary', () => {
    for (const phase of RESOLVED_PHASES.slice(1)) {
      expect(phaseAt(phase.start + 1e-9).index).toBe(phase.index);
      expect(phaseAt(phase.start - 1e-9).index).toBe(phase.index - 1);
    }
  });
});

describe('helpers', () => {
  it('clamps and interpolates predictably', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(range(5, 0, 10)).toBe(0.5);
    expect(range(5, 5, 5)).toBe(1);
    expect(range(4, 5, 5)).toBe(0);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBe(0.5);
  });
});

describe('stage fit', () => {
  const focus = { x: 0.5, y: 0.36 };

  it('stacks only when the stage is close to square or taller', () => {
    expect(layoutFor({ width: 1440, height: 900 })).toBe('side');
    expect(layoutFor({ width: 390, height: 844 })).toBe('stacked');
    expect(layoutFor({ width: 1024, height: 1024 })).toBe('stacked');
    expect(layoutFor({ width: STACK_ASPECT * 1000, height: 1000 })).toBe('side');
  });

  it('covers the film box without leaving a gap on any edge', () => {
    for (const box of [
      { width: 1920, height: 1080 },
      { width: 2560, height: 1080 },
      { width: 1280, height: 900 },
      { width: 390, height: 844 },
      { width: 844, height: 390 },
    ]) {
      const fit = fitStage(box, focus);
      expect(fit.originX).toBeLessThanOrEqual(0.001);
      expect(fit.originY).toBeLessThanOrEqual(0.001);
      expect(fit.originX + VIDEO.width * fit.scale).toBeGreaterThanOrEqual(fit.filmWidth - 0.001);
      expect(fit.originY + VIDEO.height * fit.scale).toBeGreaterThanOrEqual(fit.filmHeight - 0.001);
      expect(fit.visibleX0).toBeGreaterThanOrEqual(-1e-9);
      expect(fit.visibleX1).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('shows the whole frame at exactly 16:9', () => {
    const fit = fitStage({ width: 1600, height: 900 }, focus);
    expect(fit.visibleX0).toBeCloseTo(0, 6);
    expect(fit.visibleX1).toBeCloseTo(1, 6);
    expect(fit.visibleY0).toBeCloseTo(0, 6);
    expect(fit.visibleY1).toBeCloseTo(1, 6);
  });

  it('maps film coordinates onto the stage and back to the same place', () => {
    const fit = fitStage({ width: 1440, height: 810 }, focus);
    expect(filmToStage(fit, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    const mid = filmToStage(fit, { x: 0.5, y: 0.5 });
    expect(mid.x).toBeCloseTo(720, 6);
    expect(mid.y).toBeCloseTo(405, 6);
  });

  it('keeps every station hand and figure visible on the shapes we ship for', () => {
    const boxes = [
      { width: 1920, height: 1080 },
      { width: 2560, height: 1080 },
      { width: 3440, height: 1440 },
      { width: 1366, height: 768 },
      { width: 1180, height: 820 },
      { width: 390, height: 844 },
      { width: 360, height: 640 },
      { width: 430, height: 932 },
      { width: 844, height: 390 },
    ];
    for (const box of boxes) {
      for (const station of STATIONS) {
        const fit = fitStage(box, station.focus);
        expect(
          isVisible(fit, station.hand, 0.005),
          `${station.id} hand hidden at ${String(box.width)}x${String(box.height)}`,
        ).toBe(true);
        // The professor's head and shoulders must never be cropped away.
        expect(
          isVisible(fit, { x: (station.figure.x0 + station.figure.x1) / 2, y: station.figure.y0 + 0.02 }),
          `${station.id} head cropped at ${String(box.width)}x${String(box.height)}`,
        ).toBe(true);
      }
    }
  });
});

describe('exhibit card geometry', () => {
  const BOXES = [
    { width: 1920, height: 1080 },
    { width: 2560, height: 1080 },
    { width: 3440, height: 1440 },
    { width: 1440, height: 810 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 1180, height: 820 },
    { width: 1024, height: 768 },
    { width: 844, height: 390 },
    { width: 800, height: 450 },
  ];

  const request = (station: (typeof STATIONS)[number], presence = 1) => ({
    side: station.side,
    hand: station.hand,
    span: requiredSpan(station.figure.x0, station.figure.x1, station.hand.x),
    presence,
  });

  it('never lets the card cover the gesture', () => {
    for (const box of BOXES) {
      for (const station of STATIONS) {
        const fit = fitStage(box, station.focus, request(station));
        const hand = filmToStage(fit, station.hand);
        const where = `${station.id} at ${String(box.width)}x${String(box.height)}`;
        if (station.side === 'right') {
          expect(hand.x, `${where}: hand under the card`).toBeLessThanOrEqual(
            box.width - fit.boardSize + 0.5,
          );
        } else {
          expect(hand.x, `${where}: hand under the card`).toBeGreaterThanOrEqual(fit.boardSize - 0.5);
        }
        expect(hand.x, `${where}: hand off stage`).toBeGreaterThanOrEqual(-0.5);
        expect(hand.x, `${where}: hand off stage`).toBeLessThanOrEqual(box.width + 0.5);
      }
    }
  });

  it('never lets the card cover the professor', () => {
    for (const box of BOXES) {
      for (const station of STATIONS) {
        const fit = fitStage(box, station.focus, request(station));
        const left = filmToStage(fit, { x: station.figure.x0, y: 0 }).x;
        const right = filmToStage(fit, { x: station.figure.x1, y: 0 }).x;
        const where = `${station.id} at ${String(box.width)}x${String(box.height)}`;
        const windowStart = station.side === 'left' ? fit.boardSize : 0;
        const windowEnd = station.side === 'left' ? box.width : box.width - fit.boardSize;
        expect(left, `${where}: figure clipped`).toBeGreaterThanOrEqual(windowStart - 1);
        expect(right, `${where}: figure under the card`).toBeLessThanOrEqual(windowEnd + 1);
      }
    }
  });

  it('keeps the film covering every part of the stage the card does not', () => {
    for (const box of BOXES) {
      for (const station of STATIONS) {
        for (const presence of [0, 0.2, 0.55, 0.9, 1]) {
          const fit = fitStage(box, station.focus, request(station, presence));
          const filmRight = fit.originX + VIDEO.width * fit.scale;
          const filmBottom = fit.originY + VIDEO.height * fit.scale;
          const where = `${station.id} at ${String(box.width)}x${String(box.height)} p=${String(presence)}`;
          expect(fit.originX, `${where}: gap on the near edge`).toBeLessThanOrEqual(fit.filmLeft + 0.5);
          expect(filmRight, `${where}: gap on the far edge`).toBeGreaterThanOrEqual(
            fit.filmLeft + fit.filmWidth - 0.5,
          );
          expect(fit.originY, `${where}: gap at the top`).toBeLessThanOrEqual(fit.filmTop + 0.5);
          expect(filmBottom, `${where}: gap at the bottom`).toBeGreaterThanOrEqual(
            fit.filmTop + fit.filmHeight - 0.5,
          );
        }
      }
    }
  });

  it('opens a card wide enough to read on every desktop shape', () => {
    for (const box of BOXES.filter((b) => layoutFor(b) === 'side' && b.width >= 1024)) {
      for (const station of STATIONS) {
        const fit = fitStage(box, station.focus, request(station));
        expect(
          fit.boardSize,
          `${station.id} at ${String(box.width)}x${String(box.height)}`,
        ).toBeGreaterThanOrEqual(240);
      }
    }
  });

  it('gives the stacked layout a field but no side card', () => {
    const box = { width: 390, height: 844 };
    for (const station of STATIONS) {
      const fit = fitStage(box, station.focus, request(station));
      expect(fit.mode).toBe('stacked');
      expect(fit.filmWidth).toBe(box.width);
      expect(fit.boardSize).toBeCloseTo(box.height * (1 - STACKED_FILM_SHARE), 6);
      expect(isVisible(fit, station.hand, 0.005)).toBe(true);
    }
  });
});
