# PRIME — A Short Walk Through Infinity
## Production plan for AI coding agent

> **Project type:** cinematic, scroll-driven educational web experience  
> **Subject:** prime numbers — from first principles to deeper and surprising ideas  
> **Target:** GitHub Pages  
> **Primary media:** 3 generated professor/university corridor videos  
> **Quality bar:** portfolio / festival-grade interactive experience, 2026 standards  
> **Core principle:** one viewport, one coherent journey, zero generic filler

---

# 0. Mission

Build a polished, single-frame interactive educational experience titled:

# **PRIME**
### *A Short Walk Through Infinity*

A mathematics professor walks through a university corridor. During the walk he stops several times, looks or gestures toward the left/right side of the frame, and each stop becomes an educational station about prime numbers.

The experience must feel like a **curated interactive mathematical exhibition**, not like a landing page with a video background and cards placed on top.

The professor, the corridor, educational graphics, typography, motion, interaction, sound policy, performance and transitions must feel like one authored piece.

The user should leave the experience with a clear mental journey:

**definition → discovery → infinity → hidden patterns → factorization → cryptography**

The final result must be:
- visually memorable,
- educationally correct,
- extremely smooth,
- calm and elegant,
- fast to understand,
- beautiful on desktop and mobile,
- deployable to GitHub Pages,
- maintainable with no unnecessary technical debt.

---

# 1. Non-negotiable project DNA

These requirements are mandatory.

## 1.1 One-frame composition

The entire experience lives inside **one fixed visual stage**.

Do not build a traditional page made from vertically stacked sections.

The browser may have a long virtual scroll range, but visually the user remains inside one cinematic viewport while:
- the film timeline advances,
- the professor walks,
- stations appear,
- graphics animate,
- text changes,
- transitions occur.

Use:
- `100dvh`,
- safe-area awareness,
- stable responsive composition,
- no layout jumps.

The scroll distance is a controller for the experience, not visible page geometry.

---

## 1.2 Hide the scrollbar

Scrolling must work normally, but the scrollbar must never visually compete with the composition.

Support at least:
- Chromium,
- Safari,
- Firefox.

Do not disable scrolling itself.

---

## 1.3 Performance is a feature

The project must feel exceptionally smooth on both desktop and mobile.

Performance takes priority over:
- unnecessary visual effects,
- giant textures,
- framework complexity,
- excessive DOM,
- over-engineered transitions.

The browser UI should animate at display refresh rate even though the source films are 24 fps.

Avoid:
- React state updates every animation frame,
- expensive layout reads in the RAF loop,
- large blurred layers,
- multiple simultaneously decoding videos when not necessary,
- continuous canvas rendering when the current station is static,
- runtime-generated particle systems that do not add educational value.

---

## 1.4 No generic design

Do not add generic AI-generated:
- glassmorphism cards,
- random glowing orbs,
- decorative particle clouds,
- fake holograms,
- neon sci-fi grids,
- meaningless floating formulas,
- generic gradient blobs,
- stock dashboard UI.

Every visual object must support one of:
1. mathematical explanation,
2. spatial orientation,
3. cinematic atmosphere,
4. interaction feedback.

The aesthetic is **prestigious mathematics institute / curated academic exhibition**, not cyberpunk.

---

## 1.5 No technical debt

Use modern stable patterns appropriate for 2026.

No:
- abandoned dependencies,
- obsolete React patterns,
- deprecated APIs where a stable alternative exists,
- giant monolithic components,
- magic numbers scattered through the code,
- duplicated timeline logic,
- hardcoded asset paths throughout JSX,
- animation logic tied directly to component rerenders,
- untyped configuration objects.

All important timings, anchors, station metadata and asset positions must live in typed configuration.

---

# 2. Source video audit — required before implementation

There are three provided MP4 source clips.

Observed technical properties:

- **resolution:** 1280 × 720
- **frame rate:** 24 fps
- **duration:** ~10.005 s each
- **frames:** ~240 each
- **video codec:** H.264
- **pixel format:** yuv420p
- **audio:** AAC present in originals

The audio from every original video must be removed.

## Important

Do **not** assume that filenames describe chronological order correctly.

Before writing the final timeline:

1. inspect all three films,
2. generate contact sheets or frame strips,
3. inspect their beginning and ending frames,
4. identify every clear stop/gesture,
5. determine chronological continuity visually,
6. identify the final clip by the professor's conclusive stationary ending,
7. determine the actual gesture side for every station,
8. store the resolved order in project configuration.

Do not blindly reuse timing values from the generation prompts.

The **finished videos are the source of truth**.

---

# 3. Video processing strategy

The agent is responsible for finding the best quality/performance ratio.

Do not simply re-encode to arbitrary settings.

## 3.1 Remove audio

All delivery video variants must contain **no audio stream**.

The visual experience should not depend on the generated soundtrack or room sound present in Omni output.

If a separate curated ambient soundtrack is added later, it must be handled independently.

---

## 3.2 Do not upscale by default

The originals are 1280×720.

Do not convert them to 1920×1080 merely to claim higher resolution.

Upscaling is allowed only if:
- visual testing proves a meaningful improvement,
- file size/decode cost remains justified.

Default assumption:
**native 720p is preferable.**

---

## 3.3 Benchmark encodes

Create a small reproducible encoding benchmark.

At minimum test sensible H.264 variants around:

- CRF 20
- CRF 22
- CRF 24

and short GOP candidates around:

- GOP 6
- GOP 8
- GOP 12

The exact final values must be selected from measurements, not preference.

Useful baseline characteristics:
- H.264
- `yuv420p`
- fast-start MP4
- no audio
- fixed predictable keyframe cadence
- scene-cut keyframes disabled if they cause unstable scrub behavior
- web-safe profile/level

Test whether a separate mobile resolution, for example around 960×540, materially improves real mobile smoothness without visibly harming quality.

Do not create a mobile encode just because the plan mentions one. Create it only if measurements justify it.

---

## 3.4 What to measure

For each promising encode measure:

- total file size,
- seek responsiveness,
- number of visible decode stalls,
- initial startup time,
- quality around the professor's face/hands,
- quality of blackboard detail,
- banding,
- motion artifacts,
- behavior during fast scroll direction changes,
- memory use,
- mobile decoding behavior.

Prefer an encode that remains visually excellent during motion rather than one that wins only on file size.

Document the final choice briefly in `README.md`.

---

# 4. One master video vs layered clips

The agent must test both approaches.

## Option A — one concatenated master timeline

If the clip boundaries are visually coherent:
- remove audio,
- normalize streams,
- concatenate into one ~30 s master,
- preserve as much source quality as practical,
- use one video decoder for the main experience.

Advantages:
- simpler seeking,
- one continuous clock,
- lower orchestration complexity,
- potentially smoother mobile performance.

## Option B — 3 fullscreen video layers

If cuts between clips reveal changes in:
- professor scale,
- corridor alignment,
- lighting,
- camera position,
- cadence,

use layered video elements and hide transitions with a short controlled crossfade.

Do not keep all three videos aggressively decoding forever.

Preload intelligently:
- current clip,
- next required clip,
- release/unload unnecessary media if beneficial.

## Decision rule

Choose the solution that looks **more continuous and performs better**.

Do not choose concatenation merely because it is architecturally cleaner.
Do not choose crossfades merely because previous projects used them.

The footage decides.

---

# 5. Timeline architecture

Create one deterministic master timeline in normalized coordinates:

```ts
type Progress = number; // 0..1
```

Map scroll position to target progress.

Separate:
- **input target progress**
from
- **rendered/smoothed progress**.

Use a single RAF-driven render loop.

Do not let scroll events directly perform expensive rendering work.

A good initial tuning reference is:
- short inertial smoothing around ~140–160 ms,
- bounded maximum seek jump per update,
- avoid forcing `currentTime` changes when the requested difference is negligible.

However:
**benchmark and tune against these exact films.**

The final engine must feel immediate enough that the user never feels disconnected from scroll input.

---

# 6. Video synchronization

Use modern media APIs where supported.

Strongly consider:
- `requestVideoFrameCallback()` for observing presented video frames,
- `requestAnimationFrame()` for UI,
- passive input listeners,
- normalized timeline state outside React render churn.

Do not chase exact frames by repeatedly spamming `video.currentTime` with tiny changes every RAF.

Implement:
- seek threshold,
- target clamping,
- frame-aware settling near station anchors,
- gentle snapping only when it improves reading.

When the user reaches a station, the timeline may subtly settle onto the best stable gesture frame.

The interaction must never feel like hard page snapping.

---

# 7. Station extraction workflow

There are **6 educational stations**.

The agent must inspect the videos frame by frame and choose the best visual anchor for each stop.

For every station record:

```ts
{
  id,
  videoId,
  anchorTime,
  anchorFrame,
  gesture,
  side,
  professorBounds?,
  overlaySafeZone,
  enterRange,
  holdRange,
  exitRange
}
```

Possible gesture values:
- `point-left`
- `point-right`
- `look-left`
- `look-right`
- `present`
- `neutral`

## Anchor selection criteria

Choose a frame where:
- professor is genuinely stationary,
- hand pose is natural,
- fingers are visually stable,
- head direction is obvious,
- body is not mid-step,
- there is useful negative space for the educational visual,
- there is minimal motion blur.

Do not choose a frame simply because it is mathematically halfway through a clip.

---

# 8. Educational story

The experience should be understandable by a curious general audience.

Do not assume advanced mathematics.

Every station gets:
- station number,
- short title,
- one core statement,
- one visual explanation,
- optionally one compact curiosity/fact.

Avoid paragraphs.

The user should understand the main idea in a few seconds.

---

# 9. Station 01 — What is a prime?

## Core idea

A prime number is an integer greater than 1 with exactly two positive divisors:
- 1,
- itself.

Examples:
**2, 3, 5, 7, 11, 13...**

Important:
- **1 is not prime.**
- **2 is the only even prime.**

## Primary asset

Create a precise custom interactive divisibility visual.

Recommended composition:
- row/grid of integers,
- prime numbers remain crisp/prominent,
- composite numbers reveal factor pairs,
- number `2` gets a subtle special treatment,
- number `1` is clearly separated from the prime set.

Do not rely only on color.

Use:
- shape,
- weight,
- line treatment,
- labels,
- spatial grouping.

## Micro-interaction

Desktop:
hover/tap a number to reveal its divisor structure.

Mobile:
tap only.

Keep it lightweight.

---

# 10. Station 02 — The Sieve of Eratosthenes

## Core idea

A simple ancient algorithm finds primes by repeatedly removing multiples.

## Primary asset

Build the Sieve of Eratosthenes **programmatically**, not as an AI-generated bitmap.

Suggested range:
**1–100**

Animate the concept:
1. start with the grid,
2. choose 2,
3. eliminate multiples of 2,
4. choose 3,
5. eliminate multiples of 3,
6. continue enough to make the rule obvious,
7. reveal remaining primes.

The animation should respond to station progress.

Do not run an infinite animation loop.

## Educational detail

Explain in one sentence why sieving only needs to continue through factors up to the square root of the limit.

Only include this if it remains visually understandable.

---

# 11. Station 03 — There is no final prime

## Core idea

Euclid showed more than 2,000 years ago that prime numbers never end.

## Visual proof

Use a deliberately simplified visual version of the classic argument.

Example structure:

```text
Assume we had every prime:
p₁, p₂, …, pₙ

Build:
N = p₁ × p₂ × … × pₙ + 1
```

Then visually show:

`N` leaves remainder `1` when divided by every prime in the supposed complete list.

Therefore:
- either `N` is prime,
- or it has a prime factor not in the list.

Either way, the list was incomplete.

## Primary asset

Create this as precise HTML/SVG/math typography.

Do **not** use image generation for equations.

The visual should feel like a beautiful mathematical exhibit:
- minimal,
- spacious,
- stepwise,
- readable.

This station can be calmer than the others.

It is a conceptual pause.

---

# 12. Station 04 — Patterns inside apparent randomness

## Core idea

Primes become less frequent as numbers grow, yet their distribution contains surprising structure.

## Primary visual: Ulam spiral

Generate a real Ulam spiral algorithmically.

Do not fake it.

Build:
- integer spiral,
- prime test,
- prime marks,
- optional progressive reveal.

The striking diagonal structures should emerge naturally from correct data.

## Optional secondary fact

Use exactly one short curiosity, for example:

**Twin primes** are pairs such as:
`(11, 13)` or `(17, 19)`.

It is still unknown whether infinitely many twin-prime pairs exist.

If this fact is shown, label it clearly as an **open problem**, not a theorem.

## Optional deeper hint

A tiny secondary line may mention that around large `n`, primes occur with rough density related to `1 / ln(n)`.

Do not turn this station into a lecture on the Prime Number Theorem.

---

# 13. Station 05 — The atoms of arithmetic

## Core idea

Every integer greater than 1 can be expressed as a product of primes, uniquely apart from order.

This is the Fundamental Theorem of Arithmetic.

Example:

`84 = 2 × 2 × 3 × 7`

## Primary asset

Build an elegant factor tree.

Allow a number to:
- appear whole,
- split into factors,
- continue splitting,
- resolve into prime leaves.

Use one primary example.
Optional tiny secondary examples are acceptable.

## Visual metaphor

The phrase:

### **Primes are the atoms of arithmetic.**

may be used as an interpretive line, but make clear through the actual diagram what it means.

---

# 14. Station 06 — Why primes still matter

## Core idea

Prime numbers are not only abstract mathematics.

They play an important role in classic public-key cryptography, especially RSA.

## Correct simplified explanation

Show:

1. choose two very large primes `p` and `q`,
2. multiply them:
   `n = p × q`,
3. multiplication is easy,
4. recovering the original factors from a sufficiently large product is computationally hard with classical methods at practical cryptographic sizes.

Do not claim:
- that all internet security is RSA,
- that all modern cryptography depends on primes,
- that prime factorization is the basis of every encryption system.

Preferred wording:

> **Large primes power classic public-key systems such as RSA.**

If modern context is mentioned, do it accurately and briefly.

## Primary asset

A clean vector "two primes → large composite → key/security" diagram.

Avoid cliché padlock stock art as the main educational visual.

If a lock symbol exists, it is only a secondary cue.

---

# 15. Outro

The professor's final stationary pose should become the closing composition.

Do not immediately cover him with a large card.

Let the scene breathe.

Recommended outro:

# **PRIME NUMBERS**
## **Simple to define. Impossible to exhaust.**

Possible secondary line:

**The sequence never ends. Our walk does.**

Keep the final frame calm.

No fade to generic black unless it materially improves the piece.

---

# 16. Content accuracy

Mathematical correctness is mandatory.

Before shipping:
- verify definitions,
- verify examples,
- verify the Euclid argument,
- verify Ulam spiral output,
- verify factorization examples,
- verify cryptography wording,
- verify any historical attribution,
- verify any claim marked as an open problem.

Prefer respected mathematical/educational sources.

If a claim cannot be confidently verified, remove it.

Do not let generated illustrations contain fake formulas.

---

# 17. Asset strategy

The agent is responsible for creating all required project assets.

However, choose the correct creation method.

## 17.1 Deterministic assets — required

These should be generated with code/SVG/Canvas/HTML:
- prime number grid,
- divisor diagrams,
- sieve,
- Euclid proof,
- Ulam spiral,
- factorization tree,
- RSA concept diagram,
- progress marks,
- line icons,
- favicon geometry.

Mathematics must be data-driven and exact.

## 17.2 Raster/generated images — optional

Only generate raster images when they add atmosphere that cannot be achieved more elegantly with the filmed corridor and vector work.

Possible uses:
- subtle archival paper detail,
- academic illustration,
- restrained exhibit texture,
- OG/social preview composition.

Do not generate random visual filler.

Compress generated raster images to:
- AVIF and/or WebP where appropriate,
- with dimensions matching actual display needs.

Never ship giant source PNGs when they are unnecessary.

---

# 18. Visual identity

The video already defines the world.

Design around it.

## Suggested visual language

- warm academic whites,
- limestone / paper tones,
- graphite,
- charcoal,
- blackboard gray,
- restrained metallic detail,
- one subtle accent if needed.

Do not make color the only carrier of meaning.

Typography and line structure should carry hierarchy.

## Tone

Think:
- mathematics department,
- museum label,
- university archive,
- precision instrument,
- editorial science publication.

Not:
- hacker terminal,
- crypto trading site,
- sci-fi laboratory.

---

# 19. Typography

Use a high-quality, performant font setup.

Prefer:
- one strong sans-serif family,
- optionally one complementary serif for mathematical/editorial moments.

Do not load five font families.

Self-host only if licensing and repository policy allow it.
Otherwise use a robust web-safe or properly licensed web-font strategy.

Subsetting is encouraged if practical.

Use:
- `font-display: swap`,
- clear numerical glyphs,
- proper superscripts/subscripts where needed,
- real mathematical symbols rather than improvised ASCII when appropriate.

---

# 20. Responsive overlay geometry

Educational assets must visually connect to where the professor points/looks.

Do not position them with arbitrary pixels.

For each station derive normalized anchor geometry from the video:

```ts
x: 0..1
y: 0..1
```

Use the rendered video's actual object-fit transformation to map source coordinates into screen coordinates.

The asset must remain aligned when:
- viewport width changes,
- viewport height changes,
- mobile rotates,
- browser UI changes available viewport height.

If the video uses `object-fit: cover`, account for cropping mathematically.

Do not "eyeball" separate desktop/mobile positions.

---

# 21. Safe zones

On every station calculate:
- professor bounding zone,
- gesture target side,
- text safe zone,
- diagram safe zone.

Do not place educational text over:
- face,
- hands,
- pointing arm,
- high-detail moving background.

Use corridor negative space.

When the available side becomes too narrow on mobile:
- simplify the asset,
- reduce secondary text,
- shift to an anchored lower panel only if necessary.

Do not simply scale desktop UI to 50%.

---

# 22. Desktop interaction

Primary interaction:
**scroll**

Optional station interactions:
- hover number,
- hover factor,
- hover Ulam point,
- pointer-follow detail,
- click/tap to expand a small explanation.

Hover effects must never be required for comprehension.

Use pointer capabilities detection.

Avoid ornamental cursor effects that add latency.

---

# 23. Mobile interaction

Mobile quality is first-class.

Test touch scrolling with:
- slow drags,
- quick flicks,
- reversal of direction,
- interrupted scroll,
- address-bar expansion/collapse,
- portrait mode,
- landscape mode where practical.

Use:
- `100dvh`,
- safe-area insets,
- `playsinline`,
- touch-friendly hit areas,
- no hover dependency.

Do not block native scroll physics.

## Android emulator

If an Android emulator is available, use it as part of QA.

Test at least one realistic modern phone profile in Chrome:
- portrait,
- touch input,
- multiple DPR settings if convenient,
- performance throttling if useful.

The emulator is supplemental.
Do not treat emulator results as proof of real hardware decoder performance.

Also use browser device emulation and any available physical-device testing.

---

# 24. Progressive enhancement / fallback

If measured mobile video seeking is unstable on a device class, degrade gracefully.

Possible fallback:
- slightly stronger station snapping,
- lower resolution media,
- reduced overlay animation complexity,
- simplified optional interactions.

Do **not** replace the experience with an unrelated static mobile page unless absolutely necessary.

The story should remain the same.

---

# 25. Motion language

Motion should be:
- restrained,
- precise,
- physical,
- synchronized to the professor.

Preferred:
- opacity,
- transform,
- mask/reveal,
- line drawing,
- number decomposition,
- grid elimination,
- diagram construction.

Avoid:
- bounce,
- overshoot for everything,
- random rotations,
- elastic UI,
- unnecessary 3D transforms.

When a station enters:
1. professor settles,
2. target line/marker appears,
3. visual explanation resolves,
4. text enters last.

When leaving:
reverse or dissolve cleanly without cluttering the next station.

---

# 26. Reduced motion

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Provide a meaningful alternate experience.

At minimum:
- remove inertial decorative transitions,
- reduce animated diagrams,
- preserve readable station navigation,
- avoid fast scrubbing.

Do not hide content from reduced-motion users.

---

# 27. Accessibility

Target strong WCAG-oriented implementation.

Requirements:
- semantic text,
- keyboard-accessible interactive controls,
- visible focus states,
- sufficient contrast,
- no color-only meaning,
- meaningful button labels,
- `aria` only where necessary and correct,
- reduced-motion support,
- readable font sizes,
- touch targets appropriate for mobile.

Educational diagrams should have concise textual equivalents.

The film itself is decorative/narrative context; the mathematical lesson must remain understandable through accessible text.

---

# 28. Loader

The experience needs a loader because first-frame confidence matters.

Do not show a generic spinner.

Create a tiny project-specific loader, for example:
- sequence of primes appearing,
- composite numbers being removed,
- a minimal `2 · 3 · 5 · 7 · 11` progression.

Loader must:
- be lightweight,
- report meaningful readiness,
- disappear smoothly,
- never trap the user if one optional asset fails.

Start when enough media is ready for a stable first interaction, not only after every asset in the project downloads.

---

# 29. Intro

The first seconds should establish the project before station 01 without feeling like a separate hero section.

Suggested hierarchy:

**PRIME**

*A Short Walk Through Infinity*

then small prompt:

**Scroll to begin**

As the user starts:
- title clears,
- professor journey takes over,
- station counter appears subtly.

Do not place a giant CTA button.

---

# 30. Progress UI

Provide a subtle 6-step progress system.

Example:
`01  02  03  04  05  06`

or a thin academic-index style line.

It should communicate:
- current station,
- approximate progress,
- not dominate the frame.

Optional:
allow clicking/tapping station markers to move to that anchor.

If implemented:
- smooth and deterministic,
- keyboard accessible,
- update URL hash only if it adds real value.

Avoid a full router.

---

# 31. Sources UI

Add a small unobtrusive **Sources** control.

Do not clutter every station with citation text.

A lightweight overlay/drawer can list:
- definition/reference source,
- Euclid/infinite primes source,
- Ulam spiral reference,
- fundamental theorem reference,
- RSA reference.

The main story remains cinematic.
The supporting material remains verifiable.

---

# 32. Architecture recommendation

Use the lightest modern stack that supports the requirements.

Recommended default:

- **React**
- **TypeScript**
- **Vite**
- modern CSS
- minimal dependencies

Three.js / R3F is **not required** unless a specific asset genuinely benefits from 3D.

Do not introduce WebGL merely to make the stack sound impressive.

The Ulam spiral and mathematical diagrams are likely better served by:
- SVG,
- Canvas,
- DOM,
depending on benchmarked complexity.

---

# 33. Suggested code structure

Example:

```text
src/
  app/
    App.tsx
  experience/
    Experience.tsx
    timeline/
      timeline.config.ts
      timeline.engine.ts
      scroll.controller.ts
      video.controller.ts
      station.types.ts
  components/
    VideoStage/
    Intro/
    Progress/
    Loader/
    Sources/
    StationLayer/
  stations/
    prime-definition/
    sieve/
    infinity/
    ulam/
    factorization/
    cryptography/
  math/
    primes.ts
    sieve.ts
    factorization.ts
    ulam.ts
  hooks/
  styles/
  assets/
```

Keep mathematical algorithms separate from presentation.

Keep timeline mechanics separate from station content.

---

# 34. Prime utilities

Write tested deterministic utilities for:
- `isPrime(n)`
- `sieve(limit)`
- `primeFactors(n)`
- Ulam spiral coordinate generation

Do not hardcode a list of hundreds of primes when the algorithm is trivial and testable.

Use unit tests for mathematical helpers.

Edge cases must include:
- negative values if accepted by API,
- 0,
- 1,
- 2,
- even composites,
- perfect squares,
- larger known primes.

---

# 35. State management

Do not add Redux/Zustand/etc. unless a measurable complexity actually requires it.

Likely sufficient:
- local React state for UI modes,
- refs/external small controller for high-frequency timeline state,
- typed station configuration.

High-frequency progress must not cause whole-app rerenders.

---

# 36. CSS / rendering performance

Prefer animation of:
- `transform`,
- `opacity`.

Use `will-change` sparingly and remove it where appropriate.

Avoid permanent GPU promotion of many layers.

Avoid huge `backdrop-filter` areas.

Avoid heavy blur over 100dvh video.

Use containment where it genuinely improves rendering.

Check compositor behavior in DevTools.

---

# 37. Media loading

Use:
- hashed production assets,
- `preload` intentionally,
- `playsinline`,
- poster/first frame where useful,
- lazy loading for later noncritical raster assets.

Do not download every optional asset before first paint.

At the same time, preload enough of the next video segment to avoid a boundary stall.

---

# 38. First paint / flash prevention

Never show:
- an unstyled professor video,
- white flash,
- black flash between clips,
- incorrectly scaled media,
- content jumping after font load.

Define:
- stable background,
- stable stage dimensions,
- first-frame poster or controlled video readiness,
- loader transition.

---

# 39. Favicon and identity assets

A custom favicon is mandatory.

Do not use:
- Vite favicon,
- React logo,
- placeholder icon.

Create a small distinctive SVG mark related to prime numbers.

Possible direction:
- a minimal prime-mark symbol combined with `2`,
- a compact grid with only prime positions retained,
- a typographic `P′`,
- abstract divisor structure.

It must still read at 16×16.

Provide:
- `favicon.svg`,
- appropriate PNG fallback if needed,
- Apple touch icon if useful.

---

# 40. Metadata

Set polished metadata:

- `<title>`
- description
- theme color if appropriate
- Open Graph title
- Open Graph description
- Open Graph image
- Twitter/social metadata where useful
- canonical strategy appropriate to final deployment

Suggested title:

**PRIME — A Short Walk Through Infinity**

Suggested description:

**An interactive journey through prime numbers — from simple divisibility to infinity, hidden patterns, factorization and cryptography.**

Generate an original OG preview asset.

---

# 41. GitHub Pages

The project must deploy cleanly through GitHub Actions.

Requirements:
- Node **24** unless the current supported ecosystem requires a newer stable baseline,
- reproducible lockfile,
- clean production build,
- GitHub Pages artifact upload,
- Pages deploy action,
- no manual copy step,
- no fragile branch hacks.

Do not assume root-domain hosting.

Configure Vite asset base so the project can work as a GitHub Pages project site.

Avoid client-side routes that require server fallback.

A one-page experience does not need React Router.

---

# 42. CI quality gate

Before deploy, GitHub Actions should run at least:

1. install with lockfile,
2. typecheck,
3. lint,
4. tests,
5. production build,
6. deploy only if previous steps pass.

Do not deploy broken code.

If Playwright tests are reasonably lightweight, add a smoke test.

---

# 43. Testing

## Unit tests

Test:
- prime detection,
- sieve results,
- factorization,
- Ulam coordinate generation,
- progress → time mapping,
- station anchor lookup.

## Interaction tests

Verify:
- station transitions,
- jumping between progress markers if enabled,
- sources overlay,
- loader release,
- reduced motion.

## Browser smoke tests

At minimum:
- Chromium desktop,
- mobile Chromium profile.

If available:
- Safari/WebKit,
- Firefox.

---

# 44. Visual regression checkpoints

Capture screenshots at:
- intro,
- all 6 station anchors,
- outro,
- desktop 16:9,
- tall mobile portrait,
- narrow mobile,
- at least one wide desktop ratio.

Compare:
- overlay/gesture alignment,
- clipping,
- typography,
- professor visibility,
- asset readability.

Do not ship if any station covers the professor's face or hand.

---

# 45. Performance targets

Treat these as engineering targets, not marketing claims.

Aim for:
- no persistent long tasks during scroll,
- no visible playback/seek stalls on target devices,
- low layout shift,
- responsive interaction,
- stable 60 Hz UI motion where hardware permits,
- minimal memory growth after repeated forward/backward scrolling.

Profile the actual production build.

Do not judge performance from Vite dev mode.

Use:
- Chrome Performance panel,
- rendering FPS tools,
- memory inspection,
- Lighthouse as a supporting signal,
- manual eyes-on scroll testing.

---

# 46. Mobile stress tests

Test:
- 10 repeated fast full-journey swipes,
- rapid direction reversals,
- stop exactly on each station,
- background → foreground return,
- orientation change if supported,
- low-power/performance throttling if available,
- page reload mid-cache,
- cold cache,
- warm cache.

Watch for:
- decoder crashes,
- black video frames,
- frozen professor,
- overlay desync,
- skipped assets,
- scroll lock,
- runaway memory.

---

# 47. Desktop stress tests

Test:
- mouse wheel,
- high-resolution trackpad,
- PageUp/PageDown if supported,
- touchpad rapid scrub,
- resizing during station,
- browser zoom,
- returning backward through all stations.

The reverse journey must look intentional.

Do not design only for forward scroll.

---

# 48. Direction reversal

Every station animation must handle reverse progress.

No one-way timeline assumptions.

If the user scrolls backward:
- sieve reconstructs,
- factor tree recombines,
- Ulam reveal reverses cleanly,
- text exits in correct order,
- no orphaned layers remain.

Timeline state must be derived from progress, not from "animation already played" flags.

---

# 49. Content density rule

Never show all facts at once.

Each station:
- one main title,
- one explanation,
- one central visual,
- optionally one curiosity.

If a station starts needing a paragraph and three diagrams, cut content.

This is a short guided walk, not a mathematics textbook.

---

# 50. Tone of copy

Copy should be:
- intelligent,
- simple,
- confident,
- short,
- non-patronizing.

Avoid:
- "Did you know?"
- "Amazing!"
- "Mind-blowing!"
- exaggerated educational gamification.

Let the mathematics provide the surprise.

---

# 51. Suggested station copy

These are starting points, not untouchable final copy.

## 01 — PRIME
**Exactly two divisors.**  
A prime is greater than 1 and divisible only by 1 and itself.

Micro fact:
**2 is the only even prime.**

## 02 — SIEVE
**Remove the multiples. Keep what survives.**  
An ancient algorithm reveals primes by elimination.

## 03 — INFINITY
**There can never be a last prime.**  
Any supposedly complete list can be used to construct a number that escapes it.

## 04 — PATTERN
**Irregular does not mean structureless.**  
Arrange integers in a spiral and primes form unexpected diagonal patterns.

Micro fact:
**Whether infinitely many twin primes exist is still unknown.**

## 05 — FACTORS
**Every whole number is built from primes.**  
Prime factorization is unique apart from order.

## 06 — CRYPTOGRAPHY
**Easy to multiply. Hard to undo.**  
Large primes power classic public-key systems such as RSA.

---

# 52. Station visual rhythm

Do not repeat the same card animation six times.

Suggested variation:

01 — numbers organize / divisors connect  
02 — grid eliminates  
03 — proof constructs in steps  
04 — spiral grows from center  
05 — number splits into factor tree  
06 — two prime blocks combine into one large modulus diagram

This gives each stop a distinct visual identity while remaining inside one design system.

---

# 53. Connection between professor and asset

A subtle line/marker may originate near the professor's gesture direction and lead toward the station asset.

It must:
- never touch the hand incorrectly,
- never pretend to be physically emitted from the finger,
- remain editorial, not holographic.

For head-look stations, use a calmer spatial relationship rather than a literal pointer line.

---

# 54. Video imperfections

Do not overreact to tiny generative inconsistencies.

If a clip contains a minor background inconsistency:
- hide it through composition,
- choose a better frame,
- use a subtle transition,
- do not build a giant effect solely to mask it.

If a gesture has a single bad hand frame:
- avoid anchoring on that frame,
- settle on the clean hold.

Never use AI-generated correction frames unless genuinely necessary and continuity can be preserved.

---

# 55. Final video edge handling

The third/final clip ends with the professor stationary.

Use this deliberately.

At final progress:
- video stops on the best composed stationary frame,
- no loop,
- no accidental restart,
- no black end frame,
- outro enters around him.

Clamp seeking slightly before container duration if needed to avoid decoder end-frame issues.

---

# 56. No source audio

Original AAC tracks must not ship.

Verify final public media with `ffprobe`.

There should be no hidden audio stream.

Do not merely set volume to zero.

Actually strip the audio stream.

---

# 57. Repository hygiene

Repository must contain only purposeful files.

Do not commit:
- raw temporary frame dumps,
- redundant encoding candidates,
- huge source exports unless explicitly required,
- local debug logs,
- emulator captures not used in documentation,
- `.DS_Store`,
- build output unless deployment strategy requires it.

Keep original source video handling documented.

---

# 58. Documentation

Create a concise but useful `README.md` containing:

- project concept,
- development commands,
- production build,
- deployment,
- media processing summary,
- chosen video encoding parameters,
- browser support,
- major performance decisions,
- source attribution if required.

Do not dump this entire implementation plan into README.

README is for maintaining the finished project.

---

# 59. Scripts

Provide predictable scripts, for example:

```json
{
  "dev": "...",
  "build": "...",
  "preview": "...",
  "typecheck": "...",
  "lint": "...",
  "test": "...",
  "check": "..."
}
```

`check` should provide one local quality gate before pushing.

---

# 60. Console quality

Production console must be clean.

No:
- React warnings,
- failed asset requests,
- autoplay warnings caused by incorrect setup,
- uncaught promise rejections,
- hydration warnings,
- debug logs.

---

# 61. Security / dependency quality

Use the smallest reasonable dependency set.

Run appropriate package audit checks, but interpret results technically rather than blindly.

Do not add packages for trivial utilities.

No secrets belong in the frontend repository.

No API key should be required for the finished static experience.

---

# 62. Final QA checklist

Before calling the project finished:

- [ ] three source videos inspected manually
- [ ] chronological clip order verified visually
- [ ] all source audio removed from delivery media
- [ ] encode benchmark performed
- [ ] final media choice documented
- [ ] clip-boundary strategy chosen by visual/performance evidence
- [ ] 6 true gesture anchor frames extracted
- [ ] station overlays align with professor gestures
- [ ] all math generated deterministically
- [ ] mathematical claims verified
- [ ] Ulam spiral is real, not decorative
- [ ] Sieve of Eratosthenes is correct
- [ ] Euclid explanation is correct
- [ ] factorization examples are correct
- [ ] RSA wording is accurate
- [ ] experience works forward and backward
- [ ] scrollbar hidden
- [ ] only one visual viewport/stage
- [ ] no generic AI visual filler
- [ ] favicon is custom
- [ ] metadata and OG image complete
- [ ] reduced-motion mode works
- [ ] keyboard focus states work
- [ ] no color-only meaning
- [ ] mobile layout tested
- [ ] Android emulator used if available
- [ ] production build profiled
- [ ] no persistent scroll jank
- [ ] no black frames between video clips
- [ ] final professor frame is stable
- [ ] cold-load tested
- [ ] warm-load tested
- [ ] TypeScript passes
- [ ] lint passes
- [ ] tests pass
- [ ] production build passes
- [ ] GitHub Actions deployment passes
- [ ] production console is clean
- [ ] README updated

---

# 63. Agent autonomy

You are expected to make professional implementation decisions.

You may improve this plan where measurements or the actual footage justify it.

However:

- do not change the educational story without a clear reason,
- do not add generic decorative sections,
- do not replace the one-frame experience with a traditional website,
- do not sacrifice mobile smoothness for visual excess,
- do not sacrifice mathematical correctness for prettier graphics,
- do not retain a weaker technical approach merely because it was listed here.

If you discover a materially better solution:
1. verify it technically,
2. briefly document why it is better,
3. implement it consistently.

Do not ask for approval for trivial implementation details.

Ask only if a decision would substantially change:
- concept,
- educational content,
- visual direction,
- core interaction model.

---

# 64. Definition of done

The project is done only when it feels like a finished digital exhibit, not a prototype.

A visitor should be able to open the page and experience:

**a professor → a walk → six discoveries → one coherent mathematical idea**

without noticing:
- file boundaries,
- browser mechanics,
- loading tricks,
- responsive compromises,
- scroll plumbing,
- implementation details.

The technology should disappear behind the experience.

The target feeling is:

> **A short university walk that makes prime numbers feel unexpectedly alive.**
