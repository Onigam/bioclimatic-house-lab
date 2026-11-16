#!/usr/bin/env node
// shots.mjs: views of the served lab as PNG, and the still-camera stability of each, for a material pass. One Chrome session, clocks pinned
// (frames and time move only when the tool steps them), the simulation paused: two runs of the same build give the same pixels. Take the
// Mac's Chrome lock first (one GPU job at a time, every agent):
//   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/shots.mjs --url http://localhost:5872/ --views tools/look/views.json --out DIR \
//     [--film] [--size 1080x1920] [--dpr 1] [--only a,b] [--still 12] [--pick x,y,z] [--zone 0.04,0.19,0.96,0.69]
// views.json: [{ id, world, pos:[x,y,z], target:[x,y,z], hour, day, preset, hide:['air-gap'], flows:false, xray:false, selected:null (a part: the kit frames it), settle: frames to wait (12), set:{...} }]
//   --film   the film's look (supersample 3, AO) as `render.look` of the Short asks for it
//   --zone   the film's subject zone (x0,y0,x1,y1 as shares of the frame; the Short's is 0.04,0.19,0.96,0.69): the projection is centred on it, as the film's runtime does (`camera.setViewOffset`), so that a still is the film's frame
//   --still  N frames of each view with the camera still (or drifting by `drift` metres a frame, [x, y, z]): the share of pixels whose second difference of luma is over 12 levels (the kit's
//            `shimmer`), the worst 32 x 32 block's share, and the share that changes by over 12 levels between two frames; `<id>-chg.png` is the map of those pixels (white: every frame)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const flag = (n) => argv.includes(`--${n}`);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [W, H] = opt('size', '1080x1920').split('x').map(Number);
const DPR = Number(opt('dpr', 1));
const OUT = path.resolve(opt('out', 'shots'));
fs.mkdirSync(OUT, { recursive: true });
const views = JSON.parse(fs.readFileSync(path.resolve(opt('views')), 'utf8')).filter(
  (v) => !opt('only') || opt('only').split(',').includes(v.id),
);
const STILL = Number(opt('still', 0));
const ZONE = opt('zone') ? opt('zone').split(',').map(Number) : null;

const HIDE = `#app > .topbar, #app > .rail, #app > .panel, #app > .strip, #viewport > .toolbar, #viewport > .peek,
  #viewport > .panel-toggle, #viewport > .narr, #viewport > .dv, #viewport > .label-layer { display: none !important; }
  #viewport { position: fixed !important; inset: 0 !important; }`;

function pinClocks() {
  let now = 0;
  let queue = new Map();
  let id = 0;
  performance.now = () => now;
  const RealDate = Date;
  const epoch = RealDate.UTC(2026, 5, 21, 10, 0, 0);
  window.Date = class extends RealDate {
    constructor(...a) {
      if (a.length) super(...a);
      else super(epoch + now);
    }
    static now() {
      return epoch + now;
    }
  };
  window.requestAnimationFrame = (cb) => (queue.set(++id, cb), id);
  window.cancelAnimationFrame = (k) => void queue.delete(k);
  let seed = 42;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  window.__step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      now += 1000 / 30;
      const q = queue;
      queue = new Map();
      for (const cb of q.values()) cb(now);
    }
  };
}

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
await page.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 300)));
page.on('console', (m) =>
  m.type() === 'error' && !m.text().includes('403') ? errors.push(m.text().slice(0, 300)) : 0,
);
await page.evaluateOnNewDocument((css) => {
  const add = () => {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.append(s);
  };
  if (document.head) add();
  else document.addEventListener('DOMContentLoaded', add);
}, HIDE);
await page.evaluateOnNewDocument(pinClocks);
await page.goto(opt('url'), { waitUntil: 'load', timeout: 180000 });
for (let i = 0; i < 900 && !(await page.evaluate(() => !!window.__lab?.stage)); i++)
  await new Promise((r) => setTimeout(r, 100));
await page.evaluate((film) => {
  const L = window.__lab;
  const st = L.stage;
  st.outline.enabled = false;
  st.outlineHover.enabled = false;
  L.store.set({ labels: 'none', panelOpen: false });
  st.setViewInsets({ top: 0, right: 0, bottom: 0, left: 0 }, false);
  document.querySelector('.narr-invite__x')?.click();
  if (film) st.setLook({ adaptive: false, supersample: 3, ao: true });
  window.__step(10);
}, flag('film'));

const results = {};
for (const v of views) {
  const res = await page.evaluate(
    async (v, still, zone) => {
      const L = window.__lab;
      const st = L.stage;
      const step = (n) => window.__step(n);
      L.store.set({
        scene: v.world,
        selected: null,
        xray: false,
        isolate: false,
        schematic: v.flows ?? false,
        labels: 'none',
      });
      step(30);
      const patch = { running: false };
      if (v.preset) patch.preset = v.preset;
      if (v.day != null) patch.day = v.day;
      if (v.hour != null) patch.hour = v.hour;
      Object.assign(patch, v.set ?? {});
      L.engine.set(patch);
      step(20);
      const mod = st.get(v.world);
      for (const name of v.hide ?? []) {
        const o = mod.scene.getObjectByName(name);
        if (o) for (const c of o.children) c.visible = false;
      }
      if (v.xray) L.store.set({ xray: true });
      if (v.selected) L.store.set({ selected: v.selected });
      st.fly = null;
      const c = st.controls;
      c.minDistance = 0;
      c.maxDistance = Infinity;
      if (v.pos) {
        st.camera.position.set(...v.pos);
        c.target.set(...v.target);
        c.update();
      }
      if (zone) {
        // the film's runtime: the projection centred on the subject zone, and the kit's insets no longer touch it
        const W = window.innerWidth;
        const H = window.innerHeight;
        st.setViewInsets = () => {};
        st.camera.aspect = W / H;
        st.camera.setViewOffset(
          W,
          H,
          W / 2 - ((zone[0] + zone[2]) / 2) * W,
          H / 2 - ((zone[1] + zone[3]) / 2) * H,
          W,
          H,
        );
        st.camera.updateProjectionMatrix();
      }
      step(v.settle ?? 12);
      const canvas = st.renderer.domElement;
      const out = { w: canvas.width, h: canvas.height };
      // the picture
      step(1);
      out.png = canvas.toDataURL('image/png');
      {
        // what the frame holds: the share of pixels at luma 5 or less and 8 or less, the mean luma, and the luma of each `probes` region (a quad of world points, projected: the mean and the 5th and 95th percentile)
        const gl = st.renderer.getContext();
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
        let lo5 = 0;
        let lo8 = 0;
        let sum = 0;
        for (let i = 0; i < w * h; i++) {
          const y = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2];
          sum += y;
          if (y <= 5) lo5++;
          if (y <= 8) lo8++;
        }
        out.lumaMean = +(sum / (w * h)).toFixed(1);
        out.lowShare5 = +((100 * lo5) / (w * h)).toFixed(2);
        out.lowShare8 = +((100 * lo8) / (w * h)).toFixed(2);
        st.camera.updateMatrixWorld();
        for (const [name, quad] of Object.entries(v.probes ?? {})) {
          const pts = quad.map(([x, y, z]) => {
            const p = { x, y, z };
            const q = new st.camera.position.constructor(p.x, p.y, p.z).project(st.camera);
            return [(q.x * 0.5 + 0.5) * w, (q.y * 0.5 + 0.5) * h];
          });
          const xs = pts.map((p) => p[0]);
          const ys = pts.map((p) => p[1]);
          const vals = [];
          for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(h - 1, Math.ceil(Math.max(...ys))); y++)
            for (
              let x = Math.max(0, Math.floor(Math.min(...xs)));
              x <= Math.min(w - 1, Math.ceil(Math.max(...xs)));
              x++
            ) {
              // inside a convex quad: the same side of every edge
              let pos = 0;
              let neg = 0;
              for (let k = 0; k < 4; k++) {
                const a = pts[k];
                const b = pts[(k + 1) % 4];
                const c = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
                if (c >= 0) pos++;
                else neg++;
              }
              if (pos === 4 || neg === 4) {
                const i = (y * w + x) * 4;
                vals.push(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
              }
            }
          vals.sort((a, b) => a - b);
          const n = vals.length;
          out[`probe-${name}`] = n
            ? {
                px: n,
                mean: +(vals.reduce((a, b) => a + b, 0) / n).toFixed(1),
                p5: +vals[Math.floor(n * 0.05)].toFixed(1),
                p95: +vals[Math.floor(n * 0.95)].toFixed(1),
                box: [
                  Math.round(Math.min(...xs)),
                  Math.round(Math.max(...xs)),
                  Math.round(Math.min(...ys)),
                  Math.round(Math.max(...ys)),
                ],
              }
            : null;
        }
      }
      if (still > 0) {
        const gl = st.renderer.getContext();
        const w = gl.drawingBufferWidth;
        const h = gl.drawingBufferHeight;
        const px = new Uint8Array(w * h * 4);
        const lum = () => {
          const l = new Float32Array(w * h);
          for (let i = 0, k = 0; i < l.length; i++, k += 4)
            l[i] = 0.2126 * px[k] + 0.7152 * px[k + 1] + 0.0722 * px[k + 2];
          return l;
        };
        let l0 = null;
        let l1 = null;
        let shim = 0;
        let chg = 0;
        let counted = 0;
        let cc = 0;
        const bw = Math.ceil(w / 32);
        const blocks = new Float64Array(bw * Math.ceil(h / 32));
        const blocksC = new Float64Array(blocks.length);
        const cnt = new Uint16Array(w * h);
        for (let f = 0; f < still; f++) {
          // a slow drift of the camera, as the film's: v.drift is metres a frame along x, y, z
          if (v.drift) {
            st.camera.position.x += v.drift[0];
            st.camera.position.y += v.drift[1];
            st.camera.position.z += v.drift[2];
            c.update();
          }
          step(1);
          gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
          const l = lum();
          if (l1) {
            let n = 0;
            for (let i = 0; i < l.length; i++)
              if (Math.abs(l[i] - l1[i]) > 12) {
                n++;
                cnt[i]++;
                blocksC[(((i / w) | 0) >> 5) * bw + ((i % w) >> 5)]++;
              }
            chg += n / l.length;
            cc++;
          }
          if (l0 && l1) {
            let n = 0;
            for (let i = 0; i < l.length; i++)
              if (Math.abs(l[i] - 2 * l1[i] + l0[i]) > 12) {
                n++;
                blocks[(((i / w) | 0) >> 5) * bw + ((i % w) >> 5)]++;
              }
            shim += n / l.length;
            counted++;
          }
          l0 = l1;
          l1 = l;
        }
        {
          // the map of the pixels that changed, white = every frame, upright
          const cv = document.createElement('canvas');
          cv.width = w;
          cv.height = h;
          const cx = cv.getContext('2d');
          const im = cx.createImageData(w, h);
          for (let y = 0; y < h; y++)
            for (let x = 0; x < w; x++) {
              const v8 = Math.min(255, (cnt[(h - 1 - y) * w + x] * 255) / Math.max(1, cc));
              const k = (y * w + x) * 4;
              im.data[k] = im.data[k + 1] = im.data[k + 2] = v8;
              im.data[k + 3] = 255;
            }
          cx.putImageData(im, 0, 0);
          out.chgmap = cv.toDataURL('image/png');
        }
        out.shimmerPct = +((100 * shim) / Math.max(1, counted)).toFixed(3);
        out.changedPct = +((100 * chg) / Math.max(1, cc)).toFixed(3);
        out.worstBlockPct = +((100 * Math.max(...blocks)) / (1024 * Math.max(1, counted))).toFixed(2);
        out.worstBlockChangedPct = +((100 * Math.max(...blocksC)) / (1024 * Math.max(1, cc))).toFixed(2);
      }
      for (const name of v.hide ?? []) {
        const o = mod.scene.getObjectByName(name);
        if (o) for (const c of o.children) c.visible = true;
      }
      return out;
    },
    v,
    STILL,
    ZONE,
  );
  fs.writeFileSync(path.join(OUT, `${v.id}.png`), Buffer.from(res.png.split(',')[1], 'base64'));
  if (res.chgmap) {
    fs.writeFileSync(path.join(OUT, `${v.id}-chg.png`), Buffer.from(res.chgmap.split(',')[1], 'base64'));
    delete res.chgmap;
  }
  delete res.png;
  results[v.id] = res;
  console.log(v.id, JSON.stringify(res));
}
fs.writeFileSync(path.join(OUT, 'stats.json'), JSON.stringify(results, null, 1));
if (errors.length) console.log('page errors:\n' + errors.join('\n'));
await browser.close();
