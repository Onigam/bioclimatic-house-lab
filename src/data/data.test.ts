import { describe, expect, it } from 'vitest';
import { ALL_PART_IDS, PART_IDS, WHAT_IF_PARTS, WORLD_IDS, type WorldId } from '../three/ids';
import { LAB_STRINGS } from '../i18n/ui';
import { ASSEMBLY } from './assembly';
import { FIG, markOf, type Fig } from './figures';
import { INSTALL } from './install';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { ACCESS, LAW, SOURCES } from './sources';
import { KNOWN } from './reported';
import { numbersIn, visitorTexts } from './texts';

// The checks of the visitor's texts: the catalogue against the 3D's ids, every sheet complete in both languages, the guides against the worlds, every number from a source or tagged, nothing said twice that is to be said once, nothing that says where
// the houses stand. The lessons have their own file.

const SECTION = {
  fr: ['Panne à prévoir.', 'À vérifier.', 'Entretien.'],
  en: ['Typical failure.', 'How to check.', 'Maintenance.'],
} as const;

describe('the catalogue', () => {
  it('holds the 56 ids of the 3D, once each, each in the world that draws it', () => {
    expect(PARTS.length).toBe(56);
    expect(new Set(PARTS.map((p) => p.id)).size).toBe(56);
    expect([...PARTS.map((p) => p.id)].sort()).toEqual([...ALL_PART_IDS].sort());
    for (const w of WORLD_IDS) {
      const ids = PARTS.filter((p) => p.scene === w).map((p) => p.id);
      expect([...ids].sort(), w).toEqual([...PART_IDS[w]].sort());
    }
    expect(WORLD_IDS.map((w) => PART_IDS[w].length)).toEqual([11, 18, 14, 13]);
  });

  it('gives each part a sheet: name, one line, an overview, a material, four specs at least, maintenance in three paragraphs, a tip and a design note, in both languages', () => {
    const cats = ['hydraulic', 'mechanical', 'electrical', 'structure', 'site'];
    for (const p of PARTS) {
      expect(cats, p.id).toContain(p.category);
      for (const lang of ['fr', 'en'] as const) {
        expect(p.name[lang].length, `${p.id} name ${lang}`).toBeGreaterThan(2);
        expect(p.short[lang].length, `${p.id} short ${lang}`).toBeGreaterThan(60);
        expect(p.short[lang].length, `${p.id} short ${lang}`).toBeLessThan(260);
        expect(p.description[lang].length, `${p.id} description ${lang}`).toBeGreaterThan(330);
        expect(p.description[lang].length, `${p.id} description ${lang}`).toBeLessThan(1500);
        expect(p.material[lang].length, `${p.id} material ${lang}`).toBeGreaterThan(3);
        expect(p.tip?.[lang].length ?? 0, `${p.id} tip ${lang}`).toBeGreaterThan(40);
        expect(p.design?.[lang].length ?? 0, `${p.id} design ${lang}`).toBeGreaterThan(80);
        const m = p.maintenance?.[lang] ?? '';
        const paras = m.split(/\n\s*\n/);
        expect(paras.length, `${p.id} maintenance ${lang}`).toBe(3);
        paras.forEach((para, i) =>
          expect(para.startsWith(`**${SECTION[lang][i]}**`), `${p.id} ${lang} para ${i}`).toBe(true),
        );
        for (const para of paras) expect(para.length, `${p.id} ${lang}`).toBeGreaterThan(40);
      }
      expect(p.specs.length, p.id).toBeGreaterThanOrEqual(3);
      for (const s of p.specs) {
        expect(s.label.fr.length + s.label.en.length, p.id).toBeGreaterThan(4);
        const val = typeof s.value === 'string' ? s.value : `${s.value.fr}${s.value.en}`;
        expect(val.length, `${p.id}: ${s.label.en}`).toBeGreaterThan(0);
      }
    }
  });

  it('writes English with a British spelling and no French left in it', () => {
    for (const [where, t] of visitorTexts()) {
      expect(t.en, where).not.toMatch(/\b(color|gray|meter|center|license|defense|neighbor|favorite|aluminum)\b/i);
      expect(t.en, where).not.toMatch(/ à |« |»| de la | d’un | des |’un | est un /);
    }
  });

  it('puts the what-if only on the earth tube’s three sheets, and says it is a hypothesis once, on the pipe', () => {
    const tube = PARTS.filter((p) => WHAT_IF_PARTS.includes(p.id));
    expect(tube.map((p) => p.id).sort()).toEqual([...WHAT_IF_PARTS].sort());
    for (const p of tube) {
      expect(p.name.fr, p.id).toMatch(/et si/);
      expect(p.name.en, p.id).toMatch(/what if/);
    }
    const said = PARTS.filter((p) =>
      /ne mentionne de puits canadien dans cette maison|mentions an earth tube in this house/.test(
        `${p.description.fr} ${p.description.en}`,
      ),
    );
    expect(said.map((p) => p.id)).toEqual(['earth-tube-pipe']);
  });
});

describe('the guides', () => {
  const home = (id: string) => PARTS.find((p) => p.id === id)!;

  it('meet the bar: 20 steps to put it together, 10 to place it, each step in a world, framing parts that stand there', () => {
    expect(ASSEMBLY.length).toBe(20);
    expect(INSTALL.length).toBe(10);
    for (const guide of [ASSEMBLY, INSTALL]) {
      expect(new Set(guide.map((s) => s.id)).size).toBe(guide.length);
      for (const s of guide) {
        expect(WORLD_IDS as readonly string[], s.id).toContain(s.scene);
        expect(s.parts.length, s.id).toBeGreaterThan(0);
        for (const id of s.parts) {
          expect(home(id), `${s.id}: ${id}`).toBeDefined();
          expect(home(id).scene, `${s.id}: ${id}`).toBe(s.scene);
          expect(PART_IDS[s.scene as WorldId], `${s.id}: ${id}`).toContain(id);
        }
        for (const lang of ['fr', 'en'] as const) {
          expect(s.title[lang].length, s.id).toBeGreaterThan(4);
          expect(s.text[lang].length, `${s.id} ${lang}`).toBeGreaterThan(220);
          expect(s.text[lang].length, `${s.id} ${lang}`).toBeLessThan(900);
        }
      }
    }
  });

  it('installs each part that someone makes in exactly one step; the earth tube, the living and the scenery are not installed, they appear', () => {
    const count = new Map<string, number>();
    for (const s of ASSEMBLY) for (const id of s.parts) count.set(id, (count.get(id) ?? 0) + 1);
    for (const [id, n] of count) expect(n, id).toBe(1);
    const apart = ['air-gap', 'inner-wall-face', 'warm-air-jet', 'floor-return', 'armchair', ...WHAT_IF_PARTS];
    for (const w of ['house', 'wall', 'room'] as const)
      for (const id of PART_IDS[w]) expect(count.has(id) || apart.includes(id), `${w}: ${id}`).toBe(true);
    for (const id of apart) expect(count.has(id), id).toBe(false);
    expect(count.has('granite-slope')).toBe(true);
    for (const s of INSTALL) for (const id of s.parts) expect(home(id), id).toBeDefined();
  });

  it('end each step on its origin, and say once at the top of each guide that this is no procedure', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.text.fr, s.id).toMatch(/\*\*Origine\*\* : [^*]+\.$/);
      expect(s.text.en, s.id).toMatch(/\*\*Origin\*\*: [^*]+\.$/);
    }
    expect(ASSEMBLY[0]!.text.fr).toMatch(/pas un plan à suivre/);
    expect(ASSEMBLY[0]!.text.en).toMatch(/not a plan to follow/);
    expect(INSTALL[0]!.text.fr).toMatch(/pas une marche à suivre/);
    expect(INSTALL[0]!.text.en).toMatch(/not a procedure to follow/);
    const said = [...ASSEMBLY, ...INSTALL].filter((s) =>
      /pas un plan à suivre|pas une marche à suivre|not a plan to follow|not a procedure/.test(
        `${s.text.fr} ${s.text.en}`,
      ),
    );
    expect(said.map((s) => s.id)).toEqual([ASSEMBLY[0]!.id, INSTALL[0]!.id]);
  });

  it('give no recipe: no torque, no tool list, no duration; five warnings in all, each where the gesture is risky', () => {
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(s.torque, s.id).toBeUndefined();
      expect(s.tools, s.id).toBeUndefined();
      expect(s.duration, s.id).toBeUndefined();
    }
    expect(ASSEMBLY.filter((s) => s.warning).map((s) => s.id)).toEqual(['storage-wall', 'glazing', 'heating']);
    expect(INSTALL.filter((s) => s.warning).map((s) => s.id)).toEqual(['summer-position', 'fresh-air']);
    expect(ASSEMBLY.find((s) => s.id === 'storage-wall')!.warning!.en).toMatch(/engineer/);
    expect(ASSEMBLY.find((s) => s.id === 'glazing')!.warning!.en).toMatch(/safety glass/);
    expect(ASSEMBLY.find((s) => s.id === 'heating')!.warning!.en).toMatch(/electrician/);
    expect(INSTALL.find((s) => s.id === 'summer-position')!.warning!.en).toMatch(/vents shut/);
    expect(INSTALL.find((s) => s.id === 'fresh-air')!.warning!.en).toMatch(/carbon monoxide/);
  });
});

describe('the overviews', () => {
  it('give each world a title and a text, and say once what is to be said once', () => {
    expect(Object.keys(OVERVIEWS)).toEqual([...WORLD_IDS]);
    for (const w of WORLD_IDS)
      for (const lang of ['fr', 'en'] as const) {
        expect(OVERVIEWS[w].title[lang].length, w).toBeGreaterThan(12);
        expect(OVERVIEWS[w].text[lang].length, `${w} ${lang}`).toBeGreaterThan(500);
        expect(OVERVIEWS[w].text[lang].length, `${w} ${lang}`).toBeLessThan(1700);
      }
    const has = (re: RegExp) => WORLD_IDS.filter((w) => re.test(`${OVERVIEWS[w].text.fr} ${OVERVIEWS[w].text.en}`));
    expect(has(/Les chiffres\*\* : sans marque/)).toEqual(['site']);
    expect(has(/composé, pas cartographié/)).toEqual(['site']);
    expect(has(/ne mentionne de puits canadien dans cette maison/)).toEqual(['house']);
    expect(has(/toujours coupé/)).toEqual(['wall']);
    expect(has(/La caméra est dans la pièce/)).toEqual(['room']);
  });
});

describe('every text', () => {
  const all = visitorTexts();

  it('has both languages, neither empty, no placeholder left, no research reference, no missing figure', () => {
    expect(all.length).toBeGreaterThan(500);
    for (const [where, t] of all) {
      for (const x of [t.fr, t.en]) {
        expect(x.trim().length, where).toBeGreaterThan(0);
        expect(x, where).not.toMatch(/[{}]|TODO|lorem|à remplacer|to replace/i);
        expect(x, where).not.toMatch(/\bundefined\b|\bNaN\b/);
        expect(x, where).not.toMatch(/\bK\d{1,3}[a-d]?\b|\bS\d{1,2}\b|\bV\d\b|\(K\d/);
      }
    }
  });

  it('says in English what it says in French, number for number', () => {
    const bad: string[] = [];
    for (const [where, t] of all) {
      const a = numbersIn(t.fr, 'fr').sort((x, y) => x - y);
      const b = numbersIn(t.en, 'en').sort((x, y) => x - y);
      if (a.join(' ') !== b.join(' ')) bad.push(`${where}: ${a.join(' ')} / ${b.join(' ')}`);
    }
    expect(bad).toEqual([]);
  });

  it('takes every number from a source, or from a figure that carries its mark', () => {
    const allowed = new Set<number>(KNOWN);
    for (const f of Object.values(FIG) as Fig[]) {
      if (f.t)
        for (const w of f.t)
          for (const lang of ['fr', 'en'] as const) numbersIn(w, lang).forEach((n) => allowed.add(n));
      else allowed.add(Math.round(f.v * 10 ** f.d) / 10 ** f.d);
    }
    const unknown = new Map<number, string>();
    for (const [where, t] of all) {
      for (const [lang, text] of [
        ['fr', t.fr],
        ['en', t.en],
      ] as const)
        for (const n of numbersIn(text, lang)) if (!allowed.has(n) && !unknown.has(n)) unknown.set(n, where);
    }
    expect([...unknown].map(([n, w]) => `${n} (${w})`)).toEqual([]);
  });

  it('puts a mark after every figure the lab computes or estimates: a † or a * follows its number and its unit', () => {
    // every FIG entry's rendering ends in its mark; a figure of this file never reaches a text without it
    for (const f of Object.values(FIG) as Fig[]) expect(['†', '*']).toContain(markOf(f.s));
    for (const [where, t] of all) {
      for (const lang of ['fr', 'en'] as const) {
        // a mark never stands alone or after a space (but for the legend of the marks, said once in the first overview)
        if (!/Les chiffres\*\* :|The figures\*\*:/.test(t[lang])) expect(t[lang], where).not.toMatch(/ [†*](?![*\w])/);
        // an empty bold
        expect(t[lang], where).not.toMatch(/\*\*\s*\*\*/);
      }
    }
  });

  it('says « educational reconstruction » and « this is a model » nowhere but where they belong: not on a sheet, a step, a lesson or an overview', () => {
    for (const [where, t] of all) {
      for (const x of [t.fr, t.en]) {
        expect(x, where).not.toMatch(
          /reconstitution (pédagogique|indépendante)|(educational|independent) reconstruction/i,
        );
        expect(x, where).not.toMatch(/ceci est un modèle|this is a model|un modèle simple|a simple model/i);
      }
    }
    expect(LAB_STRINGS.safety[1]).toMatch(/educational reconstruction/);
    expect(LAB_STRINGS.disclaimer[1]).toMatch(/independent reconstruction/);
  });

  it('keeps the warnings once: the engineer, the electrician, the carbon monoxide and the law are not repeated on the sheets', () => {
    const outside = all.filter(
      ([where]) => !/^(storage-wall|glazing|heating|summer-position|fresh-air)\.warning$/.test(where),
    );
    for (const [where, t] of outside) {
      expect(t.en, where).not.toMatch(/structural engineer|an engineer’s|safety glass|carbon monoxide/i);
      expect(t.en, where).not.toMatch(/\bthe law\b|\blegal (advice|opinion)\b|\bby law\b/i);
    }
  });

  it('names a tool in a tip only if its world has it: no section in the plateau, the wall and the room, no explode nor slow motion on the plateau', () => {
    for (const p of PARTS) {
      const tip = `${p.tip?.fr} ${p.tip?.en}`;
      if (p.scene !== 'house') expect(tip, p.id).not.toMatch(/\bCoupe\b|\bSection\b/);
      if (p.scene === 'site') expect(tip, p.id).not.toMatch(/Éclaté|Explode|Ralenti|Slow-mo/);
    }
  });

  it('gives no sheet a promise of safety', () => {
    for (const [where, t] of all) {
      for (const x of [t.fr, t.en])
        expect(x, where).not.toMatch(/sans risque|sûr à habiter|risk-free|completely safe|nuit à personne/i);
    }
  });
});

describe('the sources', () => {
  it('credit and link every source of the research that the lab uses, each saying how it was read', () => {
    const items = SOURCES.flatMap((g) => g.items);
    expect(items.length).toBeGreaterThanOrEqual(20);
    for (const s of items) {
      expect(Object.keys(ACCESS)).toContain(s.access);
      expect(s.fr.length + s.en.length, s.label[1]).toBeGreaterThan(60);
      if (s.href) expect(s.href, s.label[1]).toMatch(/^https:\/\//);
    }
    const labels = items.map((s) => s.label.join(' ')).join(' ');
    for (const who of [
      'Trombe',
      'Kelbaugh',
      'Balcomb',
      'Pfafferott',
      'Morse',
      'PVGIS',
      'IGN',
      'Penn Ar Web',
      'Mérimée',
      'Passive House',
    ])
      expect(labels, who).toMatch(new RegExp(who));
    expect(items.some((s) => /osti\.gov\/servlets\/purl\/7287449/.test(s.href ?? ''))).toBe(true);
    expect(LAW.length).toBeGreaterThanOrEqual(2);
  });

  it('writes every label in both languages: what we write around a title is translated, a title keeps its language, the quotes follow the language', () => {
    // the French words that a label written in English must not carry once the quoted titles are taken out (a title stays in its own language)
    const frenchWords =
      /\b(et|dans|des|du|même|brevet|communiqué|légendes|accueil|février|arrêté|ministère|qui cite|dossier|commission européenne|centre commun|licence ouverte|Wikipédia|relatif)\b/i;
    for (const g of SOURCES)
      for (const s of g.items) {
        const [fr, en] = s.label;
        expect(en.replace(/“[^”]*”/g, ''), fr).not.toMatch(frenchWords);
        expect(en, fr).not.toMatch(/[«»]/);
        expect(fr, en).not.toMatch(/[“”]/);
      }
  });
});

// Every file of the content and its documents, this one left out because it holds the patterns.
const files = import.meta.glob(
  [
    './*.ts',
    './parts/*.ts',
    '../i18n/*.ts',
    '../../docs/data.md',
    '../../docs/lessons.md',
    '../../docs/drawings.md',
    '!./data.test.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

describe('the prototypes’ position stays in the private cache', () => {
  it('reads the content and its documents', () => {
    expect(Object.keys(files).length).toBeGreaterThan(15);
  });
  for (const [file, text] of Object.entries(files)) {
    it(`${file} says no more than « Odeillo »`, () => {
      expect(text).not.toMatch(/42[.,]49\d?/);
      expect(text).not.toMatch(/\b2[.,]03\d?\b/);
      expect(text).not.toMatch(/cami[ -]del[ -]sol/i);
      expect(text).not.toMatch(/BATIMENT\d+/i);
      expect(text).not.toMatch(/\brue\s|lat(?:itude)?\.? *\d|\d{1,2}\.\d{3,} *°/i);
    });
  }
});
