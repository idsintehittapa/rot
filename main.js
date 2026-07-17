/* Innan natten — GSAP-driven scroll piece */
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
  /* 1. Title — spotlight blooms, letters resolve out of the grain      */
  /* ------------------------------------------------------------------ */
  const spot = document.getElementById('spot');
  const titleMain = document.getElementById('titleMain');

  function runIntro() {
    if (spot) {
      if (prefersReduced) {
        gsap.set(spot, { autoAlpha: 1, scale: 1 });
      } else {
        gsap.fromTo(
          spot,
          { autoAlpha: 0, scale: 1.35 },
          { autoAlpha: 1, scale: 1, duration: 1.6, ease: 'power2.out' },
        );
      }
    }
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
        delay: 0.2,
      });
    }
  }
  // wait for fonts so SplitText measures the real glyphs
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(runIntro);
  } else {
    runIntro();
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
  /* 3. Rigged SVG scenes — load the vector art, then animate its parts  */
  /* Each [data-svg] mount is inlined so GSAP can reach named parts      */
  /* (#left-wing, #ribs, #l-left, ...). Rigs run after the art loads.    */
  /* ------------------------------------------------------------------ */
  // Birds: the hand-shadow dove flaps its wings; the whole frame drifts.
  function rigBirds(mount, get) {
    const wl = get('left-wing');
    const wr = get('right-wing');
    if (!wl || !wr) return;
    gsap.set(wl, { transformOrigin: '100% 0%' });
    gsap.set(wr, { transformOrigin: '0% 100%' });
    if (!prefersReduced) {
      gsap
        .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
        .fromTo(wl, { rotation: 6 }, { rotation: -13, duration: 0.9 }, 0)
        .fromTo(wr, { rotation: -6 }, { rotation: 15, duration: 0.9 }, 0);
    }
    const svg = mount.querySelector('svg');
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
    // hide the face — a body without a face
    ['face', 'left-eye', 'right-eye', 'pupil-left', 'right-eye-pupil'].forEach(
      (id) => {
        const el = get(id);
        if (el) el.style.display = 'none';
      },
    );

    if (prefersReduced) return;
    const ribs = ['ribs', 'chair-ribs'].map((id) => get(id)).filter(Boolean);
    if (ribs.length) {
      gsap.set(ribs, { transformOrigin: '50% 100%' });
      gsap.to(ribs, {
        scaleY: 1.05,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
  }

  // Lars: breathes, glances, and blinks at natural intervals.
  function rigLars(mount, get) {
    const svg = mount.querySelector('svg');
    const eyes = ['l-left', 'l-right'].map((id) => get(id)).filter(Boolean);
    if (prefersReduced || !eyes.length) return;

    gsap.set(eyes, { transformOrigin: '50% 50%' });
    if (svg) {
      gsap.to(svg, {
        scale: 1.012,
        transformOrigin: '50% 60%',
        duration: 4.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }
    // slow glance
    gsap.to(eyes, {
      x: '-=4',
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
    // blink loop — quick close/open with a natural random gap
    const blink = () => {
      gsap
        .timeline({
          onComplete: () => gsap.delayedCall(gsap.utils.random(2.5, 6), blink),
        })
        .to(eyes, { scaleY: 0.05, duration: 0.06, ease: 'power2.in' })
        .to(eyes, { scaleY: 1, duration: 0.12, ease: 'power2.out' });
    };
    gsap.delayedCall(gsap.utils.random(1.5, 3.5), blink);
  }

  const rigs = { birds: rigBirds, skeleton: rigSkeleton, lars: rigLars };

  // Affinity exports reuse ids (_clip1, Artboard…). Inlining several in one
  // document collides those ids (clip-paths resolve to the wrong element and
  // clip content away). Namespace every id + internal reference per mount.
  function namespaceIds(svgText, prefix) {
    return svgText
      .replace(/id="([^"]+)"/g, `id="${prefix}$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}$1)`)
      .replace(/((?:xlink:)?href)="#([^"]+)"/g, `$1="#${prefix}$2"`);
  }

  async function mountVectors() {
    const mounts = gsap.utils.toArray('[data-svg]');
    await Promise.all(
      mounts.map(async (el) => {
        try {
          const res = await fetch(el.dataset.svg);
          if (!res.ok) return;
          const prefix = (el.dataset.rig || 'svg') + '-';
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
        } catch (e) {
          /* file:// or missing asset — leave the mount empty */
        }
      }),
    );
    ScrollTrigger.refresh();
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
  /* "Från början" — smooth-scroll back to the title                    */
  /* ------------------------------------------------------------------ */
  const restart = document.getElementById('restart');
  if (restart) {
    restart.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
