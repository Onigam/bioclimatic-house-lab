import { describe, expect, it } from 'vitest';

// The prototypes' position stays in the private cache: nothing in the lab says where the houses stand beyond « Odeillo ». `src/data/data.test.ts` reads the content and its documents and `src/three/worlds.test.ts` the worlds; this reads
// the rest: the lab's description, the panels, the cues, the simulation, the drawings, the README, the page, the manifest, the package and every document of the repository.

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
