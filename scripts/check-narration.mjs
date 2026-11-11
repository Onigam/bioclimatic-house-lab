// Checks that every spoken segment of `public/audio/<lang>/manifest.json` has its audio file next to it and that the
// manifest matches the script it was generated from (`narration/<lang>.json`), then that each script keeps the « AI slop »
// index of the narration style guide (scripts/slop-check.mjs: at most 0.8 stock-pattern hits per 1,000 characters and no
// pattern over its ceiling). Run by `npm run build`.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const audio = join(root, 'public/audio');
const problems = [];

// no audio yet (the script alone is written): nothing to check
for (const lang of existsSync(audio) ? readdirSync(audio) : []) {
  const dir = join(audio, lang);
  if (!statSync(dir).isDirectory()) continue;
  // an empty folder is no audio yet either: the voice's run creates the folders before it writes anything
  if (!readdirSync(dir).some((name) => !name.startsWith('.'))) continue;
  const manifestPath = join(dir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    problems.push(`${lang}: files but no manifest.json`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const scriptPath = join(root, 'narration', `${lang}.json`);
  const script = existsSync(scriptPath) ? JSON.parse(readFileSync(scriptPath, 'utf8')) : null;
  const ids = new Set();
  for (const seg of manifest.segments) {
    if (ids.has(seg.id)) problems.push(`${lang}: duplicate segment ${seg.id}`);
    ids.add(seg.id);
    if (!existsSync(join(dir, seg.file))) problems.push(`${lang}: missing audio file ${seg.file}`);
  }
  if (!ids.has('intro')) problems.push(`${lang}: no intro segment`);
  if (script) {
    for (const seg of script.segments)
      if (!ids.has(seg.id)) problems.push(`${lang}: ${seg.id} is in the script, not in the manifest`);
    for (const id of ids)
      if (!script.segments.some((s) => s.id === id))
        problems.push(`${lang}: ${id} is in the manifest, not in the script`);
  }
}

// the slop index of each script (the patterns of the style guide; the same check as src/narration.test.ts)
const TICS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P10', 'P11', 'P12', 'P13', 'P14', 'P17', 'P19'];
const TIC_CEILING = 0.8;
const scriptsDir = join(root, 'narration');
for (const file of existsSync(scriptsDir) ? readdirSync(scriptsDir).filter((f) => /^[a-z]{2}\.json$/.test(f)) : []) {
  const lang = file.slice(0, 2);
  const run = spawnSync(
    process.execPath,
    [join(root, 'scripts/slop-check.mjs'), join(scriptsDir, file), '--lang', lang, '--json'],
    {
      encoding: 'utf8',
    },
  );
  let report;
  try {
    report = JSON.parse(run.stdout);
  } catch {
    problems.push(`${lang}: the slop check did not run (${run.stderr.trim().slice(0, 200)})`);
    continue;
  }
  const tic = report.rows.filter((r) => TICS.includes(r.id.split('-')[0])).reduce((n, r) => n + r.hits, 0);
  const index = (tic * 1000) / report.chars;
  if (index > TIC_CEILING)
    problems.push(`${lang}: slop index ${index.toFixed(2)} per 1,000 characters, over ${TIC_CEILING}`);
  for (const r of report.rows)
    if (r.over) problems.push(`${lang}: ${r.id} is over its ceiling (${r.hits} hits, ${r.allowed} allowed)`);
  console.log(`narration slop ${lang}: ${index.toFixed(2)} per 1,000 characters (${tic} hits in ${report.chars})`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
