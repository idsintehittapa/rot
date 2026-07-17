/* Det som blir kvar — GSAP-driven film landing page */
(() => {
  const prefersReduced = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  gsap.registerPlugin(ScrollTrigger);
  const hasSplitText = typeof SplitText !== 'undefined';
  const hasDraw = typeof DrawSVGPlugin !== 'undefined';
  if (hasDraw) gsap.registerPlugin(DrawSVGPlugin);

  /* ------------------------------------------------------------------ */
  /* Animated film grain                                                */
  /* ------------------------------------------------------------------ */
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
      if (prefersReduced || tick++ % 3 !== 0) return;
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
  /* 1. Theater curtain — rises to reveal the stage                     */
  /* ------------------------------------------------------------------ */
  const curtain = document.getElementById('curtain');
  const drapeL = document.querySelector('.curtain__drape--left');
  const drapeR = document.querySelector('.curtain__drape--right');
  const valance = document.querySelector('.curtain__valance');
  const curtainLabel = document.getElementById('curtainLabel');
  const spot = document.getElementById('spot');

  function revealReel() {
    document.body.classList.remove('is-loading');
    ScrollTrigger.refresh();
  }

  // The reveal: a breath of anticipation, drapes part on offset timing
  // (no twinning), then the whole rig flies up with follow-through.
  function buildCurtainRaise() {
    const tl = gsap.timeline({ delay: 0.35 });

    if (spot) gsap.set(spot, { autoAlpha: 0, scale: 1.35 });

    tl
      // anticipation — the drapes tense before they open
      .to(
        [drapeL, drapeR],
        { scaleX: 1.03, duration: 0.55, ease: 'power1.inOut' },
        0,
      )
      .to(curtainLabel, { autoAlpha: 0, y: -14, duration: 0.5, ease: 'power2.in' }, 0.15)
      .addLabel('open', 0.55)
      // part to the sides (left leads, right follows — arcs, not mirrors)
      .to(drapeL, { xPercent: -16, duration: 0.7, ease: 'power2.in' }, 'open')
      .to(drapeR, { xPercent: 16, duration: 0.7, ease: 'power2.in' }, 'open+=0.06')
      // fly up; valance trails the drapes for follow-through
      .to(
        [drapeL, drapeR],
        {
          yPercent: -118,
          duration: 1.25,
          ease: 'power3.inOut',
          onStart: revealReel,
        },
        'open+=0.28',
      )
      .to(
        valance,
        { yPercent: -108, duration: 1.15, ease: 'power3.inOut' },
        'open+=0.42',
      )
      // spotlight blooms on the title as the stage is uncovered
      .to(
        spot,
        { autoAlpha: 1, scale: 1, duration: 1.5, ease: 'power2.out' },
        'open+=0.5',
      )
      .set(curtain, { display: 'none' });

    return tl;
  }

  function runCurtain() {
    if (prefersReduced || !curtain || !drapeL) {
      if (curtain) curtain.style.display = 'none';
      if (spot) gsap.set(spot, { autoAlpha: 1, scale: 1 });
      revealReel();
      return;
    }
    buildCurtainRaise();
  }
  runCurtain();

  /* ------------------------------------------------------------------ */
  /* 2. Title — letters resolve out of the grain                        */
  /* ------------------------------------------------------------------ */
  const titleMain = document.getElementById('titleMain');
  if (titleMain) {
    let targets = [titleMain];
    if (hasSplitText)
      targets = new SplitText(titleMain, { type: 'chars' }).chars;
    gsap.from(targets, {
      opacity: 0,
      yPercent: 120,
      filter: 'blur(14px)',
      rotateX: -70,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.05,
      scrollTrigger: { trigger: '#title', start: 'top 75%', once: true },
    });
  }

  const scrollHint = document.getElementById('scrollHint');
  if (scrollHint && !prefersReduced) {
    gsap.to(scrollHint, {
      opacity: 0.25,
      y: 8,
      duration: 1.1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  /* ------------------------------------------------------------------ */
  /* 3. Bird flock — rigged SVG (body + two wings that flap)            */
  /* Scroll scrubs each bird's flight arc; wings flap on their own      */
  /* time-based loop, desynced per bird (no lifeless "twinning").       */
  /* ------------------------------------------------------------------ */
  const flock = document.getElementById('birdFlock');
  if (flock) {
    const SVGNS = 'http://www.w3.org/2000/svg';
    const birdMarkup =
      '<path class="bird__wing bird__wing--l" d="M50 30 C34 12 14 12 2 26 C20 24 36 28 50 33 Z"/>' +
      '<path class="bird__wing bird__wing--r" d="M50 30 C66 12 86 12 98 26 C80 24 64 28 50 33 Z"/>' +
      '<ellipse class="bird__body" cx="50" cy="31" rx="5.5" ry="3.4"/>';

    const N = 8;
    const birds = [];
    for (let i = 0; i < N; i++) {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'bird');
      g.innerHTML = birdMarkup;
      flock.appendChild(g);
      birds.push(g);
    }

    const flyTl = gsap.timeline({
      scrollTrigger: {
        trigger: '#sceneBirds',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8,
      },
    });

    birds.forEach((g, i) => {
      const scale = gsap.utils.random(0.5, 1.35);
      const baseY = gsap.utils.random(120, 540);
      const startX = gsap.utils.random(-420, -120);
      const endX = 1360 + gsap.utils.random(0, 320);
      gsap.set(g, { x: startX, y: baseY, scale, transformOrigin: '50% 50%' });

      // flight path: cross the stage while drifting upward (toward the light)
      flyTl.to(
        g,
        {
          x: endX,
          y: baseY - gsap.utils.random(50, 140),
          ease: 'none',
          duration: 1,
        },
        i * 0.06,
      );

      if (prefersReduced) return;

      // wing flap — continuous, each bird its own cadence and phase
      const wl = g.querySelector('.bird__wing--l');
      const wr = g.querySelector('.bird__wing--r');
      gsap.set(wl, { transformOrigin: 'right center' });
      gsap.set(wr, { transformOrigin: 'left center' });
      const beat = gsap.utils.random(0.28, 0.42);
      gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
        .fromTo(wl, { rotation: 16 }, { rotation: -30, duration: beat }, 0)
        .fromTo(wr, { rotation: -16 }, { rotation: 30, duration: beat }, 0)
        .progress(Math.random());
    });
  }

  /* ------------------------------------------------------------------ */
  /* Generic scene line reveals + optional DrawSVG trace-on             */
  /* ------------------------------------------------------------------ */
  gsap.utils.toArray('[data-scene-line], [data-intertitle]').forEach((line) => {
    gsap.from(line, {
      opacity: 0,
      filter: 'blur(12px)',
      y: 26,
      duration: 1.2,
      ease: 'power3.out',
      scrollTrigger: { trigger: line, start: 'top 80%', once: true },
    });
  });

  // When traced paths (marked data-draw) are added to a scene, they draw on scroll.
  if (hasDraw) {
    gsap.utils.toArray('.scene, .persona').forEach((scene) => {
      const paths = scene.querySelectorAll('[data-draw]');
      if (!paths.length) return;
      gsap.fromTo(
        paths,
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: {
            trigger: scene,
            start: 'top 70%',
            end: 'center center',
            scrub: true,
          },
        },
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* Data-driven scene motion: [data-anim="zoom-out" | "push-in"]       */
  /* Each animated stage scrubs its scale across the scene, plus a      */
  /* gentle drift (per-figure if .figure groups exist, else whole stage)*/
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
    const figs = stage.querySelectorAll('.figure');
    if (figs.length) {
      figs.forEach((f, i) => {
        gsap.to(f, {
          y: gsap.utils.random(-10, 10),
          x: gsap.utils.random(-6, 6),
          rotation: gsap.utils.random(-1.2, 1.2),
          transformOrigin: '50% 100%',
          duration: gsap.utils.random(3.5, 5.5),
          delay: i * 0.3,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });
    } else {
      gsap.to(stage, {
        x: 6,
        y: -5,
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /* Narration audio (dormant until files exist in assets/audio/)        */
  /* Each [data-audio] section plays its clip on enter, once sound is    */
  /* enabled via the toggle (a user gesture — autoplay-policy safe).     */
  /* ------------------------------------------------------------------ */
  const soundToggle = document.getElementById('soundToggle');
  const audioSections = gsap.utils.toArray('[data-audio]');
  if (soundToggle && audioSections.length) {
    let soundOn = false;
    let current = null;
    const clips = new Map();

    const clipFor = (src) => {
      if (!clips.has(src)) {
        const a = new Audio(src);
        a.preload = 'none';
        clips.set(src, a);
      }
      return clips.get(src);
    };

    const playClip = (src) => {
      if (!soundOn) return;
      if (current && current.src.indexOf(src) === -1) {
        gsap.to(current, {
          volume: 0,
          duration: 0.6,
          onComplete: () => current.pause(),
        });
      }
      const a = clipFor(src);
      a.volume = 0;
      a.currentTime = 0;
      a.play()
        .then(() => gsap.to(a, { volume: 1, duration: 0.8 }))
        .catch(() => {}); // missing file / blocked — stay silent
      current = a;
    };

    audioSections.forEach((sec) => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 60%',
        end: 'bottom 40%',
        onEnter: () => playClip(sec.dataset.audio),
        onEnterBack: () => playClip(sec.dataset.audio),
      });
    });

    soundToggle.hidden = false;
    soundToggle.addEventListener('click', () => {
      soundOn = !soundOn;
      soundToggle.setAttribute('aria-pressed', String(soundOn));
      if (!soundOn && current) {
        gsap.to(current, {
          volume: 0,
          duration: 0.4,
          onComplete: () => current.pause(),
        });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 7. Credits crawl + premiere reveal                                 */
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

  const premiere = document.getElementById('premiere');
  if (premiere) {
    gsap.from(premiere.children, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      stagger: 0.12,
      ease: 'power3.out',
      scrollTrigger: { trigger: premiere, start: 'top 65%', once: true },
    });
  }

  /* ------------------------------------------------------------------ */
  /* "Höj ridån igen" lowers the curtain, then raises it once more       */
  /* ------------------------------------------------------------------ */
  const replay = document.querySelector('a[href="#watch"]');
  if (replay && curtain) {
    replay.addEventListener('click', (e) => {
      e.preventDefault();
      if (prefersReduced) return;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // reset the curtain to closed, then raise it again
      curtain.style.display = 'grid';
      gsap.set([drapeL, drapeR], { xPercent: 0, yPercent: 0, scaleX: 1 });
      gsap.set(valance, { yPercent: 0 });
      gsap.set(curtainLabel, { autoAlpha: 1, y: 0 });
      buildCurtainRaise();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
