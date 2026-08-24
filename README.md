# PRIME — A Short Walk Through Infinity

A scroll-driven exhibit about prime numbers. A mathematics professor walks a
university corridor and stops six times; each stop opens a station — definition,
sieve, infinity, pattern, factorisation, cryptography — and scroll position is
the only control. The whole piece lives in one cinematic frame: there is no
second section to scroll into, and no visible scrollbar.

Every diagram is computed, not drawn. The sieve really sieves, the Ulam spiral is
plotted from a real primality test, and the factor tree is derived from the
number it factors.

---

## Development

```bash
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b --noEmit` across app, tooling and e2e projects |
| `npm run lint` | ESLint, type-aware |
| `npm test` | Vitest — mathematics and timeline |
| `npm run test:e2e` | Playwright smoke tests against the production build |
| `npm run check` | Typecheck + lint + unit tests + build, in one gate |
| `npm run media` | Rebuild `public/media/` from `source/` |
| `npm run assets` | Rebuild brand, icon and social assets from `logo.png` |

`media` and `assets` need `ffmpeg` on the path. Their outputs are committed, so a
normal build never runs them.

Node 24 or newer.

---

## The film

Three generated 1280×720 / 24 fps clips arrive in `source/`. They are the source
of truth: the filenames and the prompts that produced them are not.

**Order.** Established by measurement, not by filename. Mean absolute luma
difference across each join is 5.3 and 6.0 — the same magnitude as an ordinary
adjacent frame during walking (4.3–5.3). Every other ordering measures 32–41.
The three clips are one continuous take, in the order shipped.

**One master, not three layers.** Because the joins are frame-continuous, the
clips are concatenated into a single 720-frame master. One decoder, one clock, no
crossfades to hide seams that are not there. Layering three elements would have
cost decoder memory and orchestration for no visible gain.

**Encode.** Benchmarked CRF 20/22/24 against GOP 6/8/12/24, scored with VMAF and
inspected at 2× on the professor's face and on chalk detail:

| | CRF 20 | CRF 22 | CRF 24 |
| --- | --- | --- | --- |
| VMAF (GOP 8) | 72.5 | 71.9 | 71.0 |
| Size (GOP 8) | 9.85 MB | 7.86 MB | 6.30 MB |

The source is already a compressed generative render with little high-frequency
detail, so quality is nearly flat across the range: CRF 20 → 24 costs 1.6 VMAF
and 36% of the file. CRF 22 sits at the knee and is indistinguishable from CRF 20
under 2× inspection.

GOP is the parameter that matters for scrubbing, not for quality. **GOP 8** — a
keyframe every third of a second, 90 in the master — keeps the worst-case seek to
seven inter-frames while costing 12% over GOP 12.

Shipped: H.264 High @ L4.0, `yuv420p`, CRF 22, GOP 8 fixed, scene-cut keyframes
off, faststart, **no audio stream**. 8.1 MB for 30 s. Audio is dropped at the
demux stage and the pipeline fails the build if `ffprobe` finds a track.

No upscaling. The originals are 720p and the delivery is 720p; on a 1440-wide
stage that is a 1.13× upscale, and inventing pixels would only cost bandwidth.

No separate mobile rendition either, and this one was settled on a real device
rather than in emulation. On Android Chrome a seek costs the same whatever the
picture is: 160 ms at 1280×720, 150 ms at 960×540, 149 ms at 640×360. The cost
is fixed overhead — reset, demux, decode — and does not shrink with the pixels,
so a smaller rendition buys nothing where it would have to help. Shortening the
GOP does not help either: a seek one frame away and a seek onto a keyframe
measure the same.

**Stations.** The six anchors were found by inspecting all 720 frames — contact
sheets, then per-frame strips through each gesture, then frame-difference energy
to locate the steadiest hold within it. None is a convenient fraction of a clip.

Where the footage offers a genuine stop, the anchor is the measured minimum of
its hold: stations 2, 4 and 5 sit at rank 0, 1 and 0 of their windows, in the
14th, 4th and 15th percentile of motion across the whole film. Stations 1 and 3
are gestures made *while walking* — there is no still moment in them — so those
anchors are the clearest pose within the hold rather than its quietest frame.
Gesture side, hand position and the professor's bounds are normalised film
coordinates in `src/experience/timeline/stations.ts`.

Station three is the one stop where he turns his head instead of pointing. What
he turns towards is a blackboard, so that station is a slate plate with an oak
frame and a chalk rail — colours sampled from the corridor's own boards — while
the other five are torn-edge paper. The material carries the difference, so the
type stays fully opaque.

---

## How it runs

**One timeline.** Scroll maps to a normalised progress, progress maps to a video
frame through a phase table (`timeline.ts`), and everything visible derives from
that number. Nothing is keyed on "has this played yet", which is why the walk
reads the same backwards as forwards.

**One loop.** A single `requestAnimationFrame` loop smooths progress, seeks the
video, and writes a handful of CSS custom properties. React is told only when
something discrete changes — the phase, the station, or the layout mode — which
is **12 times per pass**, once per phase boundary, and never per frame. Stations
animate from `--station-progress` in CSS.

**Properties are written per surface, not on the stage.** Custom properties
inherit, so writing one at the top of the tree marks every descendant for style
recalculation. With six diagrams mounted that was measured at 71% of all
main-thread work. Each component now binds its own root as the destination for
the values it reads (`useSurface`), so a per-frame write touches only its branch.
Measured over a full forward-and-back journey, emulated Pixel 7 at 6× CPU
throttling:

| | before | after |
| --- | --- | --- |
| Style recalculation | 13.8 s | **8.0 s** |
| Total main-thread task time | 19.4 s | **13.6 s** |
| Median frame | 33.3 ms (30 fps) | **16.7 ms (60 fps)** |
| Long tasks | 74 (5.0 s) | **56 (3.9 s)** |

At 4× throttling the same journey holds a 16.7 ms median with 7 long tasks;
unthrottled desktop reports none at all. No dropped video frames and no heap
growth in any profile.

**How the film is driven depends on what the device can do.** Scrubbing a film
means seeking it, and on a desktop a seek lands inside a frame, so that is what
happens. A phone is not the same machine: measured on a device, the same file
plays at 24 fps but answers only six seeks a second.

Two things follow. First, only one seek is ever in flight — a decoder still
working on the last request does not arrive sooner for being asked again, it
discards the work in progress and starts over. Asking every frame, as this used
to, left the element in `seeking` state 93% of the time and put six frames on
screen during a ten-second scroll. Second, where a seek is *measured* to be slow,
forward motion is driven by playing the film at a rate that converges on the
target instead of seeking to it. The engine times its own seeks and decides from
that, so no device is guessed at by name, and a machine that seeks quickly never
takes the playing path at all — there is a test for that.

Going backwards, landing on a station, reaching the closing frame and honouring
reduced motion all still seek: playback only runs forward, and precision matters
more than pace at a stop.

**The frame re-composes, it never rescales.** A station opens a card on the side
the professor gestures towards. The film keeps its scale and bleeds edge to edge;
what changes is where it is aimed. The pan brings the gesture to rest just clear
of the card's inner edge and is clamped so the picture still covers everything
the card does not. Card width is not a breakpoint — it is what is left once the
film has kept the span it needs, measured per station.

Below an aspect ratio of 1.18 the layout stacks: film above, sheet below, same
six stations, same diagrams, same copy.

**Reverse.** Diagrams unwind rather than replay: the sieve un-strikes in exactly
the order it struck, the Ulam spiral erases the marks that are leaving instead of
repainting itself, and the factor tree recombines. Nothing is keyed on having
already played.

**Accessibility.** The film is decorative; the lesson is text. Every diagram
carries a written equivalent, the index is keyboard-operable with visible focus,
nothing is conveyed by colour alone (primes are marked by weight, border style
and dot count as well as tint), and `prefers-reduced-motion` holds the film on
one composed frame for the whole of each station instead of scrubbing through
it — the walk between stations still follows the scroll, because freezing it
would teleport the professor rather than calm him. There is a no-JavaScript
fallback with the whole lesson in it.

---

## Deployment

Push to `main`. GitHub Actions typechecks, lints, runs unit tests, runs the
Playwright smoke suite against a production build, rebuilds with the Pages public
path, and deploys. Nothing ships if any step fails.

Set Pages to "GitHub Actions" in repository settings. The public path is derived
from the repository name, so project sites and user sites both work with no
configuration.

## Browser support

Chromium, Firefox and Safari, current versions, desktop and mobile. Uses
container queries, `dvh`, `color-mix()` and `clip-path` with SVG references.

## Credits

Film generated for this project. Mathematics implemented from primary
definitions; sources are listed in the piece under *Notes & sources*.
