# Changelog

## The sieve on a phone — 2026-08-24

Reported from a device: the hundred-cell grid at station two was squeezed to the
point of being hard to read. Measuring it found three faults stacked on each
other.

**It was not square.** The cells carried `aspect-ratio: 1` and a minimum font
size, so ten rows could not shrink below their own text. When the card capped
the grid's width below that minimum, the width obeyed and the height did not: on
an iPhone 14 the grid came out **60 x 136** with 5 x 12 pixel cells. The square
is now stated on the grid itself, with explicit rows, and the numbers are sized
from the square so they shrink with it instead of setting a floor it has to grow
to satisfy.

**Both sides were computed, but not to the same number.** Writing
`min(100%, ...)` for `inline-size` and `block-size` does not give a square: a
percentage means the parent's width in one and its height in the other. The side
is now computed once, in container units, which are absolute in either property.

**And it had no room.** The grid is bounded by the shorter side of the figure,
and on a phone that was 111 px while 345 px of width sat unused. The film's share
of a stacked stage goes from 0.44 to 0.36, the card's padding tightens, and the
curiosity note — the one element here that is supplementary by design — gives up
its place below the diagram and is read in the notes drawer instead, where every
station's note already appears in full.

A fourth fault surfaced while fixing those: on a landscape phone the caption
wrapped to two lines and was clipped mid-glyph against the space reserved for it.
The aside is now dropped below the width where it would wrap, so one line is
always enough.

| Sieve grid | Before | After |
| --- | --- | --- |
| Pixel 7 | 157 px, 15 px cells, 8.3 px numerals | **294 px, 29 px cells, 13.1 px** |
| iPhone 14 | 60 x 136, oblong | **187 px square, 9.7 px** |
| 360 x 640 | 48 x 136, oblong | **173 px square, 9 px** |
| Landscape 844 x 390 | 120 px | **185 px** |
| Desktop 1440 | 350 px | **416 px** |

Every station gains from the same room: the figure on a Pixel 7 goes from 208 px
to 336 px, on an iPhone 14 from 111 px to 229 px. A test now holds the sieve
square, unclipped, and above a readable floor on both layouts.

## Acceptance pass — 2026-08-24

A final run against the live site, driven with real wheel and touch events
rather than `scrollTo`, so the compositor and passive-listener paths are
exercised the way a visitor exercises them.

### Fixed

**A viewport change moved the visitor to a different point in the walk.** The
scroll length is a function of the viewport height, so the same scroll position
means different progress after a resize. Resizing the window while reading a
station left the station entirely — 1440×810 on station 4 became no station at
1100×900, and a different one at 900×1000. The same mechanism applies on a
phone every time the address bar slides away and the dynamic viewport grows.

The engine now remembers the scroll length its current progress was read
against, and on a viewport change moves the scroll position to preserve the
progress instead of the pixels. Not while a finger is down, which would fight
the visitor's own momentum.

The first attempt at this compared the scroll length before and after
re-measuring, which never fired: by the time any resize listener runs the
document has already been re-laid-out, so it was comparing a value with itself.

### Verified

**Frame pacing**, live site, wheel-driven forward and back plus reversals, on a
GPU-accelerated browser:

| Viewport | Median | p95 | Frames over 50 ms | Long tasks | Dropped |
| --- | --- | --- | --- | --- | --- |
| 1366×768 | 16.7 ms (60 fps) | 16.8 ms | 1 / 493 | 0 | 0 |
| 1440×810 | 16.7 ms (60 fps) | 16.8 ms | 3 / 493 | 0 | 0 |
| 1920×1080 | 16.7 ms (60 fps) | 16.8 ms | 1 / 500 | 0 | 0 |
| 2560×1080 | 16.7 ms (60 fps) | 16.8 ms | 0 / 501 | 0 | 0 |
| Pixel 7 | 16.7 ms (60 fps) | 16.8 ms | 0 / 504 | 0 | 0 |
| iPhone 14 | 16.7 ms (60 fps) | 16.8 ms | 0 / 484 | 0 | 0 |

An earlier headless run reported 30 fps at 1920 and 2560. That was software
compositing in headless Chromium, not something a visitor meets: the same
viewports hold 60 fps with a GPU. Worth recording, because it is the kind of
number that would otherwise have been believed.

**Stations do not skip frames.** Creeping through each station and watching
every presented frame: median step one source frame, no frame ever goes
backwards while the scroll goes forwards, and the largest step is two frames.
On the Android device, where the film is driven by playing rather than seeking,
the same holds — and stopping dead at a station settles monotonically, with no
backward correction as playback hands over to the final seek. The timeline's
own easing keeps the target ahead of the film through the settle, so the
handover never has to reverse.

**Resting state at each station** on the device: paused, not seeking, on the
frame the timeline asked for. Clicking an index stop lands 0–6 frames from the
station's composed anchor, inside the hold window and by design — the phase is
built around the anchor, and landing mid-station is what leaves the diagram
half-built rather than finished.

**Also checked:** resize across the side/stacked boundary keeps the station and
the film covering the stage; browser zoom at 0.67 and 1.5 with no horizontal
overflow; keyboard reaching every station with a visible focus ring; cold load
with an empty cache at 0.3 s and under half a megabyte; no console output on
any profile; no dead code, unused export, or unread private member after the
video work.

## Mobile playback — 2026-08-24

Scrolling juddered on a real phone while being smooth on a desktop. Measured on
Android Chrome on a connected device, not in emulation: during a ten-second
scroll the engine asked for **83 seeks and got 6 frames on screen**, with the
video element in `seeking` state **93% of the time**. The main thread was
dragged down with it, to 9.9 rAF ticks a second.

### Cause

Two independent things, both invisible on a desktop.

A seek was issued on every animation frame. A decoder still working on the last
request does not arrive sooner for being asked again — it discards the work in
flight and starts over. On a desktop a seek finishes inside a frame, so asking
every frame looks free; on a phone it means the decoder never finishes anything.

And seeking is simply the expensive way to move a film on a phone. The same file
plays at 24 fps on the device but answers only about six seeks a second.

### What was ruled out, by measurement

A smaller rendition for mobile: seek cost is **fixed overhead, not pixel
throughput**. On the device, 1280×720 seeks in 160 ms, 960×540 in 150 ms,
640×360 in 149 ms. A shorter GOP: a seek one frame away and a seek landing on a
keyframe both measure ~190 ms. Neither lever touches the cost.

### Fix

| Change | Effect |
| --- | --- |
| Only one seek in flight — skip while `video.seeking`, the next frame asks again with a fresher target | Every seek now lands: seeks requested equals seeks completed equals frames presented |
| Seek targets quantised to source frames, and dropped when they name the frame already on screen | The film has 24 frames a second; asking for a time between two of them decoded the same picture at the price of a whole seek |
| Where a seek is *measured* to be slow, forward motion plays the film at a converging rate instead of seeking | Sequential decode instead of random access, which is what the device is good at |

The engine times its own seeks and chooses from that, so no device is
identified by name and a machine that seeks quickly never takes the playing
path. Going backwards, landing on a station, reaching the closing frame and
reduced motion all still seek.

### Measured on the device, full scroll of the piece

| | Before | Seeks serialised | Adaptive |
| --- | --- | --- | --- |
| Film frames presented | 0.6 /s | 4.6 /s | **35.4 /s** |
| Distinct frames shown | 6 | 44 | **340** |
| Seeks requested | 8.6 /s | 4.6 /s | **0.3 /s** |
| Time in `seeking` state | 93% | 94% | **3%** |
| rAF | 9.9 Hz | 16.8 Hz | **45.6 Hz** |

By scroll pattern, after the fix:

| Pattern | Frames presented | Distinct frames | rAF |
| --- | --- | --- | --- |
| Slow forward | 33.3 /s | 255 | 43 Hz |
| Fast flicks | 14.7 /s | 61 | 26.7 Hz |
| Forward then back | 8.3 /s | 57 | 16.5 Hz |
| Repeated reversals | 9.4 /s | 35 | 18.9 Hz |

Forward motion is now limited by the display rather than the decoder. Backwards
is still seek-bound, because no browser plays a video in reverse; on this
device that is about six frames a second, and proportionally better on hardware
that seeks faster than a software decoder in a virtual machine.

### Desktop is untouched

Verified rather than assumed: across a full journey at 1440×810, both
unthrottled and at 4× CPU, the film is **played 0% of the time** — the measured
seek cost never reaches the threshold, so the path taken is exactly the one it
was before, at 32.5 and 27 frames presented per second with no dropped frames.
A test holds that line — *chooses seeking or playing by what a seek actually
costs*. It measures the machine before it asserts anything, because the
guarantee is conditional on the machine: where a seek lands quickly the film
must be scrubbed and never played, and where it does not, playback must engage
and put frames on screen. A CI runner decoding in software takes the second
branch, which is how the first version of this test failed and taught the
distinction.

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

### Deployment

The site is served from a custom domain, `https://apkmason.dev/prime/`. The
workflow had been constructing the public URL as `<owner>.github.io/<repo>/`,
which reaches the site only through a redirect — fine for a browser, not
dependable for a social scraper fetching an Open Graph image. The public path
and absolute URL now come from `actions/configure-pages`, which reports where
the site is actually served from, and the page carries a canonical link and
`og:url`. Vite's base is normalised, since that action reports the path without
a trailing slash and Vite needs one.

Pages reports that domain's URL as `http://`, because HTTPS enforcement is not
recorded against it, so the first deploy stamped `og:image` and `og:url` over
http on a page that is served over https — mixed content, and something a
scraper may refuse. (The `canonical` link looked correct only because the edge
in front of the domain rewrites `href` attributes and leaves `content` alone,
which is what made the two disagree in the same document.) The build now forces
https on any non-local origin.

Every workflow action was one to three majors behind and has been updated:
checkout and setup-node to v7, upload-artifact to v7, upload-pages-artifact and
deploy-pages to v5. Gating was checked: the steps run in order, a failure fails
the job, and `deploy` depends on it, so nothing ships past a red gate.

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
