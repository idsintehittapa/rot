# Innan natten — a chamber film (landing page)

A landing page for a **fictional** Nordic arthouse film, built for the
[Web Dev Challenge S3.E5 "The Best Landing Page Ever"](https://codetv.dev/series/web-dev-challenge/s3/e5-best-landing-page-gsap).

The page behaves like a film reel you scroll through, animated with **[GSAP](https://gsap.com/)**.

## The story

_Innan natten_ ("Before the Night") is a chamber film / tribute to **Lars Norén**
built around his words on art and the market: an art that refuses, that does not
strive for publicity; the market as the most lethal of poisons, as death that
makes art rot — resolving, through the decentralisation of society and its
subcultures, into hope. Text is Swedish (Norén register) with small English
subtitles; the English-language quote is shown in English.

**Title:** `Innan natten`. To swap, change `<h1 id="titleMain">`, `<title>`, and
`.premiere__title` in `index.html`.

## The beats

1. **Preloader — projector start.** Academy countdown (5·4·3·2·1), rotating
   sweep, gate-weave jitter, burn-in flash. `Timeline`.
2. **Title.** "XXX Production presents" / _Innan natten_. `SplitText`.
3. **Shadow doves** (zoom-out) — "Jag vill ha en konst som vägrar."
4. **Intertitle** — "Konst som inte strävar efter publicitet."
5. **Intertitle** — "Marknaden är det dödligaste av alla gifter."
6. **The skeleton shadow** (push-in) — "Marknaden är döden — den får konsten att ruttna."
7. **The face** (push-in) — a silent beat.
8. **Those who will not look** (zoom-out) — the trio.
9. **Intertitle (English quote)** — "One of the wonderful things about the
   decentralisation of society is that all the subcultures, with their own values —"
10. **Figures in light** (push-in) — "Det är där hoppet ligger."
11. **Memorial** — "In memory of Lars Norén, 1944–2021."
12. **Credits crawl** — a film by / words / built for / quotations from.

Scene motion is data-driven: any SVG `<g data-anim="zoom-out">` or
`data-anim="push-in"` inside a `<section>` scrubs its scale across that scene.

## Placeholders to fill in

- **`XXX PRODUCTION`** — your production name (in the title kicker and credits).
- **Attribution** — the credits line `XXX · interview with YYY · ZZZ`: replace with
  the real publication, interviewer, and year/place of the Norén quotations.
- **Norén portrait** — `#norenPortrait` in the memorial is an empty frame. Drop a
  traced `<svg>` or a `background-image` of Norén (see the SWAP POINT comment).
- **Verify the quotes** against the original interview before publishing.

## Audio (AI narration) — dormant hooks are already wired

Each quote `<section>` has a `data-audio="./assets/audio/NN-name.mp3"`. A **sound
toggle** (bottom-right) turns narration on; clicking it counts as the user gesture
browsers require, then each clip fades in when its scene enters. It stays silent
until the files exist. Generate the voice (e.g. ElevenLabs) and save:

- `01-refuses.mp3`, `02-publicity.mp3`, `03-poison.mp3`, `04-rot.mp3`,
  `05-decentralisation.mp3`, `06-hope.mp3` in `assets/audio/`.

Persistent film layer throughout: animated canvas **grain**, **vignette**,
**letterbox bars**, film-strip **perforations**. Everything is black & white.

## Working with SVG scenes (your workflow)

The scene stages (`#handsStage`, `#figuresStage`, `#shadowStage`, and the
Persona halves) are `<svg>` elements. Right now they use your reference photos
via `<image>` inside a `<g>` so the demo looks finished immediately. Corner app
chrome from the source screenshots is cropped out with each `<svg>`'s `viewBox`.
To move to your traced SVGs:

- **Replace the `<image>`** inside a `<g id="...Stage" data-anim="...">` with your
  traced vector art (keep it inside the `<g>` so the zoom/push-in still drives it),
  and reset the `viewBox` to your artwork's coordinates.
- **Per-figure motion (scene 3):** wrap each traced person in `<g class="figure">`.
  `main.js` detects `.figure` groups and gives each its own drift/sway; with no
  figure groups it sways the whole stage instead.
- **Line trace-on (any scene):** mark stroked paths with `data-draw`
  (e.g. `<path data-draw d="..." fill="none" stroke="#e8e4da" />`). They will
  draw on as you scroll, via **DrawSVGPlugin** (loaded from CDN; GSAP 3.13 made
  the bonus plugins free). If the plugin is unavailable it simply no-ops.
- **Persona (scene 5)** uses two mirrored `<svg>` halves of `portrait.png`; swap
  the `<image>` for your traced face and it still slides/merges.

Reference images live in `assets/refs/` (`three-figures.png`, `portrait.png`).

## Run it (zero install)

GSAP is loaded from a CDN, so any static server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Porting to the challenge's Astro + GSAP starter (for Webflow Cloud)

The challenge suggests the
[`webflow-examples/astro-gsap`](https://github.com/webflow-examples/astro-gsap)
starter on [Webflow Cloud](https://webflow.com/feature/cloud):

1. Scaffold the starter.
2. Move the `index.html` markup into an Astro page/component and `styles.css`
   into it.
3. `npm i gsap`, move `main.js` into a client script, and swap the CDN
   `<script>` tags for `import { gsap } from "gsap"` +
   `import { ScrollTrigger } from "gsap/ScrollTrigger"` (and `SplitText`,
   `DrawSVGPlugin`).

## Notes

- Responsive and honours `prefers-reduced-motion` (grain + projector motion
  disabled; loader skipped straight to the reel).
- All credits/names are invented — not based on real people.
