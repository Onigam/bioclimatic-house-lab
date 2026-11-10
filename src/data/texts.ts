// Test helper: every text a visitor reads from src/data, gathered with a name, and the number tokens of a text in a language, normalised so that « 1 550 » and « 1,550 », « 0,60 » and « 0.60 » compare equal. Not imported by the application.
import type { L } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from './assembly';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';

export type Lang = 'fr' | 'en';

const asL = (x: L | string): L => (typeof x === 'string' ? { fr: x, en: x } : x);

/** Every text of the catalogue, the guides, the overviews and the lessons: [where, text]. */
export function visitorTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) {
    out.push(
      [`${p.id}.name`, p.name],
      [`${p.id}.short`, p.short],
      [`${p.id}.description`, p.description],
      [`${p.id}.material`, p.material],
    );
    if (p.maintenance) out.push([`${p.id}.maintenance`, p.maintenance]);
    if (p.tip) out.push([`${p.id}.tip`, p.tip]);
    if (p.design) out.push([`${p.id}.design`, p.design]);
    p.specs.forEach((s, i) =>
      out.push([`${p.id}.specs[${i}].label`, s.label], [`${p.id}.specs[${i}].value`, asL(s.value)]),
    );
  }
  for (const s of [...ASSEMBLY, ...INSTALL]) {
    out.push([`${s.id}.title`, s.title], [`${s.id}.text`, s.text]);
    if (s.tip) out.push([`${s.id}.tip`, s.tip]);
    if (s.warning) out.push([`${s.id}.warning`, s.warning]);
  }
  for (const [w, o] of Object.entries(OVERVIEWS))
    out.push([`overview ${w}.title`, o.title], [`overview ${w}.text`, o.text]);
  for (const x of LESSONS) {
    out.push([`${x.id}.title`, x.title], [`${x.id}.summary`, x.summary]);
    x.body.forEach((b, i) => out.push([`${x.id}.body[${i}]`, b]));
    x.figures?.forEach((f, i) =>
      out.push([`${x.id}.figures[${i}].label`, f.label], [`${x.id}.figures[${i}].value`, asL(f.value)]),
    );
    x.quiz?.forEach((q, i) => {
      out.push([`${x.id}.quiz[${i}].q`, q.q], [`${x.id}.quiz[${i}].explain`, q.explain]);
      q.choices.forEach((c, j) => out.push([`${x.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

const FR_NUM = /\d+(?:[   ]\d{3})*(?:,\d+)?/g;
const EN_NUM = /\d+(?:,\d{3})*(?:\.\d+)?/g;

/** The numbers of a text, as JavaScript numbers. */
export function numbersIn(text: string, lang: Lang): number[] {
  // an hour written the English way (« 10 at night », « 3 in the afternoon », « 10 pm ») is the French 24-hour clock's (22, 15)
  const t =
    lang === 'en'
      ? text.replace(
          /(\d+)(\s*(?:p\.?m\.?|at night|in the afternoon|in the evening))/g,
          (_, n: string, rest: string) => `${Number(n) + 12}${rest}`,
        )
      : text;
  const m = t.match(lang === 'fr' ? FR_NUM : EN_NUM) ?? [];
  return m.map((x) => Number(lang === 'fr' ? x.replace(/\s/g, '').replace(',', '.') : x.replace(/,/g, '')));
}
