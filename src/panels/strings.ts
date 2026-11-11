import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { dayOfDate, monthOf, type RecordId } from '../sim/climate';
import { FACE_HOT, ROOM_COLD, ROOM_HOT } from '../sim/engine';
import type { AlarmKey } from '../sim/types';
import {
  ALARM_TEXTS,
  MATERIAL_TEXTS,
  MODE_TEXTS,
  MODEL_NOTE,
  PARAM_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  SHARE_CLAIMS,
  SITE_TEXTS,
  SKY_TEXTS,
  VENT_TEXTS,
  type Pair,
} from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. The alarms, starting points, scenarios, the vents, the flap, the materials, the sites, the skies, the sliders' names and who says what about the share
// are in src/sim/texts.ts, which the physics owns; the lab's title, the worlds and the notices of the Sources panel are in src/i18n/ui.ts. A figure of the model carries †, an estimate *, a reported one nothing, by `lf` (src/data/figures.ts), so that
// a number cannot lose its mark. « This is a model » is said once, in MODEL_NOTE.

/** The alarms as the bottom strip's pill says them: the pill is narrow and the panel's status line says the whole sentence (src/sim/texts.ts). The thresholds are the engine's. */
export const STRIP_ALARMS: Record<AlarmKey, Pair> = {
  roomHot: [`Pièce au-dessus de ${ROOM_HOT} °C`, `Room over ${ROOM_HOT} °C`],
  roomCold: [`Pièce sous ${ROOM_COLD} °C`, `Room under ${ROOM_COLD} °C`],
  faceHot: [`Peinture au-delà de ${FACE_HOT} °C`, `Paint over ${FACE_HOT} °C`],
  reverseFlow: ['Courant inversé', 'Flow reversed'],
  wrongSeason: ['Clapet d’hiver en été', 'Winter flap in summer'],
  wallTakesHeat: ['Le mur prend de la chaleur', 'The wall takes heat'],
};

/** A text with {placeholders} of src/data/figures.ts, as a pair. */
const pair = (fr: string, en: string): Pair => {
  const x = lf(fr, en);
  return [x.fr, x.en];
};

const PANEL = {
  simTitle: ['Simulation', 'Simulation'],
  simIntro: [
    'Choisissez un point de départ ou un scénario, puis changez un réglage : le mur, la maison, le lieu. Le courant de la lame, la vague dans le mur, la nuit et la part de la saison sont des résultats du calcul, pas des courbes dessinées.',
    'Choose a starting point or a scenario, then change a setting: the wall, the house, the place. The gap’s current, the wave in the wall, the night and the season’s share are results of the calculation, not drawn curves.',
  ],
  speedHint: pair(
    'L’horloge s’ouvre à une heure par seconde (le ×3600 de la barre du bas) : un jour en 24 secondes. La vague de chaleur avance de {waveSpeed} dans le béton : on ne la voit qu’à grande vitesse, et à ×86400 un jour passe en une seconde.',
    'The clock opens at an hour a second (the ×3600 of the bottom bar): a day in 24 seconds. The wave of heat advances at {waveSpeed} in the concrete: it is only seen at high speed, and at ×86400 a day goes by in a second.',
  ),
  preset: ['Point de départ', 'Starting point'],
  custom: ['Autres réglages', 'Other settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chacun raconte une chose, et règle lui-même le jour, l’heure et le lieu.',
    'Each tells one thing, and sets the day, the hour and the place itself.',
  ],

  // ---- the status line
  statusUp: [
    'Le soleil chauffe la plaque : l’air monte dans la lame et revient dans la pièce.',
    'The sun heats the plate: the air rises in the gap and comes back into the room.',
  ],
  statusSummer: [
    'Position d’été : l’air de la pièce monte dans la lame et part dehors par le haut.',
    'Summer position: the room’s air rises in the gap and leaves outside by the top.',
  ],
  statusQuiet: [
    'Le courant est arrêté : la pièce vit de ce que le mur a gardé.',
    'The current has stopped: the room lives on what the wall has kept.',
  ],

  // ---- the live figures
  liveSun: ['Soleil sur le mur', 'Sun on the wall'],
  liveOuter: ['Face noire', 'Black face'],
  liveInner: ['Face intérieure', 'Inner face'],
  liveGapOut: ['Air sortant', 'Air leaving'],
  liveFlow: ['Courant d’air', 'Air flow'],
  liveRoom: ['Pièce', 'Room'],
  liveAir: ['Air extérieur', 'Outside air'],
  liveElec: ['Électricité', 'Electricity'],
  liveEff: ['Rendement d’hier', 'Yesterday’s efficiency'],
  liveEffNote: [
    'Un rendement d’un seul jour dit peu de chose d’un mur qui a une mémoire.',
    'A single day’s efficiency says little about a wall with a memory.',
  ],

  // ---- the moment in detail, folded
  moreSunAlt: ['Hauteur du soleil', 'Sun’s height'],
  moreIncidence: ['Angle sur le mur', 'Angle on the wall'],
  moreRefused: ['Refusé par la vitre', 'Refused by the glass'],
  moreGlassOut: ['Vitre extérieure', 'Outer glass'],
  moreGlassIn: ['Vitre intérieure', 'Inner glass'],
  moreGapIn: ['Air entrant, en bas', 'Air entering, at the bottom'],
  moreSurfaces: ['Surfaces de la pièce', 'Room surfaces'],
  moreWaveSpeed: ['Vitesse de la vague, calcul classique', 'Wave speed, textbook'],
  moreWaveLag: ['Délai à travers le mur, calcul classique', 'Lag through the wall, textbook'],
  moreLag: ['Délai suivi dans le mur', 'Lag followed in the wall'],
  moreThermo: ['Chaleur rendue par l’air', 'Heat given back by the air'],
  moreRad: ['Chaleur rendue par rayonnement', 'Heat given back by radiation'],
  moreConv: ['Chaleur rendue par convection', 'Heat given back by convection'],
  moreWindows: ['Soleil par les fenêtres', 'Sun through the windows'],
  moreGains: ['Occupants et appareils', 'People and appliances'],
  moreDraw: ['Air tiré dehors, en été', 'Air drawn out, in summer'],
  moreTube: ['Puits canadien', 'Earth tube'],
  moreLoad: ['Déperditions de la maison', 'The house’s losses'],
  moreToday: ['Reçu aujourd’hui', 'Received today'],
  moreTodayAir: ['Rendu aujourd’hui par l’air', 'Given back today by the air'],
  moreTodayConduction: ['Rendu aujourd’hui par le béton', 'Given back today by the concrete'],

  // ---- the charts
  chartTemps: ['Les températures, trois jours', 'The temperatures, three days'],
  chartSun: ['Le soleil sur le mur', 'The sun on the wall'],
  chartFlow: ['Le courant d’air, par élément', 'The air flow, per element'],
  chartElec: ['L’électricité', 'The electricity'],
  chartWall: ['Le mur, de la face noire à la pièce', 'The wall, from the black face to the room'],
  seriesOuter: ['Face noire', 'Black face'],
  seriesInner: ['Face intérieure', 'Inner face'],
  seriesGapOut: ['Air sortant', 'Air leaving'],
  seriesRoom: ['Pièce', 'Room'],
  seriesAir: ['Air extérieur', 'Outside air'],
  seriesSun: ['Soleil', 'Sun'],
  seriesFlow: ['Courant', 'Flow'],
  seriesElec: ['Électricité', 'Electricity'],
  seriesWall: ['Béton', 'Concrete'],
  chartsHint: [
    'Les trois derniers jours, un point tous les quarts d’heure. Plus le mur est épais, moins la face intérieure suit la plaque : à 60 cm elle bouge à peine, c’est la vague lente. Un courant négatif descend dans la lame.',
    'The last three days, a point every quarter of an hour. The thicker the wall, the less the inner face follows the plate: at 60 cm it hardly moves, that is the slow wave. A negative flow runs down the gap.',
  ],
  unitDays: ['j', 'd'],
  solarShort: ['h solaire', 'solar time'],

  // ---- the controls
  secClock: ['Le jour et l’heure', 'Day and hour'],
  secWall: ['Le mur', 'The wall'],
  secHouse: ['La maison', 'The house'],
  secPlace: ['Le lieu et le ciel', 'The place and the sky'],
  secEstimates: ['Estimations et choix de calcul', 'Estimates and calculation choices'],
  secMore: ['Le détail du moment', 'The moment in detail'],
  dayLabel: ['Jour de l’année', 'Day of the year'],
  hourLabel: ['Heure solaire', 'Solar hour'],
  materialLabel: ['Matériau du mur', 'Wall material'],
  modeLabel: ['Position du clapet', 'Flap position'],
  ventsLabel: ['Évents', 'Vents'],
  nightLabel: ['Volets isolants la nuit *', 'Night screens *'],
  backupLabel: ['Chauffage électrique d’appoint', 'Electric backup heating'],
  earthTubeLabel: ['Puits canadien, « et si » *', 'Earth tube, “what if” *'],
  siteLabel: ['Lieu', 'Place'],
  skyLabel: ['Ciel', 'Sky'],
  recordLabel: ['Jours mesurés', 'Measured days'],
  filmLabel: ['Film d’air de la face intérieure', 'Inner face’s air film'],
  filmSource: ['Coefficients de l’article', 'The paper’s coefficients'],
  filmKit: ['Coefficient usuel de manuel', 'Usual textbook coefficient'],
  holdLabel: ['Pièce tenue à la consigne, comme l’article compte', 'Room held at the setpoint, as the paper books it'],
  gvLabel: ['G·V comprend déjà le mur et les fenêtres *', 'G·V already includes the wall and the windows *'],
  gvHint: pair(
    'Personne ne dit ce que G·V compte. Décoché, le mur et les fenêtres perdent en plus : la part de la saison tombe de {shareAll} à {gvRest}.',
    'Nobody says what G·V counts. Unticked, the wall and the windows lose on top: the season’s share falls from {shareAll} to {gvRest}.',
  ),
  collectorHint: [
    'Le dessin garde ses neuf travées : le chiffre change, pas la forme.',
    'The drawing keeps its nine bays: the figure changes, not the shape.',
  ],
  siteHint: [
    'La 3D reste le plateau d’Odeillo : seuls le ciel, l’altitude et les chiffres changent.',
    'The 3D stays the plateau of Odeillo: only the sky, the altitude and the figures change.',
  ],
  estimatesHint: [
    'Ces réglages sont des choix de ce labo, que les sources ne donnent pas : les bouger montre ce qui compte, pas ce qui est vrai.',
    'These settings are choices of this lab that the sources do not give: moving them shows what matters, not what is true.',
  ],
  unitSheet: ['vitre', 'sheet'],
  unitSheets: ['vitres', 'sheets'],
  record: {
    'christmas-1974': ['Noël 1974, quatre jours', 'Christmas 1974, four days'],
    'dec-jan-1975': ['Les vingt jours du tableau II', 'The twenty days of Table II'],
    'feb-1975': ['Février 1975', 'February 1975'],
    'april-1975': ['Avril 1975', 'April 1975'],
    'june-1975': ['Juin 1975', 'June 1975'],
  } satisfies Record<RecordId, Pair>,
  monthShort: [
    'janv.,févr.,mars,avr.,mai,juin,juil.,août,sept.,oct.,nov.,déc.',
    'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
  ],

  // ---- the season: the film's question
  secSeason: ['Une maison peut-elle se chauffer seule ?', 'Can a house heat itself?'],
  seasonHint: [
    'Du 1er octobre au 20 mai, quatre fois : la maison dans le noir, puis avec le mur seul, avec les fenêtres, avec les gens. La part est ce que l’électricité ne paie pas du chauffage. Le calcul prend quelques secondes, sur des jours variés calés sur les mois de PVGIS, avec vos réglages.',
    'From 1 October to 20 May, four times: the house in the dark, then with the wall alone, with the windows, with the people. The share is what electricity does not pay of the heating. The calculation takes a few seconds, on varied days fitted to PVGIS’s months, with your settings.',
  ],
  seasonRun: ['Calculer la saison', 'Run the season'],
  seasonBusy: ['Calcul en cours…', 'Calculating…'],
  seasonStale: ['Les réglages ont changé : calculez de nouveau.', 'The settings have changed: run it again.'],
  rungWall: ['Le mur seul', 'The wall alone'],
  rungWindows: ['Avec les fenêtres au sud', 'With the south windows'],
  rungAll: ['Avec les gens et les appareils', 'With the people and appliances'],
  rungDark: ['Contre la même maison dans le noir', 'Against the same house in the dark'],
  linesTitle: ['D’où vient la chaleur, en part de la charge', 'Where the heat comes from, as a share of the load'],
  lineWallAir: ['Mur, par l’air', 'Wall, by the air'],
  lineWallConduction: ['Mur, par le béton', 'Wall, by the concrete'],
  lineWindows: ['Fenêtres', 'Windows'],
  linePeople: ['Gens et appareils', 'People and appliances'],
  lineElectric: ['Électricité', 'Electricity'],
  seasonLoad: ['Charge de la saison', 'The season’s load'],
  seasonAir: ['Air moyen de la saison', 'The season’s mean air'],
  claimsTitle: ['Qui dit quoi', 'Who says what'],
  claimsOurs: ['Ce modèle, la maison de 1967', 'This model, the 1967 house'],
  claimsHint: pair(
    'Le modèle n’atteint le bas de la fourchette des inventeurs que si l’air du site est 5 K plus chaud que celui des données ERA5 utilisées ici : {share5K}. Essayez « Air extérieur, décalage » à +5 K. Leur période, leur consigne et la place des fenêtres dans leur compte ne sont pas connues : rien ici ne dit qui a raison.',
    'The model only reaches the bottom of the inventors’ range if the site’s air is 5 K warmer than the ERA5 data used here: {share5K}. Try “Outside air, shift” at +5 K. Their period, their setpoint and where the windows stand in their count are not known: nothing here says who is right.',
  ),
  limitsTitle: ['Là où le modèle ne retrouve pas la source', 'Where the model does not retrieve the source'],
  limitFlow: pair(
    'Le courant : {flowRange} par élément un jour clair, contre environ 20 L/s enregistrés, soit le double. Le modèle ne le règle pas pour s’en approcher.',
    'The current: {flowRange} per element on a clear day, against about 20 L/s recorded, twice as much. The model does not tune it to come closer.',
  ),
  limitSplit: pair(
    'L’air et le béton : {thermoShare} de la chaleur rendue passe par l’air, contre 30 à 35 % lus dans l’article.',
    'The air and the concrete: {thermoShare} of the heat given back goes by the air, against 30 to 35 % read in the paper.',
  ),
  limitChristmas: pair(
    'Noël 1974 : le 24 décembre, le modèle rend {christmasModel} du soleil reçu, l’article 478 %.',
    'Christmas 1974: on 24 December the model gives back {christmasModel} of the sun received, the paper 478 %.',
  ),
  limitShare: pair(
    'La part de la saison : {shareAll} si G·V est toute l’enveloppe de la maison, {gvRest} s’il n’en est que le reste.',
    'The season’s share: {shareAll} if G·V is the whole envelope of the house, {gvRest} if it is only the rest.',
  ),
} as const satisfies Record<string, Pair | Record<string, Pair>>;

type Flat = Omit<typeof PANEL, 'record'>;

const fromSim = (prefix: string, table: Record<string, Pair>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}:${k}`, v]));

const label = (table: Partial<Record<string, { label: Pair }>>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [k, v!.label]));

const { record, ...FLAT } = PANEL;

const SIM_TEXTS: Record<string, Pair> = {
  ...fromSim('alarm', Object.fromEntries(Object.entries(ALARM_TEXTS).map(([k, v]) => [k, v.text]))),
  ...fromSim('preset', PRESET_TEXTS),
  ...fromSim('scenario', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.name]))),
  ...fromSim('lesson', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.lesson]))),
  ...fromSim('vents', VENT_TEXTS),
  ...fromSim('mode', MODE_TEXTS),
  ...fromSim('material', MATERIAL_TEXTS),
  ...fromSim('site', SITE_TEXTS),
  ...fromSim('sky', SKY_TEXTS),
  ...fromSim('record', record),
  ...fromSim('param', label(PARAM_TEXTS)),
  modelNote: MODEL_NOTE,
};

/** Every word of the panel, for the test of parity. */
export const PANEL_STRINGS: Record<string, Pair> = { ...FLAT, ...SIM_TEXTS };

registerStrings(PANEL_STRINGS);

export type PanelKey = keyof Flat;

/** A word of the panel in the language of the moment. */
export const st = (key: PanelKey | 'modelNote'): string => tx(key);

/** A word that comes from the simulation: `sx('alarm', 'roomHot')`. */
export const sx = (
  table:
    'alarm' | 'preset' | 'scenario' | 'lesson' | 'vents' | 'mode' | 'material' | 'site' | 'sky' | 'record' | 'param',
  id: string,
): string => tx(`${table}:${id}`);

/** A pair of src/sim in the language of the moment. */
export const say = (pair: Pair): string => pair[getLang() === 'fr' ? 0 : 1];

/** Who says what about the share, in the language of the moment. */
export const claims = (): { who: string; value: string }[] =>
  SHARE_CLAIMS.map((c) => ({ who: say(c.who), value: tight(say(c.value)) }));

/** A short value stays on one line: « 35 à 45 % » is not cut in a narrow column. */
export const tight = (text: string): string => text.replace(/ /g, '\u00a0');

/** A number with the decimal mark of the language; no "-0". */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(Math.abs(value) * 10 ** digits) === 0 ? 0 : value;
  return v.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const months = (): string[] => st('monthShort').split(',');

/** « 15 janv. » for a day of the year. */
export function dateText(day: number): string {
  const month = monthOf(day);
  return `${day - dayOfDate(month, 1) + 1} ${months()[month] ?? ''}`;
}

/** « 08:15 » for a solar hour. */
export function hourText(hour: number): string {
  const total = Math.round(hour * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
