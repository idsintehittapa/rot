---
name: disney-animation-principles
description: Apply Disney's 12 Basic Principles of Animation (from Thomas & Johnston, "The Illusion of Life") to web/UI motion, translated into concrete GSAP techniques. Use when designing, reviewing, or debugging GSAP timelines and scroll-driven scenes, or when the user mentions Disney principles, squash and stretch, anticipation, follow-through, arcs, timing, or making motion feel alive rather than mechanical.
---

# Disney's 12 Principles of Animation → GSAP

The 12 principles from Ollie Johnston & Frank Thomas ("The Illusion of Life", 1981)
are the grammar of believable motion. They were written for character animation, but
they map directly onto UI and scroll-driven web work. Use them to turn a "correct"
animation into one that feels alive.

Pair this with `emil-design-eng` and `review-animations` for UI taste; this skill
covers the *physics and performance* of motion.

## How to use this skill

- When **building** a scene: pick 2-4 principles that serve the intent (not all 12).
  Over-applying reads as cartoonish. For a somber/cinematic piece, favor timing,
  slow in/out, staging, arcs, secondary action, and follow-through. Avoid heavy
  squash-and-stretch and exaggeration unless the tone is playful.
- When **reviewing**: walk the checklist at the bottom and name the specific
  principle that is missing (e.g. "the card enters linearly — add slow-in/out").

## The 12 principles, mapped to GSAP

### 1. Squash & Stretch — volume is preserved
An object deforms under force but keeps its mass. Sell weight and impact.
```js
// A ball landing: stretch on the way down, squash on impact, recover.
gsap.timeline()
  .to(el, { scaleY: 1.15, scaleX: 0.9, duration: 0.15, ease: "power2.in" })
  .to(el, { scaleY: 0.75, scaleX: 1.25, duration: 0.08, ease: "power2.out" }) // impact
  .to(el, { scaleY: 1, scaleX: 1, duration: 0.35, ease: "elastic.out(1,0.4)" });
```
Keep `transformOrigin` at the contact edge (e.g. `"50% 100%"`). On the web, use
sparingly — text and photos should almost never squash.

### 2. Anticipation — a small opposite move before the main action
Prepares the eye. A jump crouches first; a drawer pulls back before sliding out.
```js
gsap.timeline()
  .to(el, { y: 6, duration: 0.12, ease: "power1.in" })   // wind-up (opposite)
  .to(el, { y: -60, duration: 0.5, ease: "power3.out" }); // payoff
```

### 3. Staging — direct attention to one idea at a time
One clear focal point per beat. Use contrast, motion, and negative space.
In GSAP: dim/blur everything else, or stagger so the eye lands where you want.
```js
gsap.to(".other", { opacity: 0.25, filter: "blur(4px)", duration: 0.4 });
gsap.from(".hero", { scale: 0.96, opacity: 0, duration: 0.6, ease: "power2.out" });
```
For scroll pieces: one meaning per section; never animate two competing things at once.

### 4. Straight-ahead vs. Pose-to-pose
- **Pose-to-pose** = define keyframes, let the tween interpolate. This is 95% of GSAP
  (`fromTo`, timelines with labels). Use for controlled, planned motion.
- **Straight-ahead** = procedural/physics, frame by frame. Use `gsap.ticker`,
  `Physics2DPlugin`, or per-frame randomness (fire, grain, smoke).

### 5. Follow-through & Overlapping action — parts don't stop at once
Trailing elements settle after the main body; different parts move on offset timing.
```js
gsap.timeline()
  .to(body, { x: 300, duration: 0.6, ease: "power3.out" })
  .to(tail, { x: 300, duration: 0.6, ease: "power2.out" }, 0.08); // lags behind
```
Overlap via `stagger`, and let secondary elements use a softer/longer ease so they
"catch up" and overshoot slightly.

### 6. Slow In & Slow Out (easing) — the single highest-impact principle
Real things accelerate and decelerate. **Never** ship `ease: "none"` for discrete
UI motion (linear is only for continuous loops, scrubbed scroll, or constant spins).
- Enter (element arriving, user waiting): ease-**out** (`power2.out`, `power3.out`).
- Exit (element leaving): ease-**in** (`power2.in`).
- Move between two on-screen states: ease-**in-out**.
- Playful settle: `back.out(1.7)` / `elastic.out`.
Match `duration` to distance: ~0.2-0.4s small UI, 0.6-1.2s large hero moves.

### 7. Arcs — natural motion follows curved paths
Living things rarely move in straight lines. Combine `x`+`y`, use `MotionPathPlugin`,
or animate `rotation` alongside translation so the path bends.
```js
gsap.to(bird, { motionPath: { path: "#flightPath", autoRotate: true }, duration: 3, ease: "power1.inOut" });
```

### 8. Secondary action — supporting motion that enriches the main one
A walking figure also swings its arms. Add subtle, subordinate motion that reinforces
(never distracts from) the primary action: a slight drift, a shadow that shifts, a
hair-line highlight. Keep amplitude small and ease soft (`sine.inOut`, looped yoyo).

### 9. Timing — the number of frames / duration defines weight and mood
Few frames = fast/light/frantic; many frames = slow/heavy/somber. Timing also conveys
emotion, not just physics. Tune `duration`, `stagger`, and delays deliberately.
For a Norén-style contemplative piece: longer holds, slow staggers (0.06-0.12s/char),
generous scrub distances.

### 10. Exaggeration — push past literal reality for readability
Realism is often too weak to read on screen. Amplify the essential (a bigger overshoot,
a deeper anticipation) while staying true to the intent. On the web this is usually
*restrained* — a 4% scale pop reads as confident; 40% reads as broken. Match the tone.

### 11. Solid drawing — respect volume, weight, and space (3D-ness)
Avoid "twinning" (both sides doing the identical mirror move — lifeless). Give depth
with perspective and consistent light.
```js
gsap.set(container, { perspective: 800 });
gsap.from(card, { rotationY: -25, z: -120, transformOrigin: "left center", duration: 0.7, ease: "power3.out" });
```
Keep a single implied light source; shadows and highlights move consistently.

### 12. Appeal — the design is charismatic and clear
The equivalent of "casting". Clean silhouettes, clear contrast, no muddy readability.
If motion is technically correct but forgettable, revisit staging + timing + a single
memorable "signature" move rather than adding more effects.

## Cross-cutting GSAP practice

- Animate only `transform` (`x/y/scale/rotation`) and `opacity` for 60fps. Avoid
  animating `top/left/width/height/filter: blur` on many elements per frame.
- Build beats as `gsap.timeline()` with **labels** and relative positions
  (`"<"`, `">"`, `"-=0.2"`) so overlap/follow-through is easy to tune.
- Honor `prefers-reduced-motion`: cut looping/idle motion, keep essential reveals.
- Prefer one intentional signature move per scene over many small ones.

## Review checklist (name the missing principle)

- [ ] Every discrete tween has intentional easing (slow in/out), not linear.
- [ ] Key actions have a beat of anticipation.
- [ ] Trailing/secondary parts follow through instead of stopping together.
- [ ] Motion follows arcs, not robotic straight lines, where it should feel alive.
- [ ] One clear focal point per beat (staging); nothing competes.
- [ ] Timing/duration matches the intended weight and mood.
- [ ] Exaggeration is dialed to the tone (restrained for somber, bold for playful).
- [ ] No lifeless "twinning"; depth/volume is respected.
- [ ] The scene has a memorable signature move (appeal).
