// The drawn sizes of the part sheets that no other row already gives, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): no length is typed in this file. They are appended to each sheet's specs by ../parts.ts.
// A length with no mark is a source's; * is an estimate of the 3D model (dims.ts says which, and the sheet's own text says why). Reported sizes (the element, the thermostat, the furnace's building) are written in the sheets themselves.
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { SITE, Y_RIDGE } from '../../three/dims';
import { sp } from '../part-helpers';
import { nEn, nFr } from '../units';

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;

/** Metres, at most three decimals, no trailing zero, with its mark. */
const lenM = (mark: '*' | '†' | '', ...m: number[]): L =>
  l(
    `${m.map((x) => trim(nFr(x, 3), ',')).join(' × ')} m${mark}`,
    `${m.map((x) => trim(nEn(x, 3), '.')).join(' × ')} m${mark}`,
  );

export const DIM_SPECS: Record<string, Spec[]> = {
  'prototype-house': [
    sp(
      'Faîtage dessiné, au-dessus de la dalle',
      'Ridge drawn, above the slab',
      lenM('*', Math.round(Y_RIDGE * 10) / 10),
    ),
  ],
  'solar-furnace': [
    sp('Hauteur du miroir dessinée', 'Mirror’s height drawn', lenM('*', SITE.furnace.mirrorHeight)),
    sp('Profondeur dessinée', 'Depth drawn', lenM('', SITE.furnace.depth)),
  ],
  'heliostat-terraces': [
    sp('Premier rang, devant le four', 'First row, in front of the furnace', lenM('*', Math.abs(SITE.field.z0))),
    sp('Écart entre deux terrasses', 'Gap between two terraces', lenM('*', SITE.field.dz)),
  ],
};
