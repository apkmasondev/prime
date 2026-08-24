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
