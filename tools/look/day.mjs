#!/usr/bin/env node
// day.mjs: how much the picture changes from one frame to the next across a day of the model's clock, camera still. The served lab, clocks pinned at 30 frames a second, the simulation running at `--scale` (the film's paces
// are x130 to x12 000), one world, one camera: for each frame the share of pixels whose luma changed by more than 4, 8 and 12 levels since the frame before, and the mean luma. The worst frame of the day is the answer: a sky
// that snaps shows as one frame with half the picture changed. Take the Chrome lock first:
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/day.mjs --url http://localhost:5872/ --scale 12000 [--hours 24] [--world wall] [--size 540x960] [--json out.json]
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [W, H] = opt('size', '540x960').split('x').map(Number);
const scale = Number(opt('scale', 12000));
const hours = Number(opt('hours', 24));
const world = opt('world', 'wall');
const pos = (opt('pos') ?? '3.8,2.25,0.24').split(',').map(Number);
const target = (opt('target') ?? '0,1.87,-0.6').split(',').map(Number);
const hour0 = Number(opt('hour', 12));
const src = fs.readFileSync(new URL('./shots.mjs', import.meta.url), 'utf8');
const pin = src.slice(src.indexOf('function pinClocks()'), src.indexOf('const browser'));
const HIDE = `#app > .topbar, #app > .rail, #app > .panel, #app > .strip, #viewport > .toolbar, #viewport > .peek,
  #viewport > .panel-toggle, #viewport > .narr, #viewport > .dv, #viewport > .label-layer { display: none !important; }
  #viewport { position: fixed !important; inset: 0 !important; }`;
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  protocolTimeout: 0,
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
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.evaluateOnNewDocument((css) => {
  const add = () => {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.append(s);
  };
  if (document.head) add();
  else document.addEventListener('DOMContentLoaded', add);
}, HIDE);
await page.evaluateOnNewDocument(new Function(`${pin}; pinClocks();`));
await page.goto(opt('url'), { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => !!window.__lab?.stage, { timeout: 120000 });
const res = await page.evaluate(
  (world, scale, hours, pos, target, hour0) => {
    const L = window.__lab;
    const st = L.stage;
    st.outline.enabled = false;
    st.outlineHover.enabled = false;
    L.store.set({ labels: 'none', panelOpen: false, scene: world, selected: null, schematic: false });
    st.setViewInsets({ top: 0, right: 0, bottom: 0, left: 0 }, false);
    window.__step(40);
    L.engine.set({ preset: 'prototype-1967', hour: hour0, day: 355, running: false });
    window.__step(20);
    st.fly = null;
    st.controls.minDistance = 0;
    st.camera.position.set(...pos);
    st.controls.target.set(...target);
    st.controls.update();
    window.__step(12);
    const gl = st.renderer.getContext();
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    const lum = () => {
      const l = new Float32Array(w * h);
      for (let i = 0, k = 0; i < l.length; i++, k += 4) l[i] = 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
      return l;
    };
    L.engine.set({ running: true, timeScale: scale });
    // frames for the model's `hours`: the clock moves scale / 30 seconds a frame
    const frames = Math.round((hours * 3600) / (scale / 30));
    let prev = null;
    const rows = [];
    for (let f = 0; f < frames; f++) {
      window.__step(1);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const l = lum();
      let c4 = 0;
      let c8 = 0;
      let c12 = 0;
      let sum = 0;
      for (let i = 0; i < l.length; i++) {
        sum += l[i];
        if (prev) {
          const d = Math.abs(l[i] - prev[i]);
          if (d > 4) c4++;
          if (d > 8) c8++;
          if (d > 12) c12++;
        }
      }
      const S = L.engine.state;
      rows.push([
        f,
        +S.hour.toFixed(2),
        +S.sunAltitude.toFixed(1),
        +(sum / l.length).toFixed(1),
        +((100 * c4) / l.length).toFixed(2),
        +((100 * c8) / l.length).toFixed(2),
        +((100 * c12) / l.length).toFixed(2),
      ]);
      prev = l;
    }
    return { frames, rows, pixels: w * h };
  },
  world,
  scale,
  hours,
  pos,
  target,
  hour0,
);
const rows = res.rows.slice(1);
const worst = (k) => rows.reduce((a, r) => (r[k] > a[k] ? r : a), rows[0]);
const summary = {
  scale,
  frames: res.frames,
  worstOver4: { frame: worst(4)[0], hour: worst(4)[1], alt: worst(4)[2], pct: worst(4)[4] },
  worstOver8: { frame: worst(5)[0], hour: worst(5)[1], alt: worst(5)[2], pct: worst(5)[5] },
  worstOver12: { frame: worst(6)[0], hour: worst(6)[1], alt: worst(6)[2], pct: worst(6)[6] },
  lumaStepMax: +Math.max(...rows.slice(1).map((r, i) => Math.abs(r[3] - rows[i][3]))).toFixed(1),
};
console.log(JSON.stringify(summary));
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify({ summary, rows: res.rows }));
await browser.close();
