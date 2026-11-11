import { describe, expect, it } from 'vitest';

// The prototypes' position stays in the private cache: nothing in the lab says where the houses stand beyond « Odeillo ». `src/data/data.test.ts` reads the content and its documents and `src/three/worlds.test.ts` the worlds; this reads
// the rest: the lab's description, the panels, the cues, the simulation, the drawings, the README, the page, the manifest, the package and every document of the repository, and the spoken guide's scripts and notes
// (`narration/*.json`, `narration/README.md`: what the voice says is what the subtitles show, so it holds no more than « Odeillo » either; `src/narration.test.ts` adds the names of regions, ranges and communes).

const files = Object.entries(
  import.meta.glob(
    [
      './lab.ts',
      './cues.ts',
      './panels/*.ts',
      './sim/*.ts',
      './drawings/*.ts',
      '!./**/*.test.ts',
      '../README.md',
      '../index.html',
      '../package.json',
      '../public/lab.json',
      '../docs/*.md',
      '../BRIEF.md',
      '../narration/*.json',
      '../narration/README.md',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>,
);

describe('the prototypes’ position stays in the private cache, everywhere', () => {
  it('reads the files', () => {
    expect(files.length).toBeGreaterThan(30);
  });
  for (const [file, text] of files) {
    it(`${file} says no more than « Odeillo »`, () => {
      expect(text).not.toMatch(/42[.,]49\d?/);
      expect(text).not.toMatch(/\b2[.,]03\d?\b/);
      expect(text).not.toMatch(/Cami[ -]del[ -]Sol/i);
      expect(text).not.toMatch(/BATIMENT\d+/i);
      expect(text).not.toMatch(/\brue\s|\blat(?:itude)?\.? *\d|\d{1,2}\.\d{3,} *°/i);
    });
  }
});

// The second rule, the owner's standing one: no place beyond « Odeillo » in what the lab shows about the site and its sources. Not the commune, not its département, not a region, not the département's main city, not the town or the owner of a villa, not
// a record of the national heritage database (its page prints a street address), not a regional directorate's file (its address names a region and the département's code). The comparison sites of the sources stay: the inventors' second site, the German
// passive house, Princeton, Los Alamos. It reads the whole of `src/` that is not a test, the app's pages, the manifests of the spoken guide (their captions are the script), and every document of the repository.
const everything = Object.entries(
  import.meta.glob(
    [
      './**/*.ts',
      '!./**/*.test.ts',
      '../README.md',
      '../CLAUDE.md',
      '../index.html',
      '../package.json',
      '../public/lab.json',
      '../public/audio/*/manifest.json',
      '../docs/*.md',
      '../docs/qa/*.md',
      '../BRIEF.md',
      '../narration/*.json',
      '../narration/README.md',
      '../scripts/*.mjs',
      '../tools/**/*.mjs',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>,
);

/** What may never be written, by kind: the kind is the test's title, so that a failure says what came back without writing it. */
const NEVER: [kind: string, pattern: RegExp][] = [
  ['the commune', /font[- ]?romeu|odeillo[- ]via/i],
  ['the département', /pyr[ée]n[ée]es|\bmeuse\b/i],
  ['a region', /occitanie|bretagne|languedoc|roussillon|cerdagne|catalogne|catalan/i],
  ['the département’s main city', /perpignan/i],
  ['the town or the owner of a villa', /\bs[èe]te\b|p[ée]cout/i],
  ['the units’ names in a heritage record', /\bducarroir\b|\barmas\b/i],
  [
    'a heritage record’s id or page, or a file named with the département’s code',
    /\bPA\d{6,}\b|\bACR\d{6,}\b|\/notice\/merimee\/[a-z]+\d|\b66[_-]|_gaz_radon/i,
  ],
];

describe('no place beyond « Odeillo » is named: not a commune, a département, a region, a main city, a villa, a record or a regional file', () => {
  it('reads everything the rule covers', () => {
    expect(everything.length).toBeGreaterThan(80);
    expect(everything.some(([f]) => f.endsWith('narration/fr.json'))).toBe(true);
    expect(everything.some(([f]) => f.endsWith('docs/research.md'))).toBe(true);
    expect(everything.some(([f]) => f.endsWith('data/sources.ts'))).toBe(true);
  });
  for (const [kind, pattern] of NEVER) {
    it(`never writes ${kind}`, () => {
      const found = everything.flatMap(([file, text]) => {
        const m = text.match(
          new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`),
        );
        return m ? [`${file}: ${m.length}`] : [];
      });
      expect(found).toEqual([]);
    });
  }
  it('holds the rule on the Sources panel’s links: no address of a record, a town hall or a regional host', () => {
    const sources = everything.find(([f]) => f.endsWith('data/sources.ts'))![1];
    const hrefs = [...sources.matchAll(/'(https:\/\/[^']+)'/g)].map((m) => m[1]!);
    expect(hrefs.length).toBeGreaterThan(20);
    for (const href of hrefs) {
      expect(href).not.toMatch(/\/notice\//);
      expect(href).not.toMatch(/mairie|developpement-durable\.gouv\.fr/i);
    }
  });
});
