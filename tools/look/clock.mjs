#!/usr/bin/env node
// clock.mjs: a schedule of the model's clock replayed frame by frame in the served lab, camera still, clocks pinned at 30 frames a second, one world (the `wall`), and for each frame: the clock, the state's sun and the
// sun the picture shows (`shownSun`, absent before round 3), the share of pixels that changed by over 12 levels since the frame before, the mean luma, how far the sky's rows moved (levels, the largest of any row and
// channel), the fog's red, `sun` the strength the disc and shafts are drawn at, the pixels of the sky's upper right (clear of the wall) that are almost white, and the share of a strip of the frame (the glazing) that changed. Take the Chrome lock first:
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/clock.mjs --url http://localhost:5872/ --schedule "set:12,355:30;run:10800:20;run:5885:78;run:32040:27;stop:60" --json out.json \
//     [--size 540x960] [--whitefrom 0.4 (the share of the width the disc count starts at)] [--pos 3.95,2.27,0.3] [--target 0,1.87,-0.6] [--strip x0,y0,x1,y1] [--probe x0,y0,x1,y1 (the mean luma of a box, e.g. the black face)] [--frames DIR --every 4 --from 90 --to 170] [--preset prototype-1967]
// segments: `set:HOUR,DAY[:FRAMES]` (the clock set, paused, FRAMES of the picture to settle, 20), `run:SCALE:FRAMES`, `stop:FRAMES`. The Short's coda is "set:12,355:30;run:10800:20;run:5885:78;run:32040:27;stop:60";
// its B4 "set:17,355:30;run:8439.7:100;stop:60".
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [W, H] = opt('size', '540x960').split('x').map(Number);
const pos = (opt('pos') ?? '3.95,2.27,0.3').split(',').map(Number);
const target = (opt('target') ?? '0,1.87,-0.6').split(',').map(Number);
const whiteFrom = Number(opt('whitefrom', 0.4));
const probe = opt('probe') ? opt('probe').split(',').map(Number) : null;
const strip = opt('strip') ? opt('strip').split(',').map(Number) : null;
const schedule = opt('schedule', 'set:12,355:30;run:10800:20;run:5885:78;run:32040:27;stop:60')
  .split(';')
  .map((s) => {
    const [kind, a, b] = s.split(':');
    if (kind === 'set') {
      const [hour, day] = a.split(',').map(Number);
      return { kind, hour, day, frames: Number(b ?? 20) };
    }
    if (kind === 'run') return { kind, scale: Number(a), frames: Number(b) };
    return { kind: 'stop', frames: Number(a) };
  });
const saveDir = opt('frames');
const every = Number(opt('every', 4));
const from = Number(opt('from', 0));
const to = Number(opt('to', 1e9));
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
  (schedule, pos, target, strip, preset, wantFrames, every, from, to, whiteFrom, probe) => {
    const L = window.__lab;
    const st = L.stage;
    st.outline.enabled = false;
    st.outlineHover.enabled = false;
    L.store.set({ labels: 'none', panelOpen: false, scene: 'wall', selected: null, schematic: false });
    st.setViewInsets({ top: 0, right: 0, bottom: 0, left: 0 }, false);
    window.__step(40);
    L.engine.set({ preset, hour: 12, day: 355, running: false });
    window.__step(20);
    st.fly = null;
    st.controls.minDistance = 0;
    st.camera.position.set(...pos);
    st.controls.target.set(...target);
    st.controls.update();
    window.__step(12);
    const mod = st.get('wall');
    const gl = st.renderer.getContext();
    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;
    const px = new Uint8Array(w * h * 4);
    const lum = () => {
      const l = new Float32Array(w * h);
      for (let i = 0, k = 0; i < l.length; i++, k += 4) l[i] = 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
      return l;
    };
    const rows = [];
    const frames = [];
    let prev = null;
    let prevSky = null;
    let f = 0;
    const frame = (seg) => {
      window.__step(1);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const l = lum();
      let c12 = 0;
      let sum = 0;
      let white = 0;
      let stripC = 0;
      let stripN = 0;
      let probeSum = 0;
      let probeN = 0;
      // readPixels is bottom up: the sky's upper half is the high rows
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          sum += l[i];
          if (prev && Math.abs(l[i] - prev[i]) > 12) c12++;
          if (y > h * 0.45 && x >= w * whiteFrom && l[i] > 250) white++;
          if (probe) {
            const yy = h - 1 - y;
            if (x >= probe[0] && x < probe[2] && yy >= probe[1] && yy < probe[3]) {
              probeSum += l[i];
              probeN++;
            }
          }
          if (strip) {
            const yy = h - 1 - y;
            if (x >= strip[0] && x < strip[2] && yy >= strip[1] && yy < strip[3]) {
              stripN++;
              if (prev && Math.abs(l[i] - prev[i]) > 12) stripC++;
            }
          }
        }
      const bg = mod.scene.background;
      const data = bg && bg.image && bg.image.data ? Array.from(bg.image.data) : null;
      let skyStep = 0;
      if (data && prevSky)
        for (let k = 0; k < data.length; k++)
          if (k % 4 !== 3) skyStep = Math.max(skyStep, Math.abs(data[k] - prevSky[k]));
      prevSky = data;
      const S = L.engine.state;
      rows.push({
        f,
        seg,
        hour: +S.hour.toFixed(3),
        simTime: Math.round(S.simTime),
        alt: +S.sunAltitude.toFixed(2),
        shown: typeof mod.shownSun === 'number' ? +mod.shownSun.toFixed(2) : null,
        luma: +(sum / l.length).toFixed(2),
        c12: +((100 * c12) / l.length).toFixed(3),
        skyStep,
        fogR: +mod.scene.fog.color.r.toFixed(4),
        white,
        probe: probe ? +(probeSum / Math.max(1, probeN)).toFixed(2) : null,
        sun: (() => {
          const m = mod.scene.getObjectByName('sunlight');
          return m && m.material.uniforms.uSun ? +m.material.uniforms.uSun.value.toFixed(3) : null;
        })(),
        strip: strip ? +((100 * stripC) / Math.max(1, stripN)).toFixed(3) : null,
      });
      if (wantFrames && f >= from && f <= to && (f - from) % every === 0)
        frames.push([f, st.renderer.domElement.toDataURL('image/jpeg', 0.7)]);
      prev = l;
      f++;
    };
    schedule.forEach((s, seg) => {
      if (s.kind === 'set') L.engine.set({ hour: s.hour, day: s.day, running: false });
      else if (s.kind === 'run') L.engine.set({ running: true, timeScale: s.scale });
      else L.engine.set({ running: false });
      for (let i = 0; i < s.frames; i++) frame(seg);
    });
    return { rows, frames, pixels: w * h };
  },
  schedule,
  pos,
  target,
  strip,
  opt('preset', 'prototype-1967'),
  !!saveDir,
  every,
  from,
  to,
  whiteFrom,
  probe,
);
if (saveDir) {
  fs.mkdirSync(saveDir, { recursive: true });
  for (const [f, url] of res.frames)
    fs.writeFileSync(
      path.join(saveDir, `f${String(f).padStart(4, '0')}.jpg`),
      Buffer.from(url.split(',')[1], 'base64'),
    );
}
const body = res.rows.slice(1);
const worst = body.reduce((a, r) => (r.c12 > a.c12 ? r : a), body[0]);
const summary = {
  frames: res.rows.length,
  worstC12: { pct: worst.c12, frame: worst.f, hour: worst.hour },
  worstSkyStep: Math.max(...body.map((r) => r.skyStep)),
  whiteMax: Math.max(...body.map((r) => r.white)),
  stripWorst: strip ? Math.max(...body.map((r) => r.strip)) : null,
};
console.log(JSON.stringify(summary));
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify({ summary, schedule, rows: res.rows }));
await browser.close();
