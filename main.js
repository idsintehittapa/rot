/* Rot — GSAP-driven scroll piece */
(() => {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  gsap.registerPlugin(ScrollTrigger);

  // Full GSAP suite is free as of 3.13; these two carry the "kinetic" moments
  // (masked type reveals, and the letters rotting into ash). Both are optional —
  // if a build is blocked/unavailable, the reveals degrade to a plain fade.
  const hasSplit = typeof SplitText !== 'undefined';
  const hasPhysics = typeof Physics2DPlugin !== 'undefined';
  if (hasSplit) gsap.registerPlugin(SplitText);
  if (hasPhysics) gsap.registerPlugin(Physics2DPlugin);

  // Idle/looping animations should only run while their section is on screen.
  // Pass the section element and the looping tween(s): they play on enter and
  // pause on leave (and start paused if the section isn't currently visible).
  function keepInView(scene, tweens) {
    const list = [].concat(tweens).filter(Boolean);
    if (!scene || !list.length) return null;
    const st = ScrollTrigger.create({
      trigger: scene,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) =>
        list.forEach((t) => (self.isActive ? t.play() : t.pause())),
    });
    list.forEach((t) => (st.isActive ? t.play() : t.pause()));
    return st;
  }

  /* ------------------------------------------------------------------ */
  /* Animated film grain                                                */
  /* ------------------------------------------------------------------ */
  // grain stays idle until the curtain lifts and the film frame is revealed,
  // so it does no main-thread work during the initial load window
  let filmReady = false;
  const grain = document.getElementById('grain');
  if (grain) {
    const gctx = grain.getContext('2d', { willReadFrequently: true });
    const GW = 160;
    let GH = 90;
    const sizeGrain = () => {
      GH = Math.round(GW * (window.innerHeight / window.innerWidth || 0.56));
      grain.width = GW;
      grain.height = GH;
    };
    sizeGrain();
    window.addEventListener('resize', sizeGrain);
    let tick = 0;
    gsap.ticker.add(() => {
      // skip until the film is revealed, on reduced-motion, hidden tab, or 2/3 frames
      if (prefersReduced || !filmReady || document.hidden || tick++ % 3 !== 0)
        return;
      const img = gctx.createImageData(GW, GH);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
      gctx.putImageData(img, 0, 0);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1. Title — sits lit behind the curtain; the rising drape reveals it */
  /* ------------------------------------------------------------------ */
  const spot = document.getElementById('spot');
  const titleMain = document.getElementById('titleMain');
  const titleKicker = document.querySelector('#title .title__kicker');
  const titleMeta = document.querySelector('#title .endcard__meta');
  const titleCredits = [titleKicker, titleMeta].filter(Boolean);

  // The curtain is still the reveal — but the title card is choreographed as a
  // beat. Behind the drape the credits are held out and ROT sits soft and a
  // touch oversized; as the hem clears, ROT pulls into focus, then the credits
  // settle in beneath it — a film title card assembling. Set the pre-reveal
  // state now so none of it flashes during the lift.
  if (!prefersReduced) {
    if (titleMain) {
      gsap.set(titleMain, {
        opacity: 0.85,
        scale: 1.05,
        filter: 'blur(7px)',
        transformOrigin: '50% 62%',
      });
    }
    gsap.set(titleCredits, {
      opacity: 0,
      y: (i, t) => (t === titleKicker ? -8 : 10),
    });
  }

  function runIntro() {
    if (spot) gsap.set(spot, { autoAlpha: 1, scale: 1 });
    if (prefersReduced) return;

    const tl = gsap.timeline();
    if (titleMain) {
      // focus pull: ROT resolves out of soft-and-large into sharp
      tl.to(titleMain, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.1,
        ease: 'power2.out',
      });
    }
    if (titleCredits.length) {
      // the credits settle in under the title, kicker then premiere line
      tl.to(
        titleCredits,
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', stagger: 0.14 },
        '-=0.45',
      );
    }

    // Bookend: as you scroll off the title, ROT rots — the letters loosen,
    // tilt, sink and blur into the dark, foreshadowing "it makes art rot
    // away." Scrubbed, so scrolling back up gathers the word whole again.
    if (hasSplit && titleMain) {
      const decay = new SplitText(titleMain, { type: 'chars' });
      const mid = (decay.chars.length - 1) / 2;
      gsap.to(decay.chars, {
        yPercent: 55,
        xPercent: (i) => (i - mid) * 42,
        rotation: (i) => (i - mid) * 9,
        opacity: 0.12,
        filter: 'blur(6px)',
        ease: 'none',
        scrollTrigger: {
          trigger: '#title',
          start: 'top top',
          end: '+=80%',
          scrub: true,
        },
      });
    }
  }
  /* ------------------------------------------------------------------ */
  /* "Light curtains" — soft beams drifting behind the title            */
  /* ------------------------------------------------------------------ */
  const beamsEl = document.getElementById('beams');
  function buildBeams() {
    const tweens = [];
    if (!beamsEl || prefersReduced) return tweens;
    const n = window.innerWidth < 640 ? 8 : 14;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div');
      b.className = 'title__beam';
      b.style.width = gsap.utils.random(6, 16) + 'vw';
      b.style.left = gsap.utils.random(-8, 100) + 'vw';
      b.style.opacity = gsap.utils.random(0.14, 0.55).toFixed(2);
      beamsEl.appendChild(b);
      tweens.push(
        gsap.to(b, {
          x: `+=${gsap.utils.random(-45, 45)}`,
          scaleX: gsap.utils.random(0.7, 1.4),
          transformOrigin: '50% 50%',
          duration: gsap.utils.random(5, 10),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
        gsap.to(b, {
          opacity: gsap.utils.random(0.08, 0.5),
          duration: gsap.utils.random(3, 7),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    }
    return tweens;
  }
  const titleBeamTweens = buildBeams();

  /* ------------------------------------------------------------------ */
  /* Curtain loader — pleats breathe, tug, then part & gather away       */
  /* ------------------------------------------------------------------ */
  const curtain = document.getElementById('curtain');
  const filmOverlay = document.getElementById('filmOverlay');

  function unlockScroll() {
    document.body.classList.remove('curtain-up');
  }

  // The film grain / frame stays off until the curtain lifts (theater first).
  function showFilm(animate) {
    filmReady = true;
    if (!filmOverlay) return;
    if (animate) {
      gsap.to(filmOverlay, { opacity: 1, duration: 1.2, ease: 'power1.out' });
    } else {
      gsap.set(filmOverlay, { opacity: 1 });
    }
  }

  function runCurtain(onReveal) {
    gsap.set(curtain, { transformOrigin: '50% 0%', yPercent: 0 });

    // Secondary action: a slow, quiet sway while it simply hangs (staging).
    // Transform only — no blend, no opacity loops — so nothing can flicker
    // through the drape. It's handed off to the lift choreography below.
    const sway = gsap.to(curtain, {
      skewX: 0.6,
      x: 8,
      duration: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    const tl = gsap.timeline({
      onComplete: () => {
        curtain.style.display = 'none';
        unlockScroll();
        ScrollTrigger.refresh();
      },
    });

    tl.to({}, { duration: 0.35 }) // a brief beat — the house lights drop
      // hand skew control from the ambient sway to the lift, settling to neutral
      .add(() => sway.kill())
      .to(curtain, { skewX: 0, x: 0, duration: 0.22, ease: 'sine.inOut' })
      // Anticipation: a quick UPward gather — a squash from the top so the hem
      // tenses before the haul. (Never a downward sag, which would open a black
      // gap at the top of frame.) Kept short so it reads as intent, not a stall.
      .to(curtain, { scaleY: 0.972, duration: 0.28, ease: 'power2.out' })
      .to(curtain, { scaleY: 0.992, duration: 0.1, ease: 'sine.inOut' })
      .addLabel('lift')
      // The haul: one confident, decisive pull up into the loft. Still a touch
      // of weight at the start (slow-in) but it commits and flies — no dawdling.
      .to(curtain, { yPercent: -100, duration: 1.7, ease: 'power2.in' }, 'lift')
      // Squash & stretch: the fabric stretches as it's yanked up to speed, then
      // recovers as it clears (follow-through).
      .to(curtain, { scaleY: 1.07, duration: 0.55, ease: 'sine.out' }, 'lift')
      .to(curtain, { scaleY: 1, duration: 0.9, ease: 'sine.inOut' }, 'lift+=0.55')
      // Overlapping action / arcs: the drape swings as it's hauled, the swing
      // trailing the pull before it settles.
      .to(curtain, { skewX: -1.4, duration: 0.5, ease: 'sine.inOut' }, 'lift')
      .to(curtain, { skewX: 0.4, duration: 0.6, ease: 'sine.inOut' }, 'lift+=0.5')
      .to(curtain, { skewX: 0, duration: 0.6, ease: 'sine.inOut' }, 'lift+=1.1')
      // the title is uncovered as the hem clears; the film frame then fades in
      .add(() => onReveal && onReveal(), 'lift+=1.15')
      .add(() => showFilm(true), 'lift+=1.45');
  }

  function startOpening() {
    if (prefersReduced || !curtain) {
      if (curtain) curtain.style.display = 'none';
      showFilm(false);
      unlockScroll();
      runIntro();
      return;
    }
    runCurtain(runIntro);
  }

  // wait for fonts so the title behind the curtain is measured/painted with the
  // real glyphs before the drape lifts (the swap is never visible)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startOpening);
  } else {
    startOpening();
  }

  /* ------------------------------------------------------------------ */
  /* Depth — real z-separated planes inside a 3D "world":               */
  /*   far  moon (-420)  →  beams (-260)  →  spot (-140)                 */
  /*   mid  kicker (-20) →  title (40)                                  */
  /*   near dust (170)                                                  */
  /* Perspective on .title + preserve-3d on the world turn each plane's */
  /* translateZ into genuine parallax when the world tilts or recedes.  */
  /* ------------------------------------------------------------------ */
  const titleEl = document.getElementById('title');
  const titleWorld = document.getElementById('titleWorld');

  // seat each plane at its real depth
  gsap.utils.toArray('#titleWorld [data-depth]').forEach((el) => {
    gsap.set(el, { z: parseFloat(el.dataset.depth || '0') });
  });

  // near foreground: drifting, out-of-focus dust motes (the biggest depth tell)
  const dustEl = document.getElementById('dust');
  const dustTweens = [];
  if (dustEl && !prefersReduced) {
    const count = window.innerWidth < 640 ? 12 : 22;
    for (let i = 0; i < count; i++) {
      const m = document.createElement('div');
      m.className = 'title__mote';
      const size = gsap.utils.random(2, 6);
      m.style.width = `${size}px`;
      m.style.height = `${size}px`;
      m.style.left = `${gsap.utils.random(0, 100)}%`;
      m.style.top = `${gsap.utils.random(0, 100)}%`;
      m.style.opacity = gsap.utils.random(0.12, 0.65).toFixed(2);
      dustEl.appendChild(m);
      dustTweens.push(
        gsap.to(m, {
          x: gsap.utils.random(-42, 42),
          y: gsap.utils.random(-32, 32),
          duration: gsap.utils.random(7, 15),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      );
      dustTweens.push(
        gsap.to(m, {
          opacity: gsap.utils.random(0.1, 0.6),
          duration: gsap.utils.random(2.4, 5.5),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      );
    }
  }

  // pointer tilts the whole world; perspective does the parallax for us
  if (
    !prefersReduced &&
    titleEl &&
    titleWorld &&
    window.matchMedia('(pointer: fine)').matches
  ) {
    const ry = gsap.quickTo(titleWorld, 'rotationY', { duration: 0.7, ease: 'power3' });
    const rx = gsap.quickTo(titleWorld, 'rotationX', { duration: 0.7, ease: 'power3' });
    const px = gsap.quickTo(titleWorld, 'x', { duration: 0.7, ease: 'power3' });
    const py = gsap.quickTo(titleWorld, 'y', { duration: 0.7, ease: 'power3' });
    titleEl.addEventListener('pointermove', (e) => {
      const r = titleEl.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      ry(nx * 6);
      rx(-ny * 4);
      px(nx * 12);
      py(ny * 8);
    });
    titleEl.addEventListener('pointerleave', () => {
      ry(0);
      rx(0);
      px(0);
      py(0);
    });
  }

  const scrollHint = document.getElementById('scrollHint');
  let scrollHintTween = null;
  if (scrollHint && !prefersReduced) {
    scrollHintTween = gsap.to(scrollHint, {
      opacity: 0.5,
      y: 8,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
  // the title's idle loops (beams + dust + scroll hint) only run while it shows
  keepInView(document.getElementById('title'), [
    ...titleBeamTweens,
    ...dustTweens,
    scrollHintTween,
  ]);

  /* ------------------------------------------------------------------ */
  /* 3. Rigged SVG scenes — load the vector art, then animate its parts  */
  /* Each [data-svg] mount is inlined so GSAP can reach named parts      */
  /* (#left-wing, #ribs, #l-left, ...). Rigs run after the art loads.    */
  /* ------------------------------------------------------------------ */
  // Birds: the hand-shadow dove flaps its wings; the whole frame drifts.
  function rigBirds(mount, get) {
    const wl = get('left-wing');
    const wr = get('right-wing');
    const svg = mount.querySelector('svg');
    if (!wl || !wr) return;
    gsap.set(wl, { transformOrigin: '100% 0%' });
    gsap.set(wr, { transformOrigin: '0% 100%' });
    if (!prefersReduced) {
      const HALF = 0.9; // half a wingbeat (the flap's yoyo leg)
      const loops = [];
      const flap = gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
        .fromTo(wl, { rotation: 6 }, { rotation: -13, duration: HALF }, 0)
        .fromTo(wr, { rotation: -6 }, { rotation: 15, duration: HALF }, 0);
      loops.push(flap);

      // Secondary action: the whole bird lifts gently on the beat and settles
      // between, lagging the wings a touch (overlapping action) so the body
      // reads as responding to the wings rather than moving with them. Kept
      // small — the head is fused to the neck, so it rides along as one piece.
      if (svg) {
        loops.push(
          gsap.to(svg, {
            y: -4,
            duration: HALF,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 0.16,
          }),
        );
        // Arcs: a lazy sideways drift on a different period, so the bird travels
        // along a shallow arc rather than bobbing straight up and down.
        loops.push(
          gsap.to(svg, {
            x: 6,
            duration: HALF * 2.6,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          }),
        );
      }

      keepInView(document.getElementById('sceneBirds'), loops);
    }
    if (svg) {
      gsap.fromTo(
        svg,
        { scale: 1, transformOrigin: '28% 58%' },
        {
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: '#sceneBirds',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.6,
          },
        },
      );
    }
  }

  // Skeleton: faceless. The two rib groups are shadows of one body, so they
  // breathe together on a single shared tween (same pattern, same phase).
  function rigSkeleton(mount, get) {
    const face = get('face');
    const eyes = ['left-eye', 'right-eye'].map(get).filter(Boolean);
    const pupils = ['pupil-left', 'right-eye-pupil'].map(get).filter(Boolean);
    const faceParts = [face, ...eyes, ...pupils].filter(Boolean);

    const idleLoops = [];

    // the two rib "shadows" are one body — breathe together
    const ribs = ['ribs', 'chair-ribs'].map(get).filter(Boolean);
    if (!prefersReduced && ribs.length) {
      gsap.set(ribs, { transformOrigin: '50% 100%' });
      idleLoops.push(
        gsap.to(ribs, {
          scaleY: 1.05,
          duration: 3.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    }

    if (!faceParts.length) return;

    // reduced motion: keep the essential reveal, drop the scare
    if (prefersReduced) {
      gsap.set(faceParts, { autoAlpha: 1 });
      return;
    }

    // Starts faceless. The face is dragged into being as you scroll: a
    // failing-light flicker (exaggeration), a pull-back (anticipation), then it
    // looms forward and locks (slow-out), eyes snapping open and pupils focusing.
    gsap.set(faceParts, { autoAlpha: 0 });
    gsap.set(face, { transformOrigin: '50% 42%' });
    gsap.set(pupils, { transformOrigin: '50% 50%' });

    const scene = document.getElementById('sceneSkeleton');
    gsap
      .timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      })
      .to({}, { duration: 0.22 }) // stay faceless — staging
      .to(face, { autoAlpha: 0.55, duration: 0.035 }) // flicker, unstable
      .to(face, { autoAlpha: 0.06, duration: 0.03 })
      .to(face, { autoAlpha: 0.82, duration: 0.035 })
      .to(face, { autoAlpha: 0.14, duration: 0.03 })
      .fromTo(
        face,
        { scale: 0.9 },
        { scale: 0.87, duration: 0.05, ease: 'power1.in' },
      ) // anticipation — a small pull-back
      .to(face, { autoAlpha: 1, scale: 1, duration: 0.34, ease: 'power3.out' }) // loom in and settle
      .to(eyes, { autoAlpha: 1, duration: 0.1 }, '<0.03') // eyes open with it
      .fromTo(
        pupils,
        { autoAlpha: 0, scale: 1.5, y: -5 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.22, ease: 'power2.out' },
        '<0.03',
      ) // pupils dilate, then focus
      .to({}, { duration: 0.3 }); // hold — staring back

    // Secondary action: it never sits still — a fine tremble + the pupils
    // slowly drift, as if watching. (Kept off the scrubbed props to avoid war.)
    idleLoops.push(
      gsap.to(face, {
        rotation: 0.5,
        transformOrigin: '50% 40%',
        duration: 0.13,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }),
    );
    if (pupils.length) {
      idleLoops.push(
        gsap.to(pupils, {
          x: '+=3',
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    }

    // only tremble/breathe/drift while the scene is on screen
    keepInView(scene, idleLoops);
  }

  // Lars: breathes, glances, and blinks at natural intervals.
  function rigLars(mount, get) {
    const svg = mount.querySelector('svg');
    const head = get('face');
    // eye whites (carry the lids for blinking) and the pupils nested inside them
    const whites = ['l-left-eye', 'l-right-eye'].map((id) => get(id)).filter(Boolean);
    const pupils = ['l-left-pupil', 'l-right-pupil'].map((id) => get(id)).filter(Boolean);
    if (prefersReduced || (!head && !whites.length)) return;

    // The eyes already live inside the head group, but ~26k of face detail lines
    // are drawn after them, so lift the whites (pupils ride along, nested) to the
    // top of the group. They then inherit every head turn/tilt with the nose,
    // ears and wrinkles, while gaze + blink play as a small local offset.
    if (head) whites.forEach((e) => head.appendChild(e));

    gsap.set(whites, { transformOrigin: '50% 50%' });
    gsap.set(pupils, { transformOrigin: '50% 50%' });
    // pivot the head where it meets the collar, so it turns on the neck
    if (head) gsap.set(head, { transformOrigin: '50% 82%' });

    const idleLoops = [];

    // Breath — secondary action: a slow chest/head rise of the whole portrait.
    if (svg) {
      idleLoops.push(
        gsap.to(svg, {
          scale: 1.012,
          y: 6,
          transformOrigin: '50% 70%',
          duration: 4.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    }

    // A considered performance. The pupils lead each look and the head follows
    // a beat later along an arc (overlapping action); real holds between moves
    // (timing); and a recurring slow lift of the head + gaze "toward the hope" —
    // a small settle first (anticipation), a slow-out rise, a held beat
    // (staging), then home. The pupils have lots of horizontal room but almost
    // none vertically, so the head tilt carries the "looking up" of the lift.
    if (head || pupils.length) {
      const perf = gsap.timeline({
        repeat: -1,
        repeatRefresh: true,
        defaults: { ease: 'sine.inOut' },
      });
      perf
        .to(pupils, { x: -13, y: 1, duration: 1.1 })
        .to(head, { rotation: -1.2, x: -6, duration: 1.6 }, '<0.18')
        .to({}, { duration: 'random(1.6, 2.8)' })
        .to(pupils, { x: 9, y: 1.5, duration: 1.3 })
        .to(head, { rotation: 0.7, x: 4, duration: 1.7 }, '<0.18')
        .to({}, { duration: 'random(1.4, 2.4)' })
        // anticipation — a small downward settle before the lift
        .to(pupils, { y: 1.5, duration: 0.45, ease: 'power1.in' })
        .to(head, { y: 5, rotation: 0.9, duration: 0.45, ease: 'power1.in' }, '<')
        // the hope — head lifts and tilts up, pupils drift up just slightly
        .to(head, { rotation: -0.2, x: 0, y: -16, duration: 2.3, ease: 'power2.out' })
        .to(pupils, { x: 0, y: -1.5, duration: 1.7, ease: 'power2.out' }, '<0.2')
        .to({}, { duration: 'random(2.2, 3.4)' })
        // ease home
        .to(head, { rotation: 0, x: 0, y: 0, duration: 2.1 })
        .to(pupils, { x: 0, y: 0, duration: 1.7 }, '<');
      idleLoops.push(perf);
    }

    // play the performance only while the portrait is on screen
    const st = keepInView(document.getElementById('sceneLars'), idleLoops);

    // Blinks — timing/secondary action: a quick close/open on a random gap,
    // with the occasional double blink. Runs only while in view.
    const blink = () => {
      if ((!st || st.isActive) && whites.length) {
        const tl = gsap
          .timeline()
          .to(whites, { scaleY: 0.05, duration: 0.06, ease: 'power2.in' })
          .to(whites, { scaleY: 1, duration: 0.12, ease: 'power2.out' });
        if (Math.random() < 0.25) {
          tl.to(whites, { scaleY: 0.05, duration: 0.06, ease: 'power2.in' }, '+=0.08')
            .to(whites, { scaleY: 1, duration: 0.12, ease: 'power2.out' });
        }
      }
      gsap.delayedCall(gsap.utils.random(2.4, 6), blink);
    };
    gsap.delayedCall(gsap.utils.random(1.5, 3.5), blink);
  }

  // The market devours: a giant profile mouth, a small figure at the lip.
  // Scroll feeds the person in and the jaw snaps shut — you are complicit.
  function rigEating(mount, get) {
    const scene = document.getElementById('sceneEating');
    const svg = mount.querySelector('svg');
    const jaw = get('lower-yaw');
    const upper = get('upper-face');
    const neck = get('neck');
    const victim = get('eating-person'); // holds the figure + feet as one group
    if (!scene || (!jaw && !victim)) return;

    if (jaw) gsap.set(jaw, { transformOrigin: '6% 12%' }); // hinge at back of jaw
    if (upper) gsap.set(upper, { transformOrigin: '50% 100%' });
    if (neck) gsap.set(neck, { transformOrigin: '50% 8%' });
    if (victim) gsap.set(victim, { transformOrigin: '50% 50%' });

    // reduced motion: skip the theatrics, show the aftermath (mouth shut, gone)
    if (prefersReduced) {
      if (jaw) gsap.set(jaw, { rotation: -9 });
      if (victim) gsap.set(victim, { autoAlpha: 0 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
      },
    });

    tl
      // staging — hold: the maw agape, the little figure teetering at the lip
      .to({}, { duration: 0.12 })
      // anticipation — the maw UNHINGES: the jaw drops wide and the upper face
      // lifts, gaping far more than a human could (exaggeration — it's the
      // market, not a person). The figure leans toward the dark, drawn in.
      .addLabel('draw')
      .to(jaw, { rotation: 27, duration: 0.22, ease: 'power2.out' }, 'draw')
      .to(upper, { rotation: -5, y: -26, duration: 0.22, ease: 'power2.out' }, 'draw')
      .to(victim, { x: -34, rotation: 10, duration: 0.22, ease: 'power1.in' }, 'draw')
      // the pull-in — the figure is dragged straight back into the throat (x
      // only), sliding behind the face (it sits at the bottom of the stack) and
      // fading as it goes
      .to(victim, {
        x: -300,
        scale: 0.34,
        rotation: 42,
        autoAlpha: 0.18,
        duration: 0.26,
        ease: 'power2.in',
      })
      // THE BITE — a huge fast snap shut from the wide gape; the figure is gone;
      // the head squashes on impact (exaggeration + timing)
      .addLabel('bite')
      .to(jaw, { rotation: -12, duration: 0.06, ease: 'power3.in' }, 'bite')
      .to(upper, { rotation: 2, y: 4, duration: 0.06, ease: 'power3.in' }, 'bite')
      .to(victim, { autoAlpha: 0, scale: 0.18, duration: 0.045 }, 'bite')
      .to(
        svg,
        {
          scaleY: 0.96,
          scaleX: 1.03,
          transformOrigin: '46% 55%',
          duration: 0.05,
          ease: 'power2.in',
        },
        'bite',
      )
      // follow-through — the head springs back with a small overshoot, the jaw
      // eases open again
      .to(svg, { scaleY: 1, scaleX: 1, duration: 0.16, ease: 'elastic.out(1, 0.5)' })
      .to(jaw, { rotation: -3, duration: 0.16, ease: 'power2.out' }, '<')
      .to(upper, { rotation: 0, y: 0, duration: 0.16, ease: 'power2.out' }, '<')
      // secondary action — a swallow ripple travels down the neck
      .to(neck, { scaleX: 1.09, duration: 0.09, ease: 'power1.inOut' })
      .to(neck, { scaleX: 1, duration: 0.13, ease: 'power1.inOut' })
      // rest — stillness; the figure is gone
      .to({}, { duration: 0.12 });
  }

  // The shielded face: a figure shading against the glare, a hand-shadow across
  // her eyes. Scroll lifts the arm away and the shadow slides off — she lowers
  // her guard and shows her real, unperformed face (brows + mouth).
  function rigSun(mount, get) {
    const scene = document.getElementById('sceneSun');
    const svg = mount.querySelector('svg');
    // the arm + hand move as one group; the shadow (hand + arm shadow) is its own
    const armHand = get('arm-hand') || get('hand');
    const hand = get('hand'); // the fingers, nested — for the overlapping drag
    const shadow = get('shadow') || get('hand-shadow');
    const mouth = get('mouth');
    const lowerLip = get('lower-lip');
    const scarf = get('scarf');
    if (!scene || (!armHand && !shadow)) return;

    // The arm swings like a lever hinged at the shoulder (its lower-left). The
    // shadow is *cast by that same arm*, so we pivot it around the exact same
    // point in the SVG's coordinate space (svgOrigin) and give it the identical
    // swing below — it can never drift off on its own arc. What actually reveals
    // the eyes is the shadow fading as the light reaches her, not a slide.
    if (armHand) {
      const bb = armHand.getBBox();
      const ox = bb.x;
      const oy = bb.y + bb.height;
      gsap.set(armHand, { svgOrigin: `${ox} ${oy}` });
      if (shadow) gsap.set(shadow, { svgOrigin: `${ox} ${oy}` });
    } else if (shadow) {
      gsap.set(shadow, { transformOrigin: '50% 50%' });
    }
    // the loose hand hinges at the wrist (its lower edge)
    if (hand) gsap.set(hand, { transformOrigin: '50% 100%' });
    if (mouth) gsap.set(mouth, { transformOrigin: '50% 50%' });
    // the lower lip parts from the seam between the lips
    if (lowerLip) gsap.set(lowerLip, { transformOrigin: '50% 0%' });
    if (scarf) gsap.set(scarf, { transformOrigin: '50% 100%' });

    // reduced motion: show the revealed face (the point), no gesture
    if (prefersReduced) {
      if (shadow) gsap.set(shadow, { autoAlpha: 0 });
      return;
    }

    // Moving hold — she keeps a quiet, living idle so the revealed face is never
    // dead-still (like the bird, but far calmer: she's contemplative, not in
    // motion). Two loops on different periods — a breath and a slow weight-shift
    // sway — so they never sync up and read mechanical. Both hinge low on the
    // body, are independent of the scrub, and are gated to the scene.
    if (svg) {
      gsap.set(svg, { transformOrigin: '50% 80%' });
      keepInView(scene, [
        // breath — the chest/shoulders rise and settle
        gsap.to(svg, {
          scale: 1.01,
          y: 6,
          duration: 4.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
        // a slow shift of weight — a barely-there sway on a longer beat
        gsap.to(svg, {
          x: 5,
          rotation: 0.5,
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      ]);
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scene,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.8,
      },
    });

    tl
      // staging — hold: shielded, the shadow across her eyes
      .to({}, { duration: 0.14 })
      // anticipation — she presses in first (the shadow, riding the same pivot,
      // presses with her); a held breath
      .addLabel('hold')
      .to(armHand, { rotation: -3, duration: 0.16, ease: 'power1.in' }, 'hold')
      // the shadow deepens as she presses in (secondary action), swinging on the
      // same pivot as the arm
      .to(shadow, { rotation: -3, scale: 1.07, duration: 0.16, ease: 'power1.in' }, 'hold')
      // the reveal — the arm lowers as one (slow-out) and dips a touch past its
      // resting angle before easing back (follow-through). The loose hand drags
      // a beat behind the arm and catches up (overlapping action). The shadow
      // swings on the exact same pivot/angle as the arm (so it stays glued to
      // the hand) and dissolves as the light reaches her — that is the reveal.
      .addLabel('open')
      .to(armHand, { rotation: 11, y: 26, duration: 0.34, ease: 'power2.out' }, 'open')
      .to(armHand, { rotation: 9, duration: 0.16, ease: 'sine.inOut' }, 'open+=0.34')
      .to(shadow, { rotation: 11, y: 26, duration: 0.34, ease: 'power2.out' }, 'open')
      .to(shadow, { rotation: 9, duration: 0.16, ease: 'sine.inOut' }, 'open+=0.34')
      .to(hand, { rotation: -5, duration: 0.2, ease: 'power1.out' }, 'open')
      .to(hand, { rotation: 0, duration: 0.3, ease: 'power2.out' }, 'open+=0.18')
      // as the light rakes across it the shadow thins and stretches (squash &
      // stretch) while dissolving — its own bit of life as it goes
      .to(
        shadow,
        {
          scaleX: 0.9,
          scaleY: 1.14,
          autoAlpha: 0.9,
          duration: 0.5,
          ease: 'power2.in',
        },
        'open+=0.04',
      )
      // secondary action — as the light lands she eases: the held smile blooms
      // and the lips part on an exhale, and the scarf settles as she opens up
      .to(mouth, { scaleX: 1.1, y: 6, duration: 0.34, ease: 'power2.out' }, 'open+=0.05')
      .to(lowerLip, { y: 4, duration: 0.34, ease: 'power2.out' }, 'open+=0.1')
      .to(scarf, { rotation: 0.6, y: -8, duration: 0.42, ease: 'power2.out' }, 'open')
      // rest — the face, revealed
      .to({}, { duration: 0.16 });
  }

  const rigs = {
    birds: rigBirds,
    skeleton: rigSkeleton,
    lars: rigLars,
    eating: rigEating,
    sun: rigSun,
  };

  // Affinity exports reuse ids (_clip1, Artboard…). Inlining several in one
  // document collides those ids (clip-paths resolve to the wrong element and
  // clip content away). Namespace every id + internal reference per mount.
  function namespaceIds(svgText, prefix) {
    return svgText
      .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
      .replace(/((?:xlink:)?href)="#([^"]+)"/g, `$1="#${prefix}$2"`);
  }

  async function mountOne(el) {
    if (el.dataset.mounted) return;
    el.dataset.mounted = '1';
    try {
      const res = await fetch(el.dataset.svg);
      if (!res.ok) return;
      const prefix = (el.dataset.rig || 'svg') + '-';
      // data-svg must point only at our own first-party art. We inline it via
      // innerHTML so GSAP can reach named parts; scripts inserted this way don't
      // execute, but never source data-svg from user input or a remote origin.
      el.innerHTML = namespaceIds(await res.text(), prefix);
      const svg = el.querySelector('svg');
      if (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute(
          'preserveAspectRatio',
          el.dataset.par ||
            (el.dataset.fit === 'meet' ? 'xMidYMid meet' : 'xMidYMid slice'),
        );
      }
      const rig = rigs[el.dataset.rig];
      const get = (name) => el.querySelector('#' + prefix + name);
      if (rig) rig(el, get);
      ScrollTrigger.refresh();
    } catch (e) {
      /* file:// or missing asset — leave the mount empty */
    }
  }

  // Mount each heavy SVG only as it nears the viewport, so the initial load
  // doesn't inline + rig all of them at once (keeps main-thread work / TBT low).
  function mountVectors() {
    const mounts = gsap.utils.toArray('[data-svg]');
    if (!('IntersectionObserver' in window)) {
      mounts.forEach(mountOne);
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            obs.unobserve(e.target);
            mountOne(e.target);
          }
        });
      },
      { rootMargin: '150% 0px' }, // ready ~1.5 screens before it scrolls in
    );
    mounts.forEach((el) => io.observe(el));
  }
  mountVectors();

  /* ------------------------------------------------------------------ */
  /* Bird scene: the line turns from refusal to "not for publicity"     */
  /* as you scroll through the scene.                                   */
  /* ------------------------------------------------------------------ */
  (() => {
    const scene = document.getElementById('sceneBirds');
    if (!scene) return;
    const beats = scene.querySelectorAll('.scene__line--beat');
    if (beats.length < 2) return;
    const [b0, b1] = beats;
    if (prefersReduced) {
      gsap.set([b0, b1], { autoAlpha: 1 });
      b1.classList.add('scene__line--beat-stacked');
      return;
    }
    gsap.set(b0, { autoAlpha: 1 });
    gsap.set(b1, { autoAlpha: 0, y: 24, filter: 'blur(10px)' });
    gsap
      .timeline({
        scrollTrigger: {
          trigger: scene,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      })
      .to({}, { duration: 0.42 }) // hold the first line
      .to(b0, { autoAlpha: 0, y: -24, filter: 'blur(10px)', duration: 0.18 })
      .to(b1, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.22 }, '<0.02')
      .to({}, { duration: 0.42 }); // hold the second line
  })();

  /* ------------------------------------------------------------------ */
  /* Decentralisation — one cluster of light disperses into many points */
  /* ------------------------------------------------------------------ */
  (() => {
    const host = document.getElementById('constellation');
    const scene = document.getElementById('sceneDecen');
    if (!host || !scene) return;
    // the pinned stage fills one viewport; dispersion distances are measured
    // against it (the section itself is a tall scroll runway)
    const stage = scene.querySelector('.intertitle-stage') || scene;

    const N = window.innerWidth < 640 ? 34 : 56;
    const stars = [];
    for (let i = 0; i < N; i++) {
      const hx = gsap.utils.random(5, 95); // "home" position, % of the scene
      const hy = gsap.utils.random(8, 92);
      const size = gsap.utils.random(2.5, 9);
      const star = document.createElement('span');
      star.className = 'con-star';
      star.style.cssText = `left:${hx}%;top:${hy}%;width:${size}px;height:${size}px`;
      star.dataset.hx = hx;
      star.dataset.hy = hy;
      star.appendChild(document.createElement('span')).className = 'con-star__dot';
      host.appendChild(star);
      stars.push(star);
    }

    // Reduced motion: show them already settled (dispersed), no gestures.
    if (prefersReduced) {
      gsap.set(stars, { opacity: 0.7 });
      return;
    }

    // Dispersion (staging the metaphor): every point starts pulled into one
    // cluster at the centre and eases out to its own home as you scroll —
    // centralised → decentralised. Recomputed on refresh so it survives resize.
    gsap.from(stars, {
      x: (i, t) => (0.5 - parseFloat(t.dataset.hx) / 100) * stage.offsetWidth,
      y: (i, t) => (0.5 - parseFloat(t.dataset.hy) / 100) * stage.offsetHeight,
      scale: 0.15,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        // scrub the dispersion across the first stretch of the pin, then let
        // the fully-dispersed field dwell before the stage releases
        trigger: scene,
        start: 'top top',
        end: '+=70%',
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    // Each light keeps its own life: a slow drift + twinkle on its own period
    // ("their own values"). These live on the inner dot so they never fight the
    // dispersion transform on the wrapper. All gated to the scene.
    const loops = [];
    stars.forEach((star) => {
      const dot = star.firstChild;
      loops.push(
        gsap.to(dot, {
          x: gsap.utils.random(-14, 14),
          y: gsap.utils.random(-14, 14),
          duration: gsap.utils.random(4, 9),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
        gsap.to(dot, {
          opacity: gsap.utils.random(0.5, 0.95),
          duration: gsap.utils.random(1.6, 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        }),
      );
    });
    keepInView(scene, loops);
  })();

  /* ------------------------------------------------------------------ */
  /* Scene line reveals — the words themselves perform                  */
  /* ------------------------------------------------------------------ */
  // A Norén piece is about language, so the type earns the spectacle: words
  // rise from behind a per-line mask (SplitText) instead of the whole block
  // fading in. Runs after fonts load so line-breaks are measured correctly.
  // Falls back to a plain fade under reduced motion or if SplitText is absent.
  function plainReveal(el) {
    gsap.from(
      el,
      prefersReduced
        ? {
            opacity: 0,
            duration: 0.6,
            ease: 'power1.out',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          }
        : {
            opacity: 0,
            filter: 'blur(12px)',
            y: 26,
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 80%', once: true },
          },
    );
  }

  function setupLineReveals() {
    gsap
      .utils
      .toArray('[data-scene-line]:not([data-rot]), [data-intertitle]')
      .forEach((line) => {
        if (prefersReduced || !hasSplit) {
          plainReveal(line);
          return;
        }
        // words rise from behind their line's mask, staggered left-to-right;
        // once read, revert to clean text so nothing lingers to reflow on resize
        const split = new SplitText(line, { type: 'lines,words', mask: 'lines' });
        gsap.from(split.words, {
          yPercent: 110,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: { amount: 0.5, from: 'start' },
          scrollTrigger: { trigger: line, start: 'top 82%', once: true },
          onComplete: () => split.revert(),
        });
      });

    // "The market is death. It makes art rot away." — the line about rot.
    // The sentence assembles and is read; then only the final words, "rot
    // away", crumble into ash on physics velocities and fall, while the rest
    // holds. Scrolling back up gathers them home. The thesis, made kinetic.
    const rotLine = document.querySelector('[data-rot]');
    if (!rotLine) return;
    if (prefersReduced || !hasSplit) {
      plainReveal(rotLine);
      return;
    }

    const split = new SplitText(rotLine, { type: 'words,chars' });
    gsap.from(split.words, {
      opacity: 0,
      filter: 'blur(10px)',
      yPercent: 60,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.05,
      scrollTrigger: { trigger: rotLine, start: 'top 80%', once: true },
    });

    if (!hasPhysics) return;
    // only the last two words — "rot away" — are allowed to fall
    const lastWords = split.words.slice(-2);
    const fallChars = split.chars.filter((c) =>
      lastWords.some((w) => w.contains(c)),
    );

    // fall: tail-first (the period, then "away", then "rot") so the line
    // decays from its end. overwrite lets the re-gather interrupt it cleanly.
    const rot = () =>
      gsap.to(fallChars, {
        duration: 1.8,
        physics2D: {
          velocity: 'random(40, 120)',
          angle: 'random(70, 110)',
          gravity: 240,
        },
        rotation: 'random(-140, 140)',
        opacity: 0,
        filter: 'blur(4px)',
        ease: 'power1.in',
        stagger: { each: 0.03, from: 'end' },
        overwrite: true,
      });
    // gather: letters ease back to their place, so scrolling up restores the line
    const gather = () =>
      gsap.to(fallChars, {
        duration: 0.6,
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        filter: 'blur(0px)',
        ease: 'power2.out',
        stagger: { each: 0.02, from: 'start' },
        overwrite: true,
      });

    ScrollTrigger.create({
      trigger: '#sceneSkeleton',
      start: 'center 36%',
      onEnter: rot,
      onLeaveBack: gather,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Data-driven scene motion: [data-anim="zoom-out" | "push-in"]       */
  /* Each animated stage scrubs its scale across the scene, plus a      */
  /* gentle idle drift of the whole stage.                              */
  /* ------------------------------------------------------------------ */
  gsap.utils.toArray('[data-anim]').forEach((stage) => {
    const scene = stage.closest('section');
    if (!scene) return;
    const pushIn = stage.dataset.anim === 'push-in';

    gsap.fromTo(
      stage,
      { scale: pushIn ? 1 : 1.18, transformOrigin: '50% 42%' },
      {
        scale: pushIn ? 1.18 : 1,
        transformOrigin: '50% 42%',
        ease: 'none',
        scrollTrigger: {
          trigger: scene,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
        },
      },
    );

    if (prefersReduced) return;
    // a slow idle drift of the whole stage, gated to run only while on screen
    const drift = gsap.to(stage, {
      x: 6,
      y: -5,
      duration: 5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
    keepInView(scene, drift);
  });

  /* ------------------------------------------------------------------ */
  /* Score — one continuous piano track under the whole piece, toggled   */
  /* on by the viewer (a user gesture, so autoplay policy is satisfied)  */
  /* and looping. Mood anchors: any section tagged [data-score-at="secs"]*/
  /* seeks the track to that moment as it scrolls in, so a chosen musical */
  /* passage lands on a chosen scene. The seek is masked by a quick       */
  /* volume dip + rise so the jump isn't jarring (fine for ambient piano).*/
  /* ------------------------------------------------------------------ */
  const soundToggle = document.getElementById('soundToggle');
  const score = document.getElementById('score');
  if (soundToggle && score) {
    let soundOn = false;
    const FULL = 0.7; // ceiling volume for the score

    const fadeTo = (vol, dur, onDone) =>
      gsap.to(score, {
        volume: vol,
        duration: dur,
        ease: 'sine.inOut',
        onComplete: onDone,
      });

    soundToggle.hidden = false;

    // A one-time, unobtrusive nudge toward the opt-in score (autoplay is
    // blocked, so people must choose sound). It appears once the title has
    // settled and bows out on the first interaction or after a few seconds.
    const soundHint = document.getElementById('soundHint');
    let hintDone = false;
    const dismissHint = () => {
      if (hintDone) return;
      hintDone = true;
      soundToggle.classList.remove('sound-toggle--hint');
      if (soundHint) gsap.to(soundHint, { autoAlpha: 0, duration: 0.6 });
    };
    const showHint = () => {
      if (hintDone) return;
      soundToggle.classList.add('sound-toggle--hint');
      if (soundHint) gsap.to(soundHint, { autoAlpha: 1, duration: 0.8 });
      gsap.delayedCall(7, dismissHint);
    };
    gsap.delayedCall(prefersReduced ? 0.8 : 3.4, showHint);
    window.addEventListener('scroll', dismissHint, { once: true, passive: true });

    soundToggle.addEventListener('click', () => {
      dismissHint();
      soundOn = !soundOn;
      soundToggle.setAttribute('aria-pressed', String(soundOn));
      if (soundOn) {
        score.volume = 0;
        score
          .play()
          .then(() => fadeTo(FULL, 1.2))
          .catch(() => {}); // missing file / blocked — stay silent
      } else {
        fadeTo(0, 0.6, () => score.pause());
      }
    });

    // mood anchors — seek to a musical moment as a scene arrives (scroll down)
    gsap.utils.toArray('[data-score-at]').forEach((sec) => {
      const at = parseFloat(sec.dataset.scoreAt);
      if (Number.isNaN(at)) return;
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 60%',
        onEnter: () => {
          if (!soundOn) return;
          // dip, seek, rise — a soft crossfade over the jump in the track
          fadeTo(0, 0.35, () => {
            try {
              score.currentTime = at;
            } catch (e) {
              /* seek not ready — ignore */
            }
            fadeTo(FULL, 0.7);
          });
        },
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Credits crawl                                                      */
  /* ------------------------------------------------------------------ */
  const crawlInner = document.getElementById('crawlInner');
  if (crawlInner) {
    gsap.fromTo(
      crawlInner,
      { yPercent: 65 },
      {
        yPercent: -110,
        ease: 'none',
        scrollTrigger: {
          trigger: '.crawl',
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: true,
        },
      },
    );
  }

  /* ------------------------------------------------------------------ */
  /* Easter egg — a dark stage at the very end. A warm follow-spot tracks */
  /* the cursor (and drifts on its own, slowly, when left alone), and the */
  /* closing title only exists inside that pool of light. Sweep the light */
  /* across the black to find it.                                         */
  /* ------------------------------------------------------------------ */
  const endStage = document.querySelector('.crawl');
  const endHidden = document.getElementById('endHidden');
  const endSpot = document.getElementById('endSpot');
  if (endStage && endHidden && endSpot) {
    const pos = { x: endStage.clientWidth / 2, y: endStage.clientHeight / 2 };
    const apply = () => {
      endHidden.style.setProperty('--mx', pos.x + 'px');
      endHidden.style.setProperty('--my', pos.y + 'px');
      gsap.set(endSpot, { x: pos.x, y: pos.y });
    };
    apply();

    if (prefersReduced) {
      // no scrub reveal or moving light — show the title softly at the very end
      endHidden.style.webkitMaskImage = 'none';
      endHidden.style.maskImage = 'none';
      gsap.set(endHidden, { autoAlpha: 0 });
      gsap.set(endSpot, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: '.crawl',
        start: 'top top',
        end: '+=140%',
        onUpdate: (self) => {
          const rev = gsap.utils.clamp(0, 1, (self.progress - 0.6) / 0.2);
          gsap.set(endHidden, { autoAlpha: rev * 0.85 });
          gsap.set(crawlInner, { autoAlpha: 1 - rev });
        },
      });
    } else {
      let revealed = false;

      const xTo = gsap.quickTo(pos, 'x', { duration: 0.5, ease: 'power3.out', onUpdate: apply });
      const yTo = gsap.quickTo(pos, 'y', { duration: 0.5, ease: 'power3.out', onUpdate: apply });

      const rW = () => endStage.clientWidth;
      const rH = () => endStage.clientHeight;
      // a slow, lazy sweep when no one is driving — keeps the empty stage
      // alive and hints (on touch too) that there's something in the dark
      const idle = gsap.timeline({
        repeat: -1,
        repeatRefresh: true,
        paused: true,
        onUpdate: apply,
        defaults: { ease: 'sine.inOut' },
      });
      idle
        .to(pos, {
          x: () => rW() * gsap.utils.random(0.3, 0.7),
          y: () => rH() * gsap.utils.random(0.38, 0.62),
          duration: 3.4,
        })
        .to(pos, {
          x: () => rW() * gsap.utils.random(0.25, 0.75),
          y: () => rH() * gsap.utils.random(0.34, 0.66),
          duration: 3.8,
        })
        .to(pos, {
          x: () => rW() * gsap.utils.random(0.35, 0.65),
          y: () => rH() * gsap.utils.random(0.4, 0.6),
          duration: 3.2,
        });

      const setRevealed = (on) => {
        if (on === revealed) return;
        revealed = on;
        if (revealed) idle.restart();
        else idle.pause();
      };

      // The reveal is folded into the tail of the credits scrub: as the crawl
      // finishes, the words fade and the follow-spot stage fades up in their
      // place — same pinned screen, so it costs no extra scrolling.
      ScrollTrigger.create({
        trigger: '.crawl',
        start: 'top top',
        end: '+=140%',
        onUpdate: (self) => {
          const rev = gsap.utils.clamp(0, 1, (self.progress - 0.6) / 0.2);
          gsap.set([endHidden, endSpot], { autoAlpha: rev });
          gsap.set(crawlInner, { autoAlpha: 1 - rev });
          // the crawl is the last thing on the page, so the reveal fraction
          // alone gates the stage (no leave callbacks — the pin end sits at the
          // document bottom, and onLeave there would kill it right where you rest)
          setRevealed(rev > 0.5);
        },
      });

      // the cursor takes over the light; releasing hands it back to the drift
      endStage.addEventListener('pointermove', (e) => {
        if (!revealed) return;
        idle.pause();
        const r = endStage.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
      });
      endStage.addEventListener('pointerleave', () => {
        if (revealed) idle.invalidate().restart();
      });
      window.addEventListener('resize', () => {
        if (idle.paused()) {
          pos.x = rW() / 2;
          pos.y = rH() / 2;
          apply();
        }
      });
    }
  }

  function afterFonts() {
    setupLineReveals();
    ScrollTrigger.refresh();
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(afterFonts);
  } else {
    afterFonts();
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
