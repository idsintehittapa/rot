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
  /* 1. Preloader — projector countdown, then reveal the reel           */
  /* ------------------------------------------------------------------ */
  const countEl = document.getElementById('count');
  const sweep = document.querySelector('.leader__sweep');
  const gate = document.querySelector('.leader__gate');
  const flash = document.getElementById('flash');
  const loader = document.getElementById('loader');

  function buildCountdown() {
    const numbers = ['5', '4', '3', '2', '1'];
    const tl = gsap.timeline();
    numbers.forEach((n, i) => {
      tl.set(countEl, { textContent: n }, i)
        .fromTo(
          countEl,
          { scale: 1.35, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.22, ease: 'power2.out' },
          i,
        )
        .to(
          gate,
          {
            x: () => gsap.utils.random(-4, 4),
            y: () => gsap.utils.random(-4, 4),
            duration: 0.08,
            repeat: 6,
            yoyo: true,
          },
          i,
        )
        .to(countEl, { opacity: 0.15, duration: 0.6 }, i + 0.35);
    });
    if (sweep && !prefersReduced) {
      tl.to(
        sweep,
        {
          rotation: 360 * numbers.length,
          duration: numbers.length,
          ease: 'none',
        },
        0,
      );
    }
    tl.set(gate, { x: 0, y: 0 })
      .to(flash, { opacity: 1, duration: 0.08 }, '>')
      .to(flash, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    return tl;
  }

  function revealReel() {
    document.body.classList.remove('is-loading');
    ScrollTrigger.refresh();
  }

  function runLoader() {
    if (prefersReduced || !countEl || !loader) {
      if (loader) loader.style.display = 'none';
      revealReel();
      return;
    }
    const tl = buildCountdown();
    tl.to(loader, {
      autoAlpha: 0,
      duration: 0.6,
      onStart: revealReel,
      onComplete: () => {
        loader.style.display = 'none';
      },
    });
  }
  runLoader();

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
  /* "Watch the trailer" replays the projector countdown as a teaser    */
  /* ------------------------------------------------------------------ */
  const trailer = document.querySelector('a[href="#watch"]');
  if (trailer && loader) {
    trailer.addEventListener('click', (e) => {
      e.preventDefault();
      if (prefersReduced) return;
      loader.style.display = 'grid';
      gsap.set(loader, { autoAlpha: 1 });
      const tl = buildCountdown();
      tl.to(loader, {
        autoAlpha: 0,
        duration: 0.6,
        onComplete: () => {
          loader.style.display = 'none';
        },
      });
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
