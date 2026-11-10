import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { generalSheet } from './pl01-general';
import { sectionSheet } from './pl02-section';
import { sunSheet } from './pl03-sun';
import { elementSheet } from './pl04-element';
import { airSheet } from './pl05-air';
import { waveSheet } from './pl06-wave';
import { christmasSheet } from './pl07-christmas';
import { budgetSheet } from './pl08-budget';

// The cartouche of every sheet: they explain, they are no plan to follow. The reconstruction itself is said once, in the Sources.
configureDrawings({
  project: { fr: 'MAISON BIOCLIMATIQUE — mur de stockage', en: 'BIOCLIMATIC HOUSE — storage wall' },
  disclaimer: { fr: 'Pour comprendre, pas un plan à suivre', en: 'For understanding, not a plan to follow' },
  date: '2026-11-11',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  generalSheet,
  sectionSheet,
  sunSheet,
  elementSheet,
  airSheet,
  waveSheet,
  christmasSheet,
  budgetSheet,
];

/** The groups of the Plans mode, for `plans.groups` in src/lab.ts, in the order that keeps the numbers running: the kit lists the sheets group by group. */
export const SHEET_GROUPS = [
  { id: 'house', label: l('La maison et son soleil', 'The house and its sun') },
  { id: 'wall', label: l('Le mur', 'The wall') },
  { id: 'balance', label: l('Le bilan', 'The balance') },
] as const;
