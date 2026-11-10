import { beforeAll, describe, expect, it } from 'vitest';
import { setLang, tr } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { lab } from './lab';
import { HouseSim } from './sim/engine';
import { SimPanel } from './panels/sim';
import { FakeElement, installFakeDom } from './panels/test-dom';

// The wiring of src/lab.ts: the four worlds in their order with their tools, every shortcut and link leading somewhere, both guides, the lessons, the plans, the spoken guide's hook, and no leftover of the template.

beforeAll(() => installFakeDom());

const scenes = lab.scenes.map((s) => s.id);
const sceneOfPart = new Map(lab.parts.map((p) => [p.id, p.scene]));

describe('the lab as described to the kit', () => {
  it('has the four worlds in the order of the visit, the house first on arrival', () => {
    expect(scenes).toEqual(['site', 'house', 'wall', 'room']);
    expect(lab.defaultScene).toBe('house');
    expect(lab.id).toBe('bioclimatic-house-lab');
    expect(lab.sim).toBeInstanceOf(HouseSim);
  });

  it('gives each world its label, its tools and its overview, in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      const labels = lab.scenes.map((s) => tr(s.label));
      expect(labels).toEqual(
        lang === 'fr'
          ? ['Le plateau', 'La maison', 'Le mur', 'La pièce']
          : ['The plateau', 'The house', 'The wall', 'The room'],
      );
      for (const s of lab.scenes) {
        expect(tr(s.overview!.title).length, s.id).toBeGreaterThan(10);
        expect(tr(s.overview!.text).length, s.id).toBeGreaterThan(300);
      }
    }
    setLang('fr');
    const [site, house, wall, room] = lab.scenes;
    // the tools each world has: the section on the house only, no explode on the plateau, X-ray around a part on the plateau
    expect(site!.cutaway).toBe(false);
    expect(site!.explode).toBe(false);
    expect(site!.xrayNeedsSelection).toBe(true);
    expect(house!.cutaway).toBe(true);
    expect(wall!.cutaway).toBe(false);
    expect(room!.cutaway).toBe(false);
    for (const s of lab.scenes) expect(s.stepFrame, s.id).toBeDefined();
  });

  it('leads every shortcut and every part link to a world, and every linked part is a part of the catalogue', () => {
    for (const s of lab.scenes) {
      const actions = s.overview!.actions ?? [];
      expect(actions.length, s.id).toBeGreaterThan(0);
      expect(actions.filter((a) => a.primary).length, s.id).toBe(1);
      for (const a of actions) {
        expect(scenes, `${s.id}: ${tr(a.label)}`).toContain(a.scene);
        expect(a.scene, `${s.id} points at itself`).not.toBe(s.id);
        expect(tr(a.label).length).toBeGreaterThan(5);
      }
    }
    expect(lab.partLinks).toBeDefined();
    expect(Object.keys(lab.partLinks!).sort()).toEqual(['collector-element', 'interior-partitions', 'prototype-house']);
    for (const [part, link] of Object.entries(lab.partLinks!)) {
      expect(sceneOfPart.has(part), part).toBe(true);
      expect(scenes).toContain(link.scene);
      expect(link.scene, `${part} opens the world it stands in`).not.toBe(sceneOfPart.get(part));
    }
    expect(lab.partLinks!['collector-element']!.scene).toBe('wall');
    expect(lab.partLinks!['interior-partitions']!.scene).toBe('room');
    expect(lab.partLinks!['prototype-house']!.scene).toBe('house');
  });

  it('stands every part of the catalogue in one of the four worlds, and every step of both guides too', () => {
    for (const p of lab.parts) expect(scenes, p.id).toContain(p.scene);
    for (const guide of [lab.guides!.assembly!, lab.guides!.install!]) {
      expect(scenes).toContain(guide.scene);
      for (const step of guide.steps) {
        const world = step.scene ?? guide.scene;
        expect(scenes, step.id).toContain(world);
        for (const id of step.parts) expect(sceneOfPart.get(id), `${step.id}: ${id}`).toBe(world);
      }
    }
    expect(lab.guides!.assembly!.steps.length).toBe(20);
    expect(lab.guides!.install!.steps.length).toBe(10);
  });

  it('has seven lessons that open in a world of the lab, eight sheets in three groups, and the plans’ intro', () => {
    expect(lab.lessons!.items.length).toBe(7);
    for (const x of lab.lessons!.items) expect(scenes, x.id).toContain(x.focus.scene);
    expect(lab.plans!.sheets.length).toBe(8);
    const groups = lab.plans!.groups.map((g) => g.id);
    expect(groups).toEqual(['house', 'wall', 'balance']);
    for (const s of lab.plans!.sheets) expect(groups, s.id).toContain(s.group);
    expect(tr(lab.plans!.intro).length).toBeGreaterThan(100);
    expect(tr(lab.lessons!.intro).length).toBeGreaterThan(100);
  });

  it('says the lab’s title and tagline in both languages, and marks the envelope as the 3D’s measure', () => {
    // the kit sets the French typography: a no-break space before a colon or a question mark
    const plain = (text: string): string => text.replace(/[\u00a0\u202f]/g, ' ');
    setLang('fr');
    expect(plain(tr(lab.brand.title))).toBe('MAISON BIOCLIMATIQUE : LE MUR QUI GARDE LE SOLEIL');
    expect(plain(tr(lab.brand.tagline))).toBe('Une maison peut-elle se chauffer seule ?');
    setLang('en');
    expect(plain(tr(lab.brand.title))).toBe('BIOCLIMATIC HOUSE: THE WALL THAT KEEPS THE SUN');
    expect(tr(lab.brand.tagline)).toBe('Can a house heat itself?');
    setLang('fr');
    expect(lab.envelopeMark).toBe('*');
    expect(lab.video).toBeUndefined();
  });

  it('builds the simulation panel, the strip and the Sources panel', () => {
    const ctx = { sim: lab.sim } as unknown as AppContext<HouseSim>;
    const panel = lab.simPanel!(ctx);
    expect(panel).toBeInstanceOf(SimPanel);
    panel.render();
    expect((panel.el as unknown as FakeElement).find('.readout').length).toBeGreaterThan(8);
    expect(lab.strip.values(lab.sim).length).toBe(6);
    expect(lab.strip.clock(lab.sim).time).toMatch(/^\d\d:\d\d$/);
    expect(lab.strip.speeds).toContain(3600);
    const about = lab.about(ctx);
    expect(about.length).toBeGreaterThan(10);
  });

  it('offers the earth tube’s scenario on the sheets of its three parts, and on no other', () => {
    const ctx = { sim: new HouseSim() } as unknown as AppContext<HouseSim>;
    for (const p of lab.parts) {
      const buttons = lab.partActions!(ctx, p);
      expect(buttons.length, p.id).toBe(p.id.startsWith('earth-tube-') ? 1 : 0);
    }
    const [button] = lab.partActions!(
      ctx,
      lab.parts.find((p) => p.id === 'earth-tube-pipe')!,
    ) as unknown as FakeElement[];
    button!.click();
    expect((ctx.sim as HouseSim).scenarioNow).toBe('earth-tube');
    expect((ctx.sim as HouseSim).params.earthTube).toBe(true);
  });

  it('hands the spoken guide’s lab cues to the simulation, and asks for its manifest by language', () => {
    expect(lab.narration!.manifest).toBe('audio/{lang}/manifest.json');
    const ctx = { sim: new HouseSim() } as unknown as AppContext<HouseSim>;
    lab.narration!.onCue!(ctx, 'scenario', 'the-night');
    expect(ctx.sim.scenarioNow).toBe('the-night');
    lab.narration!.onCue!(ctx, 'flap', 'summer');
    expect(ctx.sim.params.mode).toBe('summer');
    // an unknown cue does nothing and does not throw
    lab.narration!.onCue!(ctx, 'no-such-cue', 'x');
    expect(ctx.sim.params.mode).toBe('summer');
  });
});

describe('the template’s leftovers are gone', () => {
  it('has no flywheel, no stand-in simulation, no review page and no template drawing in src', () => {
    const files = Object.keys(import.meta.glob(['./**/*.ts', './**/*.html'], { eager: false }));
    for (const f of files) {
      expect(f, f).not.toMatch(/\/three\/device\.ts$|\/sim\/placeholder\.ts$|\/three\/dev\/|\/drawings\/sheets\//);
    }
    expect(files.length).toBeGreaterThan(80);
  });
});
