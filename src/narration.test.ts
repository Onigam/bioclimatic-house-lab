import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import { describe, expect, it } from 'vitest';
import { LAB_CUE_NAMES, planCue, runCue, startingPointOf } from './cues';
import { FIG } from './data/figures';
import { HouseSim } from './sim/engine';
import { ROOM_SETPOINT } from './sim/machine';
import { DEFAULT_TIME_SCALE, PRESET_IDS, SCENARIO_IDS, presetParams } from './sim/presets';
import { WORLD } from './three';
import { PART_IDS, WHAT_IF_PARTS, WORLD_IDS, type WorldId } from './three/ids';

// The spoken guide: the scripts (narration/<lang>.json) and the manifests generated from them (public/audio/<lang>) must agree with the lab's worlds, parts, scenarios and tools, say each of the lab's
// truths once, say today's figures, and keep the register of Pelton Lab's guide (docs/narration-style.md of the kit). The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLD_IDS];
const partIds: string[] = WORLD_IDS.flatMap((w) => [...PART_IDS[w]]);
const worldOf = (partId: string): WorldId | undefined => WORLD_IDS.find((w) => PART_IDS[w].includes(partId));

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language. */
const BUDGET = 30_000;
/** What this guide aims for, within the series' 17,000 to 24,000. */
const AIM = [20_000, 24_000] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';
/** The setting is the only place a text may name beyond its own; the rest stays in the private cache (src/guard.test.ts). */
const THE_ONLY_PLACE = 'Odeillo';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();
const cuesOf = (text: string): [name: string, arg: string][] => [...text.matchAll(CUE)].map((m) => [m[1]!, m[2] ?? '']);

/**
 * Each truth of the lab, said in one segment and no other (the owner, of the disclaimers: « à chaque fois c'est un peu chiant »). Regular expressions per language; the segment is the only one allowed.
 * The limits of the model are said where the sheets and the lessons say them, as they say them, and never tuned away.
 */
const ONCE: Record<string, Record<string, [RegExp, string]>> = {
  fr: {
    reconstruction: [/reconstitution pédagogique/i, 'intro'],
    noPlan: [/aucun plan à suivre/i, 'intro'],
    figures: [/les autres viennent de données ouvertes/i, 'intro'],
    calculations: [/aucun n’a été mesuré par nous/i, 'intro'],
    notTuned: [/ne l’avons pas réglée pour y arriver/i, 'intro'],
    sources: [/panneau Sources/i, 'intro'],
    honestAnswer: [/une bonne part, selon qui compte/i, 'intro'],
    plateauComposed: [/le plateau, lui, est composé/i, 'scene-site'],
    modelSun: [/soleil de notre modèle/i, 'scene-site'],
    whatIf: [/aucune source n’en mentionne ici/i, 'scene-house'],
    nineteenSixtySeven: [/la maison dessinée reste/i, 'scene-house'],
    flowTwice: [/presque le double/i, 'part-air-gap'],
    airShare: [/trente à trente-cinq pour cent/i, 'part-warm-air-jet'],
    christmas: [/quatre cent soixante-dix-huit/i, 'part-inner-wall-face'],
    christmasModel: [/trois cent soixante-sept/i, 'part-inner-wall-face'],
    gvReading: [/lu autrement/i, 'part-north-wall'],
    winterMonths: [/huit à douze points trop bas/i, 'part-south-facade'],
    water: [/dit l’article, tenait à l’eau/i, 'part-storage-wall'],
    nightFlow: [/courbes de mille neuf cent soixante-sept/i, 'part-summer-flap'],
    noMeasuredTube: [/aucun puits canadien mesuré/i, 'part-earth-tube-pipe'],
    radon: [/radon/i, 'part-earth-tube-drain'],
    plan1974: [/plan n’est dans aucune source/i, 'part-solar-houses-1974'],
    furnace: [/gabarit publié/i, 'part-solar-furnace'],
    architect: [/architecte américain/i, 'part-north-window'],
    zoologist: [/zoologiste/i, 'part-black-paint'],
    windowsEstimate: [/surface des fenêtres/i, 'part-south-window'],
    peopleEstimate: [/cinq cents watts/i, 'part-armchair'],
    fiveKelvin: [/plus chaud de cinq degrés/i, 'part-electric-heater'],
    sixtyFive: [/soixante-cinq degrés/i, 'part-black-paint'],
  },
  en: {
    reconstruction: [/educational reconstruction/i, 'intro'],
    noPlan: [/no plan to follow/i, 'intro'],
    figures: [/the others come from open data/i, 'intro'],
    calculations: [/none was measured by us/i, 'intro'],
    notTuned: [/not tuned it to get there/i, 'intro'],
    sources: [/Sources panel/i, 'intro'],
    honestAnswer: [/a good part of the way, depending on who counts/i, 'intro'],
    plateauComposed: [/plateau itself is composed/i, 'scene-site'],
    modelSun: [/sun of our model/i, 'scene-site'],
    whatIf: [/no source mentions one in this house/i, 'scene-house'],
    nineteenSixtySeven: [/the house we draw stays/i, 'scene-house'],
    flowTwice: [/nearly twice/i, 'part-air-gap'],
    airShare: [/thirty to thirty-five per cent/i, 'part-warm-air-jet'],
    christmas: [/four hundred and seventy-eight/i, 'part-inner-wall-face'],
    christmasModel: [/three hundred and sixty-seven/i, 'part-inner-wall-face'],
    gvReading: [/read the other way/i, 'part-north-wall'],
    winterMonths: [/eight to twelve points too low/i, 'part-south-facade'],
    water: [/says the paper, was the water/i, 'part-storage-wall'],
    nightFlow: [/curves of nineteen sixty-seven/i, 'part-summer-flap'],
    noMeasuredTube: [/no earth tube measured/i, 'part-earth-tube-pipe'],
    radon: [/radon/i, 'part-earth-tube-drain'],
    plan1974: [/plan is in no source/i, 'part-solar-houses-1974'],
    furnace: [/published template/i, 'part-solar-furnace'],
    architect: [/american architect/i, 'part-north-window'],
    zoologist: [/zoologist/i, 'part-black-paint'],
    windowsEstimate: [/area of the windows/i, 'part-south-window'],
    peopleEstimate: [/five hundred watts/i, 'part-armchair'],
    fiveKelvin: [/five degrees warmer/i, 'part-electric-heater'],
    sixtyFive: [/sixty-five degrees/i, 'part-black-paint'],
  },
};

/** Never said, anywhere: a promise of safety, a guarantee, or a claim of exactness for what the sheets mark as an estimate. */
const REFUSED: Record<string, RegExp> = {
  fr: /sans danger|sans risque|en toute sécurité|garanti|(?<!\p{L})sûre?s?(?!\p{L})|infaillible|exactement|précisément/iu,
  en: /without danger|without risk|no risk|\bsafely\b|\bsafe\b|guarantee|infallible|exactly|precisely/i,
};

/**
 * What the independent fact-check found going past its source, and must not come back (docs/fact-check.md, section 1 B and 2). Each regular expression is a wording that said more than the source does; `KEPT_TO_THE_SOURCE`
 * below holds the wording that replaces it, in the one segment where it belongs.
 */
const WENT_PAST: Record<string, [RegExp, string][]> = {
  fr: [
    [
      /à minuit/i,
      'the wave of the 60 cm wall comes out in the small hours (about three to four in our figures), not at midnight',
    ],
    [/n’a jamais existé/i, 'absence of a mention is not absence'],
    [/il est habité/i, 'the 1974 building is private property; no source says who lives in it today'],
    [/par camion/i, 'no source says how the materials came'],
    [/plus de soixante-trois/i, '63.4 tonnes is before the ducts’ voids: about'],
    [/coulé sur place/i, 'the paper gives two causes, and never says cast in place'],
    [/le jet reste chaud/i, 'it is the flow that goes on, two to three hours'],
    [/onze heures de retard/i, 'eleven is our closed form at 45 cm; the inventors’ target is about twelve'],
    [/dix-neuvième siècle/i, 'the patent is of 1881'],
    [/à midi en hiver, la plaque/i, 'the plate peaks in the early afternoon'],
    [/son rôle est pourtant le plus grand/i, 'the layer is our drawing: the whole envelope’s losses count'],
    [
      /le seul vrai renouvellement/i,
      'the summer figure is the model’s, and the paper does not say its flow was the summer mode',
    ],
    [/les inventeurs annoncent/i, 'the paper says the sun can save 60 to 70 per cent'],
    [/conseille un architecte/i, 'the architect kept window area to a minimum, the north above all'],
    [/ni conduit, ni prise/i, 'the earth tube’s last run ends at the fresh-air grille in the 3D'],
    [
      /des calculs, pas des mesures/i,
      'open data and our arithmetic are not all simulation or estimates: none was measured by us',
    ],
    [/nous lisons environ dix-sept/i, 'the 17.5 is derived from the paper’s figures, not read on a curve'],
  ],
  en: [
    [
      /at midnight/i,
      'the wave of the 60 cm wall comes out in the small hours (about three to four in our figures), not at midnight',
    ],
    [/never existed/i, 'absence of a mention is not absence'],
    [/lived in:/i, 'the 1974 building is private property; no source says who lives in it today'],
    [/by lorry/i, 'no source says how the materials came'],
    [/more than sixty-three/i, '63.4 tonnes is before the ducts’ voids: about'],
    [/poured on site/i, 'the paper gives two causes, and never says cast in place'],
    [/the jet stays warm/i, 'it is the flow that goes on, two to three hours'],
    [/eleven hours’ delay/i, 'eleven is our closed form at 45 cm; the inventors’ target is about twelve'],
    [/nineteenth century/i, 'the patent is of 1881'],
    [/at midday in winter, the plate/i, 'the plate peaks in the early afternoon'],
    [/its part is the greatest/i, 'the layer is our drawing: the whole envelope’s losses count'],
    [
      /the only real renewal/i,
      'the summer figure is the model’s, and the paper does not say its flow was the summer mode',
    ],
    [/the inventors announce/i, 'the paper says the sun can save 60 to 70 per cent'],
    [/advises an american architect/i, 'the architect kept window area to a minimum, the north above all'],
    [/neither duct nor intake/i, 'the earth tube’s last run ends at the fresh-air grille in the 3D'],
    [
      /calculations, not measurements/i,
      'open data and our arithmetic are not all simulation or estimates: none was measured by us',
    ],
    [/we read about seventeen/i, 'the 17.5 is derived from the paper’s figures, not read on a curve'],
  ],
};

/** The wording that keeps to the source, in the segment that says it: a marked estimate, a source named, a basis given. */
const KEPT_TO_THE_SOURCE: Record<string, [id: string, RegExp][]> = {
  fr: [
    ['intro', /au petit matin/],
    ['scene-house', /lues sur une photographie/],
    ['scene-room', /on y compte les pertes des fenêtres, pas leur soleil/],
    ['part-south-window', /du mur plein à leur place, les gens toujours là/],
    ['part-heliostat-terraces', /dans notre dessin, ils se rangent/],
    ['part-solar-houses-1974', /propriété privée/],
    ['part-pyranometer', /dans le plan du mur/],
    ['part-east-gable', /en hiver, au sud-est/],
    ['part-west-gable', /en hiver, au sud-ouest/],
    ['part-chimney', /notre dessin ajoute un conduit de brique/],
    ['part-black-paint', /en début d’après-midi/],
    ['part-black-paint', /en mille huit cent quatre-vingt-un/],
    ['part-storage-wall', /un retard d’environ douze heures/],
    ['part-upper-duct', /deux à trois heures/],
    ['part-summer-flap', /dans notre dessin, cette plaque/],
    ['part-air-thermocouples', /dans les conduits/],
    ['part-hot-wire-anemometer', /au centre du conduit bas, là où l’article le met/],
    ['part-east-gable', /ne laisse du pignon qu’un fantôme pâle/],
    ['scene-house', /dessiné pâle, il n’est ferme que/],
    ['part-earth-tube-intake', /la voilà plus ferme/],
    ['part-room-surface-probes', /nous calculons environ dix-sept et demi/],
    ['intro', /données ouvertes, de notre simulation ou de nos estimations/],
    ['part-fresh-air-vent', /sauf dans l’hypothèse du puits canadien, dont le dernier tronçon finit ici/],
    ['part-granite-slope', /d’environ deux mètres : une estimation/],
    ['part-earth-tube-pipe', /sous terre : nos estimations/],
    ['part-fresh-air-vent', /dans notre modèle, la position d’été/],
    ['part-electric-heater', /le soleil peut économiser soixante à soixante-dix pour cent/],
    ['part-roof-insulation', /ce qui compte le plus/],
    ['part-access-road', /environ soixante-trois tonnes/],
    ['part-foundation', /environ soixante-trois tonnes/],
  ],
  en: [
    ['intro', /in the small hours/],
    ['scene-house', /read from a photograph/],
    ['scene-room', /the windows’ losses are counted, their sun is not/],
    ['part-south-window', /plain wall in their place, the people still there/],
    ['part-heliostat-terraces', /in our drawing, they park/],
    ['part-solar-houses-1974', /private property/],
    ['part-pyranometer', /in the plane of the wall/],
    ['part-east-gable', /in winter, to the south-east/],
    ['part-west-gable', /in winter, to the south-west/],
    ['part-chimney', /our drawing adds a brick flue/],
    ['part-black-paint', /in the early afternoon/],
    ['part-black-paint', /in eighteen eighty-one/],
    ['part-storage-wall', /a delay of about twelve hours/],
    ['part-upper-duct', /two to three hours/],
    ['part-summer-flap', /in our drawing, this plate/],
    ['part-air-thermocouples', /in the ducts/],
    ['part-hot-wire-anemometer', /at the centre of the lower duct, where the paper puts it/],
    ['part-east-gable', /leaves only a pale ghost of the gable/],
    ['scene-house', /drawn pale, it firms up only in/],
    ['part-earth-tube-intake', /there it firms up/],
    ['part-room-surface-probes', /we work out about seventeen and a half/],
    ['intro', /open data, our simulation or our estimates/],
    ['part-fresh-air-vent', /except in the what-if earth tube, whose last run ends here/],
    ['part-granite-slope', /about two metres: an estimate/],
    ['part-earth-tube-pipe', /underground: our estimates/],
    ['part-fresh-air-vent', /in our model, the summer position/],
    ['part-electric-heater', /the sun can save sixty to seventy per cent/],
    ['part-roof-insulation', /what counts most/],
    ['part-access-road', /about sixty-three tonnes/],
    ['part-foundation', /about sixty-three tonnes/],
  ],
};

/** A figure of the lab as the voice says it, and where: if the physics or the drawing moves, this says which segments to rewrite. `said` is the spoken number in the figure's unit. */
const FIGURES: [value: number, said: number, tolerance: number, fr: RegExp, en: RegExp, ids: string[]][] = [
  [FIG.waveSpeed.v, 4, 0.1, /quatre centimètres par heure/, /four centimetres an hour/, ['intro', 'part-storage-wall']],
  [FIG.lag60.v, 15, 0.2, /une quinzaine d’heures/, /some fifteen hours/, ['intro']],
  [
    FIG.lag45.v,
    11,
    0.5,
    /quarante-cinq centimètres en donnent onze/,
    /forty-five centimetres give eleven/,
    ['part-storage-wall'],
  ],
  [FIG.shareWall.v, 32, 0.5, /trente-deux pour cent de la charge/, /thirty-two per cent of the load/, ['scene-room']],
  [FIG.shareWindows.v, 42.5, 0.1, /quarante-deux et demi/, /forty-two and a half/, ['scene-room', 'part-armchair']],
  [FIG.shareAll.v, 47, 0.5, /quarante-sept/, /forty-seven/, ['scene-room', 'part-south-window', 'part-north-wall']],
  [FIG.shareAll.v, 47, 0.5, /quarante-sept/, /forty-seven/, ['part-roof-insulation', 'part-thermostat']],
  [FIG.share18.v, 53, 0.5, /à cinquante-trois pour cent/, /to fifty-three per cent/, ['part-thermostat']],
  [
    FIG.shareElectricity.v,
    53,
    0.5,
    /cinquante-trois pour cent de la charge/,
    /fifty-three per cent of the load/,
    ['part-electric-heater'],
  ],
  [FIG.share1974.v, 74, 0.5, /soixante-quatorze pour cent/, /seventy-four per cent/, ['part-roof-insulation']],
  [FIG.gvRest.v, 24, 0.5, /vingt-quatre pour cent/, /twenty-four per cent/, ['part-north-wall']],
  [FIG.win0.v, 42, 0.5, /quarante-deux pour cent/, /forty-two per cent/, ['part-south-window']],
  [FIG.oneGlass.v, 16, 0.5, /seize pour cent/, /sixteen per cent/, ['part-outer-glazing']],
  [FIG.twoGlass.v, 32, 0.5, /Deux : trente-deux/, /Two: thirty-two/, ['part-outer-glazing']],
  [FIG.threeGlass.v, 37, 0.5, /Trois : trente-sept/, /Three: thirty-seven/, ['part-outer-glazing']],
  [FIG.thermoShare.v, 51, 0.5, /cinquante et un/, /fifty-one/, ['part-warm-air-jet']],
  [FIG.thermoShareK30.v, 43, 0.5, /quarante-trois/, /forty-three/, ['part-warm-air-jet']],
  [FIG.reverseFlow.v, 12, 0.5, /douze litres par seconde/, /twelve litres a second/, ['part-summer-flap']],
  [FIG.reverseHours.v, 5, 0.5, /cinq heures/, /five hours/, ['part-summer-flap']],
  [
    FIG.christmasModel.v,
    367,
    0.5,
    /trois cent soixante-sept/,
    /three hundred and sixty-seven/,
    ['part-inner-wall-face'],
  ],
  [FIG.tubeLength.v, 50, 0.5, /cinquante mètres de tuyau/, /fifty metres of pipe/, ['part-earth-tube-pipe']],
  [FIG.tubeDepth.v, 2, 0.1, /deux mètres sous terre/, /two metres underground/, ['part-earth-tube-pipe']],
  [FIG.tubeJanIn.v, -1, 0.1, /moins un degré/, /minus one degree/, ['part-earth-tube-pipe']],
  [FIG.tubeJanOut.v, 3, 0.1, /il sort à trois/, /it leaves at three/, ['part-earth-tube-pipe']],
  [FIG.tubeJulIn.v, 15, 0.1, /à quinze dehors/, /with fifteen outside/, ['part-earth-tube-pipe']],
  [FIG.tubeJulOut.v, 10, 0.1, /il sort à dix/, /it leaves at ten/, ['part-earth-tube-pipe']],
  [
    FIG.tubeKwh.v,
    625,
    0.5,
    /six cent vingt-cinq kilowattheures/,
    /six hundred and twenty-five kilowatt-hours/,
    ['part-earth-tube-pipe'],
  ],
  [FIG.tubeLoad.v, 57000, 0.5, /cinquante-sept mille/, /fifty-seven thousand/, ['part-earth-tube-pipe']],
  [FIG.tubePoint.v, 1, 0.1, /un point de part/, /one point of share/, ['part-earth-tube-pipe']],
  [FIG.massT.v, 63, 0.5, /soixante-trois tonnes/, /sixty-three tonnes/, ['part-access-road', 'part-foundation']],
  [FIG.elemCount.v, 8.63, 0.5, /huit ou neuf/, /eight or nine/, ['part-collector-element']],
  [FIG.bays.v, 12, 0, /Douze travées/, /Twelve bays/, ['part-south-facade']],
  [FIG.collectorBays.v, 9, 0, /neuf de capteur/, /nine of collector/, ['part-south-facade']],
  [
    FIG.windowsM2.v,
    16.5,
    0.3,
    /seize mètres carrés et demi/,
    /sixteen and a half square metres/,
    ['part-south-window'],
  ],
  [FIG.gains.v, 500, 0, /cinq cents watts/, /five hundred watts/, ['part-armchair']],
  [FIG.glassSpacing.v, 25, 0.5, /vingt-cinq millimètres/, /twenty-five millimetres/, ['part-inner-glazing']],
  [FIG.frameFace.v, 22, 0.5, /vingt-deux millimètres/, /twenty-two millimetres/, ['part-steel-frame']],
  [FIG.thermoCount.v, 6, 0, /met six perles/, /sets six in the concrete/, ['part-wall-thermocouples']],
  [
    FIG.surfacesT.v,
    18,
    0,
    /dix-huit degrés pour notre modèle/,
    /eighteen degrees for our model/,
    ['part-room-surface-probes'],
  ],
  [FIG.surfacesSource.v, 17.5, 0.2, /dix-sept et demi/, /seventeen and a half/, ['part-room-surface-probes']],
  [FIG.meanHeight.v, 4, 0.1, /près de quatre mètres/, /nearly four metres/, ['part-room-ceiling']],
  [FIG.horizonLoss.v, 3, 0.5, /moins de trois pour cent/, /less than three per cent/, ['part-far-ridge']],
  [FIG.pitch.v, 24, 0.5, /vingt-quatre degrés/, /twenty-four degrees/, ['part-pitched-roof']],
  [FIG.groundFall.v, 2, 0.1, /deux mètres/, /two metres/, ['part-granite-slope', 'part-entrance-balcony']],
  [FIG.slab.v * 100, 20, 0.5, /vingt centimètres/, /twenty centimetres/, ['part-floor-slab', 'part-room-floor']],
  [FIG.roofIns.v * 100, 10, 0.5, /dix centimètres/, /ten centimetres/, ['part-roof-insulation']],
  [FIG.ringRatio.v, 33, 1.5, /un tiers de ce que tient le mur/, /a third of what the wall holds/, ['part-room-floor']],
  [FIG.paintAlarm.v, 70, 0, /soixante-dix degrés/, /seventy degrees/, ['part-black-paint']],
];

describe('narration wiring', () => {
  it('asks for the manifest of the interface language, and hands the lab cues to the simulation', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
    expect(typeof lab.narration?.onCue).toBe('function');
  });
});

describe('the starting-point label follows the values (qa D14)', () => {
  it('comes back when a hand restore puts every value back, and only then', () => {
    const sim = new HouseSim();
    runCue(sim, 'flap', 'summer');
    expect(sim.params.preset).toBe('custom');
    // the clock runs between the two cues, as it does in the browser: the engine writes the day and the hour back into the parameters after every step
    const hour = sim.params.hour;
    sim.step(0.5);
    expect(sim.params.hour, 'the clock has moved').not.toBe(hour);
    runCue(sim, 'flap', 'winter');
    expect(sim.params.preset).toBe('prototype-1967');
    // the same from another starting point: the label that comes back is the one the values are
    sim.applyPreset('wall-45');
    runCue(sim, 'sheets', '3');
    expect(sim.params.preset).toBe('custom');
    runCue(sim, 'sheets', '2');
    expect(sim.params.preset).toBe('wall-45');
    // the clock's own controls are not part of a starting point
    runCue(sim, 'speed', '86400');
    expect(sim.params.preset).toBe('wall-45');
  });

  it('stays « custom » when a visitor’s own change is still there, and while a scenario runs', () => {
    const visitor = new HouseSim();
    visitor.set({ southWindows: 20 });
    runCue(visitor, 'flap', 'summer');
    runCue(visitor, 'flap', 'winter');
    expect(visitor.params.preset).toBe('custom');
    expect(startingPointOf(visitor)).toBeNull();

    const scenario = new HouseSim();
    runCue(scenario, 'scenario', 'the-night');
    const { preset: _label, ...values } = presetParams('prototype-1967');
    scenario.set(values);
    runCue(scenario, 'flap', 'winter');
    expect(scenario.scenarioNow).toBe('the-night');
    expect(scenario.params.preset).toBe('custom');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 56 parts, so 61 segments per language, in French and in English', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(56);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 56);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);
  const i = lang === 'fr' ? 0 : 1;

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect(scopes).toEqual(['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)]);
  });

  it('names its segments intro, scene-<world> and part-<id>, with a title and the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(s.title, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†«»]/);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(200);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world: the introduction on the plateau, a part in its own world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'site';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts, modes, scenarios and settings of the lab', () => {
    for (const s of script.segments) {
      for (const [name, arg] of cuesOf(s.text)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        else if (name === 'lab') {
          const [labName = '', ...rest] = arg.split(':');
          expect(LAB_CUE_NAMES as readonly string[], at).toContain(labName);
          // the app must understand it: an unknown scenario, an out-of-range hour, a flap that is neither winter nor summer is ignored by `runCue`
          expect(planCue(labName, rest.join(':') || undefined), at).not.toBeNull();
        } else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('writes `[[lab:…]]` cues as the kit hands them over: the first colon cuts the hook’s name, the rest is its argument', () => {
    for (const s of script.segments)
      for (const [name, arg] of cuesOf(s.text)) if (name === 'lab') expect(arg, s.id).toMatch(/^[a-z]+(:[a-z0-9-]+)?$/);
  });

  it('frames only parts of the current world, and never a part that exists only in the earth tube’s scenario', () => {
    for (const s of script.segments) {
      let world = s.scene;
      for (const [name, arg] of cuesOf(s.text)) {
        if (name === 'scene') world = arg;
        const ids = name === 'frame' ? arg.split(',') : name === 'select' && arg !== 'none' ? [arg] : [];
        for (const id of ids) {
          expect(worldOf(id), `${s.id}: ${name} ${id}`).toBe(world);
          expect(WHAT_IF_PARTS, `${s.id}: ${name} ${id} is drawn only in the what-if`).not.toContain(id);
        }
      }
    }
  });

  it('switches off what it switches on: the tools, and every setting of the simulation it touched', () => {
    for (const s of script.segments) {
      const on = new Set<string>();
      // the simulation as the narration leaves it: nothing has to stay changed (the starting point is the 1967 prototype, at an hour a second)
      const touched = new Set<string>();
      for (const [name, arg] of cuesOf(s.text)) {
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
        if (name !== 'lab') continue;
        const [labName = '', value = ''] = arg.split(':');
        const set = (key: string, back: boolean): void => void (back ? touched.delete(key) : touched.add(key));
        if (labName === 'preset' && value === 'prototype-1967') touched.clear();
        else if (labName === 'preset' || labName === 'scenario' || labName === 'reset') touched.add('start');
        else if (labName === 'flap') set('flap', value === 'winter');
        else if (labName === 'vents') set('vents', value === 'open');
        else if (labName === 'earthtube') set('earthtube', value === 'off');
        else if (labName === 'setpoint') set('setpoint', Number(value) === ROOM_SETPOINT);
        else if (labName === 'sheets') set('sheets', Number(value) === 2);
        else if (labName === 'thickness') set('thickness', Number(value) === 60);
        else if (labName === 'speed') set('speed', Number(value) === DEFAULT_TIME_SCALE);
        else if (labName === 'pause') touched.add('pause');
        else if (labName === 'play') touched.delete('pause');
        else touched.add(labName);
      }
      expect([...on], `${s.id} leaves tools on`).toEqual([]);
      expect([...touched], `${s.id} leaves the simulation changed`).toEqual([]);
    }
  });

  it('uses only the tools of the world it is in (src/three/index.ts): the section in the house, the X-ray where the world opens shells, no explode on the plateau', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      for (const [name, arg] of cuesOf(s.text)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(WORLD[world].cutaway, `${s.id}: section in ${world}`).toBe(true);
        if (name === 'xray' && arg === 'on')
          expect('xrayShell' in WORLD[world], `${s.id}: X-ray in ${world}`).toBe(true);
        if (name === 'explode' && Number(arg) > 0) expect(world, `${s.id}: explode on the plateau`).not.toBe('site');
        if (name === 'isolate' && arg === 'on') expect(s.scope, `${s.id}: isolate needs a selection`).toMatch(/^part:/);
      }
    }
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = cuesOf(s.text).filter(([n]) => CAMERA_CUES.includes(n) || n === 'mode');
      expect(camera, s.id).toEqual([]);
    }
  });

  it('shows the earth tube in its three parts and nowhere else: on with the first word, off at a sentence boundary with the closing sentence still to come', () => {
    for (const s of script.segments) {
      const tube = cuesOf(s.text).filter(([n, a]) => n === 'lab' && a.startsWith('earthtube'));
      if (!WHAT_IF_PARTS.some((id) => s.id === `part-${id}`)) expect(tube, s.id).toEqual([]);
      else {
        expect(tube, s.id).toEqual([
          ['lab', 'earthtube:on'],
          ['lab', 'earthtube:off'],
        ]);
        expect(s.text.startsWith('[[lab:earthtube:on]]'), s.id).toBe(true);
        // the restore is not the last thing of the clip: a restore at the very end lands after the last sample of a slow page (the second review's replay read « custom » in the starting-point
        // select at the end of the buried pipe's clip), so it comes before the closing sentence, which gives it at least two seconds (about 30 spoken characters) to land
        const at = s.text.indexOf('[[lab:earthtube:off]]');
        expect(spokenOf({ text: s.text.slice(0, at) }), `${s.id}: the restore comes at a sentence boundary`).toMatch(
          /[.!?…]$/,
        );
        expect(
          spokenOf({ text: s.text.slice(at) }).length,
          `${s.id}: the restore leaves a closing sentence`,
        ).toBeGreaterThanOrEqual(30);
      }
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      for (const m of s.text.matchAll(CUE)) {
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        const at = spokenOf({ text: s.text.slice(0, m.index) }).length;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the worlds and the modes in the introduction, and ends on the house, nothing selected', () => {
    const cues = cuesOf(seg('intro').text).map(([n, a]) => `[[${n}${a ? ':' + a : ''}]]`);
    for (const w of sceneIds) if (w !== 'site') expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-1)).toEqual(['[[select:none]]']);
    // the last world it names is the house, where the lab opens
    expect(cues.filter((c) => c.startsWith('[[scene:')).pop()).toBe('[[scene:house]]');
  });

  it('gives each world a home view first and walks through at least four of its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 4 parts`).toBeGreaterThanOrEqual(4);
    }
  });

  it('carries each truth of the lab once, in its place, and never again', () => {
    for (const [truth, [re, id]] of Object.entries(ONCE[lang]!)) expect(where(re), truth).toEqual([id]);
  });

  it('never promises safety or exactness', () => {
    expect(where(REFUSED[lang]!)).toEqual([]);
  });

  it('keeps to its sources: nothing the fact-check found going past them comes back, and the wording that keeps to them is there', () => {
    for (const [re, why] of WENT_PAST[lang]!) expect(where(re), `${re}: ${why}`).toEqual([]);
    for (const [id, re] of KEPT_TO_THE_SOURCE[lang]!)
      expect(spokenOf(seg(id)).toLowerCase(), `${id}: ${re}`).toMatch(re);
  });

  it('keeps the simulation’s starting-point label: every segment leaves the select on the 1967 prototype, never on « custom » (qa D14)', () => {
    let touched = 0;
    for (const s of script.segments) {
      const labCues = cuesOf(s.text).filter(([n]) => n === 'lab');
      if (labCues.length === 0) continue;
      const sim = new HouseSim();
      for (const [, arg] of labCues) {
        const [name = '', ...rest] = arg.split(':');
        expect(runCue(sim, name, rest.join(':') || undefined), `${s.id}: ${arg}`).toBe(true);
        // the clock runs while the voice speaks (an hour a second: the day and the hour move in the parameters)
        sim.step(0.5);
      }
      expect(sim.params.preset, `${s.id} ends on « ${sim.params.preset} »`).toBe('prototype-1967');
      expect(startingPointOf(sim), s.id).toBe('prototype-1967');
      touched++;
    }
    // the segments that touch the simulation: the three earth-tube parts, the sheets, the vents, the set point, the flap, the clock…
    expect(touched).toBeGreaterThanOrEqual(18);
  });

  it('says only today’s figures of the lab', () => {
    expect(
      DEFAULT_TIME_SCALE,
      'the voice says « a day a second » for 86,400 and « an hour a second » is the opening',
    ).toBe(3600);
    for (const [value, said, tolerance, fr, en, ids] of FIGURES) {
      const re = i === 0 ? fr : en;
      expect(Math.abs(value - said), `${re} against ${value}`).toBeLessThanOrEqual(tolerance);
      for (const id of ids) expect(spokenOf(seg(id)), `${id}: ${re}`).toMatch(new RegExp(re.source, 'i'));
    }
    // « more than one and a half times »: the January sun on the wall against June's
    expect(FIG.janJun.v).toBeGreaterThan(1.5);
    expect(FIG.janJun.v).toBeLessThan(2);
    expect(spokenOf(seg('part-south-facade'))).toMatch(
      i === 0 ? /plus d’une fois et demie/ : /more than one and a half times/,
    );
    // « about twice an hour »: the front's 620 cubic metres an hour against the house's 300
    expect(FIG.frontFlow.v / 300).toBeGreaterThan(1.9);
    expect(FIG.frontFlow.v / 300).toBeLessThan(2.2);
    expect(spokenOf(seg('part-floor-return'))).toMatch(i === 0 ? /deux fois par heure/ : /twice an hour/);
    // the scenarios and the starting point the cues name are the ones the panel offers
    for (const s of script.segments)
      for (const [n, a] of cuesOf(s.text)) {
        if (n === 'lab' && a.startsWith('scenario:')) expect(SCENARIO_IDS as string[], s.id).toContain(a.slice(9));
        if (n === 'lab' && a.startsWith('preset:')) expect(PRESET_IDS as string[], s.id).toContain(a.slice(7));
      }
  });

  it('never says a measurement it does not have: the word only reports the sources’ measuring, or asks for a measurement', () => {
    const measured = { fr: /mesur/i, en: /measur/i }[lang as 'fr' | 'en'];
    // the sources measured the 1967 house (the 1974 building says only « a year of recordings » for the other); the sheets of the instruments, the earth tube and the models say what could be measured
    const reporting = [
      'intro',
      'part-air-thermocouples',
      'part-earth-tube-drain',
      'part-earth-tube-pipe',
      'part-fresh-air-vent',
      'part-prototype-house',
      'part-pyranometer',
      'part-twin-house',
      'part-wall-thermocouples',
    ];
    // the French also says « les mesures » of a window and of a recess whose sizes no source gives
    const sizes = lang === 'fr' ? ['part-entrance-recess', 'part-north-window'] : [];
    expect(where(measured).sort()).toEqual([...reporting, ...sizes].sort());
  });

  it('does not hang a hedge on every figure: never « dans le modèle », and the model is named only where a figure stands against a source or the model is the subject', () => {
    const inTheModel = { fr: /dans le modèle/i, en: /in the model/i }[lang as 'fr' | 'en'];
    expect(where(inTheModel)).toEqual([]);
    const ours = {
      fr: /notre (modèle|calcul|simulation|scénario|estimation)|le modèle/i,
      en: /our (model|calculation|simulation|scenario|estimate)|the model/i,
    }[lang as 'fr' | 'en'];
    expect(where(ours).length).toBeLessThanOrEqual(24);
  });

  it('is anonymous: no person, channel, company, brand, institution or series, in a text or a title', () => {
    const names =
      /trombe|\bmichel\b|\bmorse\b|kelbaugh|balcomb|anderson|kipp|cnrs|promes|merim[ée]e|\bdrac\b|ministère|ministry|\bla poste\b|penn ar web|youtube|wikipedia|pvgis|era5|nasa|\bgiec\b|ademe|pelton|princeton|los alamos|darmstadt|\bsète\b|chauvency|\bmeuse\b|perpignan|mont-louis|il était une fois|once upon a time|maestro|elevenlabs|voicebox|qwen|whisper/i;
    for (const s of script.segments) expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(names);
  });

  it(`says where the houses stand nowhere beyond « ${THE_ONLY_PLACE} »: no region, range, commune, country, coordinate or street`, () => {
    const places =
      /pyr[ée]n|cerdagne|font-romeu|via\b|targassonne|catalo|languedoc|roussillon|occitanie|bretagne|perpignan|\bs[èe]te\b|p[ée]cout|fran[cç]|french|europe|spain|espagn|andorr|toulouse|barcelon|\bmeuse\b|\bvosges\b|\blat(?:itude)?\b|longitude|coordonn|coordinate|\brue\b|\bstreet\b|camino|\bbâtiment\d|\bbatiment\d|\bign\b|mérimée|\bPA\d|\bACR\d|_gaz|\/notice\//i;
    for (const s of script.segments) {
      const text = `${s.title} ${spokenOf(s)}`;
      expect(text, s.id).not.toMatch(places);
      const spoken = spokenOf(s);
      // the only capitalised place name a sentence may carry in the middle is the setting's
      const names = [...spoken.matchAll(/(?<=[a-zà-ÿ,;:] )[A-ZÀ-Ý][a-zà-ÿ]{3,}/g)].map((m) => m[0]);
      for (const name of names)
        expect(
          [
            'Odeillo',
            'Sources',
            'Éclaté',
            'Transparence',
            'Coupe',
            'Flux',
            'Explode',
            'Section',
            'Flows',
            'Isoler',
            'January',
            'February',
            'April',
            'June',
            'July',
            'December',
            'American',
          ],
          `${s.id}: ${name}`,
        ).toContain(name);
    }
    expect(spokenOf(seg('intro'))).toContain(THE_ONLY_PLACE);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†«»]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kWh|Wh|kW|MJ|W\/m|cm|mm|km|kg|etc|ex)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(150);
        if (sentence.length > 120) over120++;
      }
    }
    // Pelton Lab's French has 35 in 72 segments; this guide is held to fewer
    expect(over120).toBeLessThanOrEqual(lang === 'fr' ? 18 : 8);
  });

  it('marvels without gushing, and asks questions: exclamations and questions as in the style page', () => {
    const all = script.segments.map(spokenOf).join(' ');
    const per1000 = (re: RegExp): number => ((all.match(re) ?? []).length / all.length) * 1000;
    expect(per1000(/!/g)).toBeGreaterThanOrEqual(0.5);
    expect(per1000(/!/g)).toBeLessThanOrEqual(1);
    expect(per1000(/\?/g)).toBeGreaterThanOrEqual(0.25);
    expect(per1000(/\?/g)).toBeLessThanOrEqual(0.6);
  });

  it('speaks to the listener the way the series does: « vous », « on », never « tu »', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    for (const s of script.segments)
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(
        /\b(color\w*|center\w*|liter\w*|meters?|kilometers|centimeters|millimeters|gray|draft\w*|insulator\w*|analyze\w*|neighbor\w*|labor|fiber\w*|aluminum|plow\w*)\b/i,
      );
  });

  it('follows one small ray of sunshine from the introduction into the parts that meet it', () => {
    const ray = { fr: /rayon/i, en: /\bray\b/i }[lang as 'fr' | 'en'];
    const heard = where(ray);
    for (const id of ['intro', 'part-outer-glazing', 'part-black-paint', 'part-storage-wall', 'part-roof-insulation'])
      expect(heard, id).toContain(id);
  });

  it('stays within the budget, the aim and what the generator accepts', () => {
    const lengths = script.segments.map((s) => spokenOf(s).length);
    const total = lengths.reduce((n, l) => n + l, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(SEGMENT_CAP);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('shows no place beyond « Odeillo » in its subtitles or its titles: not the commune, its département, a region, the main city, a villa’s town, a record’s id', () => {
    // the subtitles are the script's words, so what the script may not say, they may not either (the second test of the script's own, above)
    const shown = manifest!.segments.flatMap((s) => [s.title, ...s.captions.map((c) => c.text)]).join(' ');
    expect(shown).toContain(THE_ONLY_PLACE);
    expect(shown).not.toMatch(
      /font[- ]?romeu|odeillo[- ]via|pyr[ée]n[ée]es|cerdagne|occitanie|bretagne|languedoc|roussillon|perpignan|\bmeuse\b|\bs[èe]te\b|p[ée]cout|\bPA\d{6,}|\bACR\d{6,}|_gaz/i,
    );
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language: same segments, same cues, in the segment’s own time', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
    for (const m of manifest!.segments) {
      const s = script.segments.find((x) => x.id === m.id)!;
      expect(m.cues.length, m.id).toBe(cuesOf(s.text).length);
      for (const cue of m.cues) {
        expect(cue.t, `${m.id}: a cue before the voice starts`).toBeGreaterThanOrEqual(0);
        expect(cue.t, `${m.id}: a cue after the voice ends`).toBeLessThanOrEqual(m.duration + 0.5);
      }
      // the subtitles follow the voice: in order, inside the segment
      let t = 0;
      for (const c of m.captions) {
        expect(c.t0, `${m.id}: captions out of order`).toBeGreaterThanOrEqual(t - 0.001);
        expect(c.t1, `${m.id}: an empty caption`).toBeGreaterThan(c.t0);
        t = c.t1;
      }
      expect(t, `${m.id}: a caption after the voice ends`).toBeLessThanOrEqual(m.duration + 0.5);
    }
  });
});

describe('the private transcripts', () => {
  // Transcripts of third-party videos stay private, in ~/.cache/lab-review/research/bioclimatic-house-lab/, and this lab's cache also holds what says where the houses stand: the run below
  // reads it only when NARRATION_TRANSCRIPTS=1 (the lead's check before the owner listens), never in an ordinary `npm test`. When present, no run of seven words of a script may be copied from
  // them (they only serve to check facts).
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, k) => w.slice(k, k + n).join(' '));
  /** Only what was said: no WebVTT or SubRip header, no timing line, no inline tag, and rolling captions counted once. */
  const captions = (raw: string): string =>
    raw
      .split('\n')
      .filter((line) => !/^WEBVTT|^Kind:|^Language:|-->|^\d+$/.test(line.trim()))
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .filter((line, k, all) => line && line !== all[k - 1])
      .join(' ');
  /** The cache is outside the repository, so it is read at run time; this repo has no Node types, hence the narrow one here. */
  interface Files {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    readFileSync(path: string, encoding: 'utf8'): string;
  }
  const env = (): Record<string, string | undefined> =>
    (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
  const inCache = async (): Promise<string[]> => {
    const home = env().HOME;
    if (!home || env().NARRATION_TRANSCRIPTS !== '1') return [];
    const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Files;
    const dir = `${home}/.cache/lab-review/research/bioclimatic-house-lab`;
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(srt|vtt|txt|description)$/.test(f))
      .map((f) => fs.readFileSync(`${dir}/${f}`, 'utf8'));
  };

  it('copies no seven-word run of the captions', async (ctx) => {
    const transcripts = await inCache();
    if (transcripts.length === 0) ctx.skip();
    const source = new Set(transcripts.flatMap((t) => grams(words(captions(t)), 7)));
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map(() => `${lang}/${s.id}`),
      ),
    );
    // only the places are reported, never the words: the cache is private
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string): string[] => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a tenth of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    const share = (s: Segment): number[] => {
      const total = spokenOf(s).length || 1;
      return [...s.text.matchAll(CUE)].map((m) => spokenOf({ text: s.text.slice(0, m.index) }).length / total);
    };
    for (const s of fr.segments) {
      const [a, b] = [share(s), share(en.segments.find((x) => x.id === s.id)!)];
      a.forEach((x, k) => expect(Math.abs(x - b[k]!), `${s.id}: cue ${k}`).toBeLessThanOrEqual(0.1));
    }
  });
});
