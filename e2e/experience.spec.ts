import { expect, test, type ConsoleMessage, type Page } from '@playwright/test';

const STATIONS = ['prime', 'sieve', 'infinity', 'ulam', 'factors', 'cryptography'] as const;

/**
 * Console output is part of the deliverable, so every test collects it and the
 * last check in the file asserts there was none.
 */
function watchConsole(page: Page): string[] {
  const noise: string[] = [];
  page.on('console', (m: ConsoleMessage) => {
    if (m.type() === 'error' || m.type() === 'warning') noise.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e: Error) => noise.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => noise.push(`requestfailed: ${r.url()}`));
  return noise;
}

async function ready(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('.stage')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
}

/** Drive to a station through the index, then let the loop settle. */
async function goTo(page: Page, id: (typeof STATIONS)[number]): Promise<void> {
  await page.locator('.index__stop').nth(STATIONS.indexOf(id)).click();
  await expect(page.locator('.stage')).toHaveAttribute('data-station', id);
  await page.waitForTimeout(1200);
}

test('opens on the title and releases the loader', async ({ page }) => {
  const noise = watchConsole(page);
  await ready(page);

  await expect(page.locator('.loader')).toHaveCount(0);
  await expect(page.locator('.overture')).toBeVisible();
  await expect(page).toHaveTitle(/PRIME/);
  expect(noise).toEqual([]);
});

test('walks through all six stations and back again', async ({ page }) => {
  const noise = watchConsole(page);
  await ready(page);

  for (const id of STATIONS) {
    await goTo(page, id);
    const panel = page.locator(`.panel[data-station="${id}"]`);
    await expect(panel).toBeVisible();
    await expect(panel.locator('.panel__title')).not.toBeEmpty();
    await expect(panel.locator('.panel__figure')).toBeVisible();
  }

  // The reverse journey has to be as deliberate as the forward one.
  for (const id of [...STATIONS].reverse()) {
    await goTo(page, id);
    await expect(page.locator(`.panel[data-station="${id}"]`)).toBeVisible();
  }

  expect(noise).toEqual([]);
});

test('never lets a station cover the professor', async ({ page }) => {
  await ready(page);

  for (const id of STATIONS) {
    await goTo(page, id);
    const overlap = await page.evaluate(() => {
      const stage = document.querySelector('.stage');
      const panel = document.querySelector('.panel[data-active="true"]');
      if (!stage || !panel) return null;
      if (stage.getAttribute('data-mode') === 'stacked') return 0;
      const hand = {
        x: parseFloat(getComputedStyle(stage).getPropertyValue('--hand-x')),
        y: parseFloat(getComputedStyle(stage).getPropertyValue('--hand-y')),
      };
      const box = panel.getBoundingClientRect();
      const inside =
        hand.x > box.left && hand.x < box.right && hand.y > box.top && hand.y < box.bottom;
      return inside ? 1 : 0;
    });
    expect(overlap, `${id}: the card covers the gesture`).toBe(0);
  }
});

test('scrolls forward and back without losing the timeline', async ({ page }) => {
  await ready(page);
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );

  for (const fraction of [0.15, 0.4, 0.65, 0.9, 0.6, 0.3, 0]) {
    await page.evaluate((top) => { window.scrollTo({ top, behavior: 'instant' }); }, height * fraction);
    await page.waitForTimeout(450);
    const state = await page.evaluate(() => {
      const video = document.querySelector<HTMLVideoElement>('.film__video');
      return { time: video?.currentTime ?? -1, duration: video?.duration ?? 0 };
    });
    expect(state.time).toBeGreaterThanOrEqual(0);
    expect(state.time).toBeLessThanOrEqual(state.duration);
  }
});

test('reaches every station by keyboard and shows focus', async ({ page }) => {
  await ready(page);

  const stop = page.locator('.index__stop').first();
  await stop.focus();
  await expect(stop).toBeFocused();
  const outline = await stop.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');

  await page.keyboard.press('Enter');
  await expect(page.locator('.stage')).toHaveAttribute('data-station', 'prime');
});

test('opens and closes the notes drawer', async ({ page }) => {
  const noise = watchConsole(page);
  await ready(page);

  await page.locator('.notes__trigger').click();
  await expect(page.locator('.notes')).toHaveAttribute('data-open', 'true');
  await expect(page.locator('.notes__sheet')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('.notes')).toHaveAttribute('data-open', 'false');
  expect(noise).toEqual([]);
});

test('carries the whole lesson in text when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const noise = watchConsole(page);
  await ready(page);

  for (const id of STATIONS) {
    await goTo(page, id);
    const summary = page.locator(`.panel[data-station="${id}"] figcaption`);
    await expect(summary).not.toBeEmpty();
  }
  expect(noise).toEqual([]);
});

/**
 * The stacked layout has a permanent paper field below the film. Nothing may
 * leave it blank, and nothing may paint over what is written on it.
 */
test('shows the opening and the closing, whatever the layout', async ({ page }) => {
  await ready(page);

  const visible = async (selector: string): Promise<boolean> =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const box = el.getBoundingClientRect();
      if (box.width < 40 || box.height < 8) return false;
      const style = getComputedStyle(el);
      if (Number(style.opacity) < 0.5 || style.visibility === 'hidden') return false;

      // The piece is decorative and takes no pointer events, so hit testing is
      // enabled just long enough to ask what is stacked at this element's own
      // centre - then the stack is walked from the front until something with a
      // solid surface is reached. Anything the text sits behind hides it.
      const patch = document.createElement('style');
      patch.textContent = '.stage, .stage * { pointer-events: auto !important; }';
      document.head.append(patch);
      const stack = document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      patch.remove();

      const opaque = (node: Element): boolean => {
        const s = getComputedStyle(node);
        if (Number(s.opacity) < 0.9) return false;
        const bg = s.backgroundColor;
        const alpha = /rgba?\([^)]*?,\s*([\d.]+)\s*\)/.exec(bg);
        return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && Number(alpha?.[1] ?? 1) > 0.9;
      };

      for (const node of stack) {
        if (node === el || el.contains(node) || node.contains(el)) return true;
        if (opaque(node)) return false;
      }
      return false;
    }, selector);

  // Polled rather than sampled once: both ends arrive on an eased curve, and
  // under a parallel run the machine is not always prompt about it.
  await expect
    .poll(() => visible('.overture__subtitle'), { message: 'the opening is hidden' })
    .toBe(true);

  await page.evaluate(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
  });
  await expect
    .poll(() => visible('.coda__line'), { message: 'the closing is hidden' })
    .toBe(true);
});

/**
 * The reversibility claim, checked rather than assumed. Everything the stations
 * draw is derived from progress, so revisiting a station after hammering the
 * timeline must reproduce it exactly - including the Ulam spiral, which is the
 * one diagram painted imperatively onto a canvas and therefore the one that
 * could drift.
 */
test('returns every diagram to an identical state after a hammered reverse', async ({ page }) => {
  // Twelve settles and two full passes: long by nature, so it gets its own budget.
  test.setTimeout(150_000);
  await ready(page);

  /** Wait until the loop has genuinely come to rest, not merely paused. */
  const settle = async (id: (typeof STATIONS)[number]): Promise<void> => {
    await page.locator('.index__stop').nth(STATIONS.indexOf(id)).click();
    await expect(page.locator('.stage')).toHaveAttribute('data-station', id);
    await page.evaluate(() => { (window as unknown as { __sp?: string[] }).__sp = []; });
    await page.waitForFunction(
      () => {
        const layer = document.querySelector('.station-layer');
        if (!layer) return false;
        const history = (window as unknown as { __sp: string[] }).__sp;
        history.push(getComputedStyle(layer).getPropertyValue('--station-progress'));
        if (history.length > 4) history.shift();
        return history.length === 4 && new Set(history).size === 1;
      },
      null,
      { polling: 150 },
    );
  };

  const snapshot = async (): Promise<string> =>
    page.evaluate(() => {
      const active = document.querySelector('.panel[data-active="true"]');
      const canvas = active?.querySelector<HTMLCanvasElement>('.ulam__canvas');
      let ulam = 'none';
      if (canvas) {
        const pixels = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height).data;
        let hash = 2166136261;
        let ink = 0;
        for (let i = 3; i < (pixels?.length ?? 0); i += 4) {
          const alpha = pixels?.[i] ?? 0;
          if (alpha > 8) ink += 1;
          hash = Math.imul(hash ^ alpha, 16777619) >>> 0;
        }
        ulam = `${String(ink)}/${String(hash)}`;
      }
      const opacities = (selector: string): string =>
        [...(active?.querySelectorAll(selector) ?? [])]
          .map((el) => Math.round(Number(getComputedStyle(el).opacity) * 1000))
          .join(',');
      return [
        ulam,
        opacities('.sieve__strike'),
        opacities('.tree__node'),
        opacities('.primes__cell'),
        opacities('.euclid__step'),
      ].join(' | ');
    });

  const forward: Record<string, string> = {};
  for (const id of STATIONS) {
    await settle(id);
    forward[id] = await snapshot();
  }

  for (let pass = 0; pass < 2; pass += 1) {
    await page.evaluate(async () => {
      const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
      const max = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= max; y += 140) { window.scrollTo(0, y); await sleep(6); }
      for (let y = max; y >= 0; y -= 140) { window.scrollTo(0, y); await sleep(6); }
    });
  }

  for (const id of [...STATIONS].reverse()) {
    await settle(id);
    expect(await snapshot(), `${id} did not come back to the same state`).toBe(forward[id]);
  }
});

test('holds a composed frame at each station when motion is reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);

  for (const id of STATIONS) {
    await goTo(page, id);
    const phase = await page.evaluate(() => {
      const stage = document.querySelector('.stage');
      return { start: stage?.getAttribute('data-phase') ?? '' };
    });
    expect(phase.start).toBe('station');

    // Three points inside the same station must present the same frame.
    const frames = await page.evaluate(async () => {
      const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
      const video = document.querySelector<HTMLVideoElement>('.film__video');
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const here = window.scrollY;
      const out: number[] = [];
      for (const offset of [-0.012, 0, 0.012]) {
        window.scrollTo(0, Math.min(max, Math.max(0, here + max * offset)));
        await sleep(420);
        out.push(Math.round((video?.currentTime ?? 0) * 24));
      }
      return out;
    });
    expect(new Set(frames).size, `${id} scrubbed instead of holding: ${frames.join(',')}`).toBe(1);
  }
});

test('announces each number once, with its divisor count', async ({ page }) => {
  await ready(page);
  await goTo(page, 'prime');

  // The accessibility tree, not textContent: the visible numeral is hidden from
  // it precisely so the number is not announced twice.
  const grid = page.locator('.panel[data-station="prime"] .primes__grid');
  const tree = await grid.ariaSnapshot();

  expect(tree).toContain('1, 1 divisor.');
  expect(tree).toContain('2, 2 divisors, prime.');
  expect(tree).toContain('4, 3 divisors.');
  expect(tree, 'the numeral is being announced twice').not.toContain('11, 1 divisor');
  expect(tree, 'the numeral is being announced twice').not.toContain('22, 2 divisors');
});

/**
 * The film is driven by playing it only where seeking is measured to be too
 * expensive to scrub with. Everywhere a seek lands inside a frame - which is
 * every desktop - it must still be a scrubbed film and never a played one.
 */
test('scrubs rather than plays wherever seeking is cheap', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'the guarantee is about fast-seeking devices');
  await ready(page);

  const observed = await page.evaluate(async () => {
    const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
    const video = document.querySelector<HTMLVideoElement>('.film__video');
    let playing = 0;
    let samples = 0;
    const watch = setInterval(() => {
      samples += 1;
      if (video && !video.paused) playing += 1;
    }, 16);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (let y = 0; y <= max; y += 90) { window.scrollTo(0, y); await sleep(8); }
    await sleep(200);
    for (let y = max; y >= 0; y -= 90) { window.scrollTo(0, y); await sleep(8); }
    await sleep(200);

    clearInterval(watch);
    return { playing, samples, paused: video?.paused ?? true };
  });

  expect(observed.samples).toBeGreaterThan(50);
  expect(observed.playing, 'the film was played on a device that seeks quickly').toBe(0);
  expect(observed.paused).toBe(true);
});

test('ships no audio track and no horizontal scroll', async ({ page }) => {
  await ready(page);

  const audio = await page.evaluate(() => {
    const video = document.querySelector<HTMLVideoElement & { webkitAudioDecodedByteCount?: number }>(
      '.film__video',
    );
    return video?.webkitAudioDecodedByteCount ?? 0;
  });
  expect(audio).toBe(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
