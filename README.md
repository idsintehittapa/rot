# Rot — a landing page

A scroll-driven tribute to **Lars Norén**, built for the
[Web Dev Challenge S3.E5 "The Best Landing Page Ever"](https://codetv.dev/series/web-dev-challenge/s3/e5-best-landing-page-gsap),
animated with **[GSAP](https://gsap.com/)**.

## The story

_Rot_ (Swedish for "root"; English "rot") is a tribute to **Lars Norén**
built around his words on art and the market: an art that refuses, that does not
strive for publicity; the market as the most lethal of poisons, as death that
makes art rot — resolving, through the decentralisation of society and its
subcultures, into hope. Text is Swedish (Norén register) with small English
subtitles; the English-language quote is shown in English.

**Title:** `Rot`. To swap, change `<h1 id="titleMain">`, `<title>`, and
`.premiere__title` in `index.html`.

## The beats

0. **Curtain.** A full-screen red "light curtain" (shimmering velvet folds)
   holds — the theater hasn't started — dips, then rises like a stage curtain to
   reveal the title. The film grain/frame stays off until it lifts, then fades
   in. Skipped on `prefers-reduced-motion`.
1. **Title.** Revealed by the rising curtain itself — the title sits lit behind
   drifting "light curtains" (soft beams) and is uncovered as the drape lifts.
   Depth comes from real z-separated planes inside a 3D "world": a cold moon far
   back (the light source), the receded/blurred beams, the title in the mid
   plane, and drifting out-of-focus dust motes in the foreground. On fine
   pointers the whole world tilts to the cursor — perspective turns each plane's
   depth into genuine parallax — and scrolling away lifts, recedes and dims the
   world so the depth is felt in motion too.
2. **The dove** (`birds.svg`) — a hand-shadow dove whose wings flap. The line
   turns on scroll: "Jag vill ha en konst som vägrar." →
   "En konst som inte strävar efter publicitet."
3. **Intertitle** — "Marknaden är det dödligaste av alla gifter."
4. **The skeleton** (`skelett.svg`, faceless) — the two rib "shadows" breathe
   together — "Marknaden är döden — den får konsten att ruttna."
5. **[ The eating face / the market ]** — `head.svg` to be added: a hinged jaw
   that devours the small figures.
6. **Intertitle (English quote)** — "One of the wonderful things about the
   decentralisation of society is that all the subcultures, with their own values —"
7. **Lars Norén / the hope** (`lars.svg`) — he breathes, glances, and blinks —
   "Det är där hoppet ligger."
8. **Credits crawl** — words / built for / quotations from.

Rigged SVG scenes: a `[data-svg]` mount is fetched and inlined so GSAP can reach
named parts (`#left-wing`, `#ribs`, `#l-left`…). Ids are namespaced per mount to
avoid clip-id collisions. Rigs live in `main.js` (`rigBirds`, `rigSkeleton`,
`rigLars`). `[data-anim="push-in"|"zoom-out"]` still scrubs a mount's scale.

## Placeholders to fill in

- **`XXX PRODUCTION`** — your production name (in the title kicker and credits).
- **Attribution** — the credits line `XXX · interview with YYY · ZZZ`: replace with
  the real publication, interviewer, and year/place of the Norén quotations.
- **`head.svg`** — the eating-face scene; export with named parts (e.g. `head`,
  `jaw`, `person-1`…) and add a mount + a `rigHead` in `main.js`.
- **Verify the quotes** against the original interview before publishing.

## Audio (AI narration) — dormant hooks are already wired

Each quote `<section>` has a `data-audio="./assets/audio/NN-name.mp3"`. A **sound
toggle** (bottom-right) turns narration on; clicking it counts as the user gesture
browsers require, then each clip fades in when its scene enters. It stays silent
until the files exist. Generate the voice (e.g. ElevenLabs) and save:

- `01-refuses.mp3`, `02-publicity.mp3`, `03-poison.mp3`, `04-rot.mp3`,
  `05-decentralisation.mp3`, `06-hope.mp3` in `assets/audio/`.

Persistent film layer throughout: animated canvas **grain**, **vignette**, and
**letterbox bars**. Everything is black & white.

## Working with SVG scenes (your workflow)

Scenes hold a mount `<div data-svg="./assets/x.svg" data-rig="..." data-fit="slice|meet">`.
On load, `main.js` fetches the SVG, inlines it, namespaces its ids (to avoid
clip-id collisions between exports), and runs the matching rig. To animate parts,
export the SVG with **named ids** (Affinity/Illustrator layer names become ids),
then target them in the rig via the scoped `get('name')` helper.

- `data-fit="slice"` fills the stage (crop); `meet` fits the whole art.
- `data-par` overrides `preserveAspectRatio` (e.g. birds use `xMinYMid slice`
  so the dove stays framed on narrow/portrait screens).
- Rigs: `rigBirds` (wing flap), `rigSkeleton` (faceless, synced rib breathing),
  `rigLars` (blink + glance + breathing). Add `rigHead` for the eating face.

## Preview screenshots

`node tools/shot.mjs live` (desktop) · `mobile` · `svg` · `parts` · `debug`.
Frames land in `preview/`.

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
   `import { ScrollTrigger } from "gsap/ScrollTrigger"`.

## Notes

- Responsive and honours `prefers-reduced-motion` (grain, beams, pointer
  parallax, and the curtain loader are all disabled; the title shows at once).
- All credits/names are invented — not based on real people.
