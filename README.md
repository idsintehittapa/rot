# Rot — a landing page

A scroll-driven tribute to **Lars Norén**, built for the
[Web Dev Challenge S3.E5 "The Best Landing Page Ever"](https://codetv.dev/series/web-dev-challenge/s3/e5-best-landing-page-gsap),
animated with **[GSAP](https://gsap.com/)**.

## The story

_Rot_ is a tribute to **Lars Norén**
built around his words on art and the market.

## The Scenes
0. **Curtain.** A full-screen deep-red **velvet drape** (opaque, with baked-in
   pleats and a wavy hem) holds and sways — the theatre hasn't started — gathers
   upward (anticipation), then hauls up like a stage curtain, with
   squash-and-stretch and a trailing sway (Disney's 12 principles), to reveal the
   title. The film grain/frame stays off until it lifts, then fades in. Skipped
   on `prefers-reduced-motion`.
1. **Title.** Revealed by the rising curtain itself. It then assembles as a film
   title card: `ROT` pulls into focus, then the kicker and premiere line settle
   in beneath it. Depth comes from real z-separated planes inside a 3D "world": a
   cold moon far back (the light source), receded/blurred beams, the title in the
   mid plane, and drifting out-of-focus dust motes in the foreground. On fine
   pointers the whole world tilts to the cursor — perspective turns each plane's
   depth into genuine parallax. As you **scroll away, `ROT` rots**: the letters
   loosen, tilt, sink and blur into the dark (foreshadowing beat 5), and gather
   back whole if you scroll up.
2. **The dove** (`birds.svg`) — a hand-shadow dove whose wings flap. The line
   turns on scroll: "I want art which refuses …" →
   "Art which does not strive for publicity."
3. **The shielded figure** (`sun.svg`, scroll-scrubbed) — she shields her face
   from the glare, then lowers her hand — "Don't try to be trendy or 'new'.
   Don't strive for the market."
4. **The market devours** (`eating.svg`, scroll-scrubbed) — a hinged jaw snaps
   shut on a small figure as you feed it in — "The market is the most lethal of
   all poisons."
5. **The skeleton** (`skelett.svg`, faceless, `push-in`) — the two rib "shadows"
   breathe together — "The market is death. It makes art rot away." Deep in the
   scene the final words, **"rot away", disintegrate**: the letters crumble into
   ash on physics velocities and fall, gathering back on scroll-up.
6. **Intertitle — decentralisation.** A single cluster of light disperses into
   many small independent points, each on its own rhythm — "One of the wonderful
   things about the decentralisation of society is all the subcultures, with
   their own values."
7. **Lars Norén / the hope** (`lars.svg`) — he breathes, glances and blinks, and
   on fine pointers his **eyes follow the cursor** and his head turns to regard
   you; every so often he lifts his gaze "toward the hope" on his own — "That is
   where the hope lies."
8. **Credits crawl** — a film by / words / animation & art / after the interview
   / built for — which crawls up and off, then a follow-spot reveals the `ROT`
   playbill on the same dark stage (no extra section, so no extra scrolling).

## Run it (zero install)

GSAP is loaded from a CDN, so any static server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Notes

- Responsive and honours `prefers-reduced-motion` (grain, beams, pointer
  parallax, and the curtain loader are all disabled; the title shows at once).
