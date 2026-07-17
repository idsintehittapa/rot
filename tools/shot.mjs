import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { mkdirSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { createServer } from 'http';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abs = (p) => pathToFileURL(path.join(root, p)).href;
const out = (name) => path.join(root, 'preview', `${name}.png`);
mkdirSync(path.join(root, 'preview'), { recursive: true });

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
};
// minimal static server so the page's fetch() of SVGs works over http
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const data = await readFile(path.join(root, p));
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  reducedMotion: 'no-preference',
});

// Render a standalone SVG on a dark stage (inlined so we can measure parts).
async function shotSvg(name, file) {
  const page = await ctx.newPage();
  const svg = readFileSync(path.join(root, file), 'utf8').replace(
    /<\?xml[^>]*\?>|<!DOCTYPE[^>]*>/g,
    '',
  );
  await page.setContent(
    `<!doctype html><html><head><style>` +
      `html,body{margin:0;background:#0f0f0f;height:100vh}` +
      `.wrap{display:grid;place-items:center;height:100vh;padding:3vh}` +
      `.wrap svg{width:auto!important;height:auto!important;max-width:94vw;max-height:94vh}` +
      `</style></head><body><div class="wrap">${svg}</div></body></html>`,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: out(name) });
  await page.close();
}

// Render the live page, optionally scrolled to a section.
async function shotPage(name, { sel = null, frac = 0.4, wait = 4000 } = {}) {
  const page = await ctx.newPage();
  await page.goto(`${base}/index.html`);
  await page.waitForTimeout(wait);
  if (sel) {
    await page.evaluate(
      ({ sel, frac }) => {
        const el = document.querySelector(sel);
        if (el) window.scrollTo(0, el.offsetTop + el.offsetHeight * frac);
      },
      { sel, frac },
    );
    await page.waitForTimeout(1400);
  }
  await page.screenshot({ path: out(name) });
  await page.close();
}

// Render an SVG with named parts tinted so we can see the rig.
async function shotSvgParts(name, file, highlights) {
  const page = await ctx.newPage();
  const svg = readFileSync(path.join(root, file), 'utf8').replace(
    /<\?xml[^>]*\?>|<!DOCTYPE[^>]*>/g,
    '',
  );
  const css = Object.entries(highlights)
    .map(([id, c]) => `#${id},#${id} *{fill:${c}!important;stroke:${c}!important}`)
    .join('');
  await page.setContent(
    `<!doctype html><html><head><style>` +
      `html,body{margin:0;background:#0f0f0f;height:100vh}` +
      `.wrap{display:grid;place-items:center;height:100vh;padding:3vh}` +
      `.wrap svg{width:auto!important;height:auto!important;max-width:94vw;max-height:94vh}` +
      css +
      `</style></head><body><div class="wrap">${svg}</div></body></html>`,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: out(name) });
  await page.close();
}

const job = process.argv[2] || 'all';
if (job === 'debug') {
  const page = await ctx.newPage();
  page.on('console', (m) => console.log('PAGE:', m.text()));
  page.on('pageerror', (e) => console.log('PAGEERR:', e.message));
  await page.goto(`${base}/index.html`);
  await page.waitForTimeout(4500);
  const info = await page.evaluate(() =>
    [...document.querySelectorAll('[data-svg]')].map((el) => {
      const svg = el.querySelector('svg');
      const r = svg ? svg.getBoundingClientRect() : null;
      return {
        rig: el.dataset.rig,
        hasSvg: !!svg,
        htmlLen: el.innerHTML.length,
        rect: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
      };
    }),
  );
  console.log(JSON.stringify(info, null, 2));
  await page.close();
}
if (job === 'parts') {
  await shotSvgParts('parts-birds', 'assets/birds.svg', {
    'left-wing': '#ff3b30',
    'right-wing': '#0a84ff',
    'bird-head': '#30d158',
  });
  await shotSvgParts('parts-lars', 'assets/lars.svg', {
    'l-left': '#ff3b30',
    'l-right': '#0a84ff',
  });
  await shotSvgParts('parts-skelett', 'assets/skelett.svg', {
    'left-eye': '#ff3b30',
    'right-eye': '#0a84ff',
    'pupil-left': '#ffd60a',
    'right-eye-pupil': '#ff9f0a',
    ribs: '#30d158',
    'chair-ribs': '#bf5af2',
  });
}
if (job === 'svg' || job === 'all') {
  await shotSvg('svg-birds', 'assets/birds.svg');
  await shotSvg('svg-lars', 'assets/lars.svg');
  await shotSvg('svg-skelett', 'assets/skelett.svg');
}
if (job === 'live' || job === 'all') {
  await shotPage('live-title', { wait: 4200 });
  await shotPage('live-birds', { sel: '#sceneBirds', frac: 0.45, wait: 4200 });
  await shotPage('live-skeleton', { sel: '#sceneSkeleton', frac: 0.2 });
  await shotPage('live-memorial', { sel: '#memorial', frac: 0 });
}

await browser.close();
server.close();
console.log('shots done:', job);
