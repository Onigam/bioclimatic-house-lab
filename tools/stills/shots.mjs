// Stills of the real lab in dev mode (`npm run dev`, which exposes `window.__lab`): headless Chrome for Testing, one browser for a list of shots. Not part of the app: a review aid, run through `shots.sh`, which takes the Mac's Chrome lock.
//   URL=http://localhost:5863/ OUT=~/.cache/lab-review/bioclimatic-house-lab/3d SHOTS=shots.json node shots.mjs
// Each shot: { name, scene, sim: {…params}, steps, store: {…}, cam: { pos: [x,y,z], target: [x,y,z] }, frame: [partIds], padding, wait }
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

const deps = process.env.LAB_REVIEW_DEPS ?? path.join(os.homedir(), '.cache/lab-review');
const puppeteer = createRequire(path.join(deps, 'index.js'))('puppeteer-core');
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const { URL: BASE, OUT, SHOTS } = process.env;
if (!BASE || !OUT || !SHOTS) throw new Error('Set URL, OUT and SHOTS.');
const W = Number(process.env.W ?? 1100);
const H = Number(process.env.H ?? 720);
fs.mkdirSync(OUT, { recursive: true });
const shots = JSON.parse(fs.readFileSync(SHOTS, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args:
    process.env.GL === 'swiftshader'
      ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars']
      : ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  let current = 'load';
  page.on('pageerror', (e) => errors.push({ at: current, text: String(e).slice(0, 400) }));
  page.on('console', (m) => m.type() === 'error' && errors.push({ at: current, text: m.text().slice(0, 400) }));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__lab && document.querySelector('.rail button'), { timeout: 240000 });
  await sleep(1500);
  const settle = async (ms = 500) => {
    await sleep(250);
    await page.waitForFunction(() => !window.__lab.stage.fly, { timeout: 60000 }).catch(() => {});
    await sleep(ms);
  };
  await page.evaluate(() => document.querySelector('.narr-invite__x')?.click());
  for (const s of shots) {
    current = s.name;
    const t0 = Date.now();
    // the world
    if (s.scene) {
      const n = await page.evaluate(() => document.querySelectorAll('.scene-switch button').length);
      for (let i = 0; i < n; i++) {
        const now = await page.evaluate(() => window.__lab.store.state.scene);
        if (now === s.scene) break;
        await page.evaluate((k) => document.querySelectorAll('.scene-switch button')[k].click(), i);
        await settle(800);
      }
      // a world built on its first visit takes a while to draw its first frames: wait until the stage shows it
      await page
        .waitForFunction((id) => window.__lab.stage.active?.id === id, { timeout: 240000 }, s.scene)
        .catch(() => {});
      await settle(1200);
    }
    await page.evaluate(() =>
      window.__lab.store.set({
        mode: 'explore',
        selected: null,
        isolate: false,
        xray: false,
        explode: 0,
        cutaway: false,
        schematic: false,
        labels: 'none',
        panelOpen: false,
      }),
    );
    if (s.sim) await page.evaluate((p) => window.__lab.engine.set(p), s.sim);
    if (s.steps)
      await page.evaluate((n) => {
        for (let i = 0; i < n; i++) window.__lab.engine.step(1 / 30);
      }, s.steps);
    if (s.store) await page.evaluate((p) => window.__lab.store.set(p), s.store);
    if (s.frame) {
      await page.evaluate((a) => window.__lab.stage.frameParts(a[0], a[1] ?? 1.6, undefined, 0), [s.frame, s.padding]);
    } else if (s.cam) {
      await page.evaluate((c) => {
        const st = window.__lab.stage;
        st.camera.position.set(...c.pos);
        st.controls.target.set(...c.target);
        if (c.fov) {
          st.camera.fov = c.fov;
          st.camera.updateProjectionMatrix();
        }
        st.controls.update();
      }, s.cam);
    } else if (s.home) {
      await page.evaluate(() => window.__lab.stage.frameAll(0));
    }
    await settle(s.wait ?? 600);
    const file = path.join(OUT, `${s.name}.png`);
    await page.screenshot({ path: file });
    console.log(`${s.name}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
} finally {
  await browser.close();
}
fs.writeFileSync(path.join(OUT, 'errors.json'), JSON.stringify(errors, null, 2));
console.log(`${shots.length} shots, ${errors.length} console errors`);
for (const e of errors.slice(0, 12)) console.log(`  [${e.at}] ${e.text}`);
