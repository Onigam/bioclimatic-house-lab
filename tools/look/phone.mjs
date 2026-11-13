#!/usr/bin/env node
// phone.mjs: what a material pass costs a visitor on a phone. The served production build (with `__lab` exposed) in a 390 x 844 viewport at a pixel ratio of 3, the CPU slowed four times (Chrome's own throttle): the time from
// the page's start to the first frame, the wire bytes of the load, then per world the time to enter it, the time of a frame over 200 frames (and how many go over 33 ms) and what the renderer holds (textures,
// geometries, programs, draw calls, triangles). A Mac's GPU is not a phone's: the frame times compare a before with an after, they are not a phone's frame rate.
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/phone.mjs --url http://localhost:5880/ [--throttle 4] [--worlds house,wall,room,site] [--json out.json]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const url = opt('url', 'http://localhost:5880/');
const worlds = opt('worlds', 'house,wall,room,site').split(',');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: [
    '--use-gl=angle',
    '--use-angle=metal',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
    '--hide-scrollbars',
    '--mute-audio',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt('throttle', 4)) });
await cdp.send('Network.enable');
let wire = 0;
cdp.on('Network.loadingFinished', (e) => (wire += e.encodedDataLength));
const errors = [];
page.on('console', (m) =>
  m.type() === 'error' && !m.text().includes('403') ? errors.push(m.text().slice(0, 400)) : 0,
);
// a first load warms the server's own caches, so that the second measures the page
await page.goto(url, { waitUntil: 'networkidle2' });
await page.waitForFunction(() => window.__lab?.stage, { timeout: 120000 });
wire = 0;
const t0 = Date.now();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__lab?.stage?.renderer?.info?.render?.frame > 2, {
  timeout: 120000,
  polling: 16,
});
const firstFrame = Date.now() - t0;
const wireAtFirst = wire;
const out = await page.evaluate(async (ids) => {
  const L = window.__lab;
  const st = L.stage;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  const res = {};
  const first = L.store.state.scene;
  const order = [first, ...ids.filter((i) => i !== first)];
  for (const id of order) {
    const t = performance.now();
    if (id !== first) L.store.set({ scene: id });
    await raf();
    await raf();
    await raf();
    const enter = performance.now() - t;
    await wait(2500);
    const f0 = st.renderer.info.render.frame;
    const dts = [];
    let last = performance.now();
    for (let i = 0; i < 200; i++) {
      await raf();
      const n = performance.now();
      dts.push(n - last);
      last = n;
    }
    dts.sort((a, b) => a - b);
    const info = st.renderer.info;
    res[id] = {
      enterMs: Math.round(enter),
      frameMs: +(dts.reduce((a, b) => a + b, 0) / dts.length).toFixed(1),
      p95Ms: +dts[Math.floor(dts.length * 0.95)].toFixed(1),
      over33: dts.filter((d) => d > 33).length,
      framesDrawn: info.render.frame - f0,
      calls: info.render.calls,
      triangles: info.render.triangles,
      textures: info.memory.textures,
      geometries: info.memory.geometries,
      programs: info.programs?.length ?? null,
      pixelRatio: st.renderer.getPixelRatio(),
    };
  }
  return res;
}, worlds);
const result = {
  url,
  throttle: Number(opt('throttle', 4)),
  firstFrameMs: firstFrame,
  wireBytesAtFirstFrame: wireAtFirst,
  wireBytesAll: wire,
  worlds: out,
  errors,
};
console.log(JSON.stringify(result, null, 1));
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify(result, null, 1));
await browser.close();
