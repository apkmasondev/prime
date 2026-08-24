# Changelog

## Technical audit — 2026-08-24

A full pass over memory, performance, correctness and security. Measurements
were taken against the production build served by `vite preview`, with Chromium
via Playwright and CDP; mobile figures use the Pixel 7 device profile with CPU
throttling, matching the methodology already used in the README.

### Fixed

| Found | Why it mattered | Fix |
| --- | --- | --- |
| Station 1's `diagramSummary` still described 24 numbers after the grid was reduced to 18, and described primes as "marked with a filled disc" | The summary *is* the diagram for anyone using a screen reader. It described something that is no longer on screen. | Rewritten to match the diagram: 18 numbers, one mark per divisor, factor pairs on selection. `src/experience/timeline/stations.ts` |
| Every number in the prime grid was announced twice — "1" came out as "eleven", "2" as "twenty-two" | The visible numeral and the hidden description both carried the number, and accessible names concatenate. Numbers 1–18 were unreadable by screen reader. | The visible numeral is `aria-hidden`; the description keeps the number. Verified against the real accessibility tree, not `textContent`. `src/stations/PrimeDefinition.tsx` |
| The loader's effect depended on an `onReady` callback rebuilt on every render | Each re-render restarted the timer that caps how long the loader may hold the door, so the 7-second guarantee was not actually guaranteed. | `onReady` is now a stable `useCallback`. `src/experience/Experience.tsx` |
| `sieveStateAt`, `flattenTree` and `twinPrimes` were exported but never called by the experience | Dead API kept alive only by its own tests. Tree-shaken from the bundle, but still code to maintain and to read. | Removed. Their tests were rewritten to cover the property the sieve station actually depends on — that strikes only ever extend one fixed order, which is what makes reverse exact — and to walk the factor tree locally. |
| `RESULT.primes.includes(n)` ran a linear scan for each of 100 cells on every caption change | O(n·p) inside a render loop for a lookup that should be constant. | A `Set`, built once. `src/stations/Sieve.tsx` |
| README: "React renders when the station changes — six times in fourteen screens" | Measured 12 publishes per pass, not 6: React is told at every *phase* boundary, transits included. The architectural claim held; the number did not. | Corrected to the measured figure. |
| README: "Anchors sit on measured motion minima" | True for three of six. Stations 1 and 3 are gestures made while walking, and their anchors sit mid-window because the footage has no still moment there. | Corrected, with the measured ranks and percentiles. |
| README: reduced motion "settles the film on composed frames instead of scrubbing" | Accurate for stations; transits still follow the scroll, deliberately. | Corrected, with the reason. |

### Added

Three regression tests, each guarding something this audit had to verify by hand:

- **`returns every diagram to an identical state after a hammered reverse`** —
  drives two full passes plus reversals, then revisits every station and
  compares a content hash. The Ulam spiral is included by hashing its canvas
  pixels, since it is the one diagram painted imperatively and therefore the one
  that could drift.
- **`holds a composed frame at each station when motion is reduced`** — samples
  three scroll positions inside each station and asserts the presented frame
  does not change.
- **`announces each number once, with its divisor count`** — reads the
  accessibility tree, so the double-announcement above cannot come back.

### Verified, no change needed

- **No leaks.** Over 30 full journeys with forced collection at both ends: heap
  3.05 MB → 3.84 MB and flattening, live DOM constant at 353 elements,
  `JSEventListeners` constant at 229. Node count rises once as the six stations
  first mount, then holds at ~940.
- **Per-surface writes intact.** No code writes timeline properties to the stage
  element; `engine.ts` touches it only for `clientWidth/Height` and `dataset`.
- **Video matches the README.** H.264 High @ L4.0, `yuv420p`, 1280×720, 720
  frames, 30.000 s, 90 keyframes (GOP 8 exactly), `moov` before `mdat`, no audio
  stream. The build guard was checked by running it against a raw source clip,
  which still has audio: it fails, as documented.
- **Reverse is exact**, not merely similar — the Ulam canvas returns the
  identical pixel hash after hammering.
- **Mathematics.** Sieve, primality, factorisation and spiral geometry verified
  against known values and edge cases (0, 1, primes, prime powers, 2^10·3·5,
  999 983), including that the factor tree is deterministic across calls.
- **Stacking threshold.** 1.181 → side, 1.179 → stacked. Card width measured
  302–560 px across shapes: derived, not a breakpoint. The film covers the stage
  in every case.
- **No-JavaScript fallback** carries all six stations.
- **No secrets.** Scan over tracked files found only false positives (a GitHub
  permission name, the `js-tokens` package). `source/` does not reach `dist/`.

### Measurements

Full forward-and-back journey, production build. "README" is the table already
published there; "audit" is this run.

| Pixel 7, 6× CPU | README | Audit |
| --- | --- | --- |
| Style recalculation | 8.0 s | **8.2 s** |
| Total main-thread task time | 13.6 s | **13.9 s** |
| Median frame | 16.7 ms (60 fps) | **16.7 ms (60 fps)** |
| Long tasks | 56 (3.9 s) | **54 (4.0 s)** |
| Dropped video frames | 0 | **0** of 3 203 decoded |

| Pixel 7, 4× CPU | README | Audit |
| --- | --- | --- |
| Style recalculation | — | **3.5 s** |
| Total main-thread task time | — | **6.2 s** |
| Median frame | 16.7 ms | **16.7 ms (60 fps)** |
| Long tasks | 7 | **5 (0.3 s)** |
| Dropped video frames | 0 | **0** of 2 019 decoded |

| Desktop 1440, no throttling | README | Audit |
| --- | --- | --- |
| Style recalculation | — | **0.24 s** |
| Total main-thread task time | — | **0.62 s** |
| Median frame | 16.7 ms | **16.7 ms (60 fps)** |
| Long tasks | 0 | **0** |
| Dropped video frames | 0 | **0** of 845 decoded |

Every value is at or better than the published figures. The decision to ship one
video rendition stands: there are no dropped frames to recover at any throttle
level tested, so a second encode would buy nothing.

Network, Pixel 7 profile, cold cache:

| | Interactive | First seek | Transferred to interactive |
| --- | --- | --- | --- |
| No throttling | 254 ms | 52 ms | 0.45 MB |
| Fast 3G | 9.6 s | 47 ms | 0.45 MB |
| Slow 3G | 16.6 s | 5.2 s | 0.45 MB |

The 8.1 MB master is never a barrier to starting: it is fetched by range and the
loader releases on `readyState` plus a buffered share, so under a third of a
megabyte crosses the wire before the piece is interactive. On Slow 3G the wait is
the 390 kB of script, styles and fonts at 50 kB/s, and the first seek into an
unbuffered region is the one place the file size shows.

### Bundle

`dist` is 8.4 MB, of which 8.1 MB is the film. Code is 231 kB of JavaScript and
36 kB of CSS before compression, plus 123 kB of subset variable fonts. No unused
dependency and no unreferenced export outside the one kept deliberately for the
stage module's invariant tests.
