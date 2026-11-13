#!/usr/bin/env node
// mapcost.mjs: what each procedural map costs to draw at a phone's profile: a fresh page of the dev server (no map drawn yet), the CPU slowed four times, each map made once and timed (cold, as a visitor's first world
// makes it). Take the Chrome lock first:   ~/Dev/onigam-video/tools/with-chrome-lock.sh node tools/look/mapcost.mjs --url http://localhost:5872/ [--throttle 4]
import { createRequire } from 'node:module';
const require = createRequire(`${process.env.HOME}/.cache/lab-review/`);
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const opt = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const CHROME =
  process.env.CHROME ??
  `${process.env.HOME}/.cache/puppeteer/chrome/mac_arm-154.0.8037.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const url = opt('url', 'http://localhost:5872/');
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.goto(new URL('robots.txt', url).href);
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(opt('throttle', 4)) });
const names = (opt('maps') ?? '').split(',').filter(Boolean);
const res = await page.evaluate(
  async (src, names) => {
    const t = await import(src);
    const out = {};
    const list = names.length ? names : Object.keys(t).filter((k) => /Map$/.test(k));
    for (const k of list) {
      const a = performance.now();
      t[k]();
      out[k] = +(performance.now() - a).toFixed(1);
    }
    return out;
  },
  new URL('src/three/textures.ts', url).href,
  names,
);
console.log(JSON.stringify(res, null, 1));
await browser.close();
