import type { SiteId, SkyMode } from './climate';
import type { WallMaterialId } from './machine';
import type { SeasonMode, VentMode } from './plant';
import type { AlarmKey, HouseParams, PresetId, ScenarioId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit. A figure the model finds carries †, an estimate *, a reported one nothing. The figures
// in the scenarios' words are read back and held against the model in texts.test.ts. « This is a model » is said once, in MODEL_NOTE, not in each text.

export type Pair = readonly [string, string];

export const MODEL_NOTE: Pair = [
  'Un modèle simple : un mur, une lame d’air, une pièce. † résultat du modèle ; * estimation : personne ne donne ce chiffre. Le reste est rapporté par les sources.',
  'A simple model: one wall, one gap, one room. † a result of the model; * an estimate: nobody gives this figure. The rest is reported by the sources.',
];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  roomHot: { text: ['La pièce dépasse 27 °C', 'The room is over 27 °C'], severe: false },
  roomCold: { text: ['La pièce passe sous 14 °C', 'The room is under 14 °C'], severe: false },
  faceHot: {
    text: ['La peinture noire dépasse 70 °C (seuil estimé)', 'The black paint is over 70 °C (an estimated threshold)'],
    severe: true,
  },
  reverseFlow: {
    text: [
      'L’air de la pièce descend dans la lame : le courant s’inverse',
      'Room air falls down the gap: the flow runs backward',
    ],
    severe: false,
  },
  wrongSeason: {
    text: [
      'Position d’hiver en été : le mur chauffe une maison déjà trop chaude',
      'Winter position in summer: the wall heats a house already too hot',
    ],
    severe: false,
  },
  wallTakesHeat: {
    text: [
      'Le mur est plus froid que la pièce : il lui prend de la chaleur',
      'The wall is colder than the room: it takes heat from it',
    ],
    severe: false,
  },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  // the select cuts a label at about 22 characters on a tablet (docs/qa.md, D18)
  'prototype-1967': ['Prototype de 1967', 'The 1967 prototype'],
  'building-1974': ['Maison de 1974 (37 cm)', '1974 house (37 cm)'],
  'wall-45': ['45 cm, leur souhait', '45 cm, their wish'],
  insulated: ['Isolée comme en 1974', 'Insulated as in 1974'],
  'at-chauvency': ['Même maison, Chauvency', 'Same house, Chauvency'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'christmas-1974': {
    name: ['Noël 1974', 'Christmas 1974'],
    lesson: [
      'Quatre jours mesurés. Le 24 décembre, presque pas de soleil : 1 134 kJ reçus par mètre carré, 5 424 rendus à la maison, 478 %. Ce n’est pas un rendement : c’est le soleil de la veille, encore dans le mur. Le modèle, sur ce même jour, trouve environ 370 % †.',
      'Four measured days. On 24 December, hardly any sun: 1,134 kJ received per square metre, 5,424 given to the house, 478 %. That is no efficiency: it is yesterday’s sun, still in the wall. The model, on that same day, finds about 370 % †.',
    ],
  },
  'feb-1975': {
    name: ['Février 1975, un jour terne', 'February 1975, a dull day'],
    lesson: [
      'Trois jours de soleil et un jour terne au milieu. Ce jour-là le mur rend plus que le jour ne donne : environ 80 % † du soleil reçu. Le lendemain, grand soleil, et à peine plus de 20 % † : le mur se recharge d’abord. Un bilan d’un seul jour ne veut rien dire.',
      'Three days of sun with a dull one in the middle. That day the wall gives back far more than the day brings: about 80 % † of the sun received. The next day, full sun, and hardly over 20 % †: the wall recharges first. A balance of one day means nothing.',
    ],
  },
  'april-1975': {
    name: ['Avril 1975', 'April 1975'],
    lesson: [
      'Le soleil monte. Le mur reçoit 16 MJ par mètre carré, moins qu’en hiver, et la face extérieure n’atteint plus qu’environ 44 °C †. Les rendements tombent à environ 27 % † : juste quand la maison a moins besoin de chauffage.',
      'The sun climbs. The wall receives 16 MJ per square metre, less than in winter, and its outer face only reaches about 44 °C †. Efficiency falls to about 27 % †: just when the house needs less heating.',
    ],
  },
  'june-1975': {
    name: ['Juin 1975, position d’été', 'June 1975, the summer position'],
    lesson: [
      'À midi, le soleil frappe le mur à plus de 70° de sa normale et la vitre en renvoie une bonne part. Le volet s’ouvre vers le dehors : le même mur tire maintenant l’air de la maison, environ 3 volumes par heure †. À cette altitude, la maison a peu de chaleur à combattre, et la nuit ce tirage la refroidit même trop.',
      'At noon the sun strikes the wall at over 70° from its normal and the glass sends much of it back. The flap opens to the outside: the same wall now draws the air out of the house, about 3 volumes an hour †. At this altitude the house has little heat to fight, and at night this draw even cools it too far.',
    ],
  },
  'too-thick-too-thin': {
    name: ['Trop épais, trop fin', 'Too thick, too thin'],
    lesson: [
      'La même journée claire de janvier, et l’épaisseur change. À 60 cm, la crête de la vague arrive vers 4 h du matin †. À 37 cm, vers 22 h †. Les inventeurs disaient l’un trop long, l’autre trop court, et voulaient 40 à 45 cm : vers minuit †. Regardez l’énergie de la saison : elle ne bouge presque pas, environ 47 à 48 % † de 15 à 60 cm. L’épaisseur décide de l’heure, pas de la quantité.',
      'The same clear January day, and the thickness changes. At 60 cm the crest of the wave arrives around 4 in the morning †. At 37 cm, around 10 at night †. The inventors called one too long and the other too short, and wanted 40 to 45 cm: around midnight †. Look at the season’s energy: it hardly moves, about 47 to 48 % † from 15 to 60 cm. Thickness decides the hour, not the amount.',
    ],
  },
  drying: {
    name: ['Le béton qui sèche', 'The concrete that dries'],
    lesson: [
      'Le mur de 1974 a rendu 8 à 10 points de moins que celui de 1967. Les auteurs en donnent deux raisons : moins de circulation d’air (une surface d’échange plus petite, 3,25 contre 4,50 m²) et moins de chaleur restituée par le béton, qu’ils rattachent à l’eau qui y reste et qu’ils attendent de voir partir en un ou deux ans. Le modèle ne connaît que du béton sec : il donne 36 % † à ce mur, un point de plus que celui de 1967 (35 % †), et ne retrouve donc pas l’écart.',
      'The 1974 wall gave back 8 to 10 points less than the 1967 one. The authors give two reasons: less air circulation (a smaller exchange surface, 3.25 against 4.50 m²) and less heat coming through the concrete, which they trace to the water still in it and expect to go in a year or two. The model only knows dry concrete: it gives this wall 36 % †, a point above the 1967 one’s 35 % †, and so does not retrieve the gap.',
    ],
  },
  'no-vents': {
    name: ['Sans ouvertures', 'No vents'],
    lesson: [
      'Février, ciel clair, sans chauffage, sans fenêtres : la pièce d’essai. Les ouvertures fermées, l’air de la pièce bouge d’environ 2 K † et culmine vers 21 h †. Ouvertes, il bouge de plus de 6 K † et culmine vers 15 h †. Mesuré à Los Alamos : 5 K à 22 h, et 14 K à 16 h. Moins de chaleur en tout, mais plus tard.',
      'February, clear sky, no heating, no windows: the test room. With the vents shut, the room’s air moves by about 2 K † and peaks around 9 p.m. †. Open, it moves by over 6 K † and peaks around 3 p.m. †. Measured at Los Alamos: 5 K at 10 p.m., and 14 K at 4 p.m. Less heat overall, but later.',
    ],
  },
  'the-night': {
    name: ['La nuit', 'The night'],
    lesson: [
      'Une nuit claire de décembre. Au petit matin l’air de la lame est plus lourd que celui de la pièce, et le modèle le fait descendre : environ 12 L/s † à l’envers par élément. Ni les enregistrements de 1967 ni leurs auteurs ne montrent ce courant, un autre constructeur l’a vécu. Le lendemain, un clapet l’arrête. Le gain : moins d’un demi-kilowattheure † par nuit ici.',
      'A clear December night. Before dawn the gap’s air is heavier than the room’s, and the model lets it fall: about 12 L/s † backward per element. Neither the 1967 recordings nor their authors show this flow; another builder lived it. The next day a one-way flap stops it. The gain: under half a kilowatt-hour † a night here.',
    ],
  },
  'one-glass': {
    name: ['Une vitre, trois vitres', 'One glass, three glasses'],
    lesson: [
      'Le même mur derrière une seule vitre : le mur ne rend plus qu’environ 16 % † d’un jour clair de janvier, et la nuit l’air retombe longtemps. Deux vitres, comme ici : environ 32 % †. Trois : environ 37 % †. La troisième rapporte moins que la deuxième : elle renvoie aussi plus de soleil.',
      'The same wall behind one sheet of glass: it now gives back only about 16 % † of a clear January day, and at night the air falls for hours. Two sheets, as here: about 32 % †. Three: about 37 % †. The third brings less than the second: it also sends back more of the sun.',
    ],
  },
  'insulate-first': {
    name: ['La même maison, mieux isolée', 'The same house, better insulated'],
    lesson: [
      'Rien ne change sur le mur, la maison perd seulement moins. Sur la saison de chauffe, la part que l’électricité ne paie pas passe d’environ 47 % † à 74 % † avec l’isolation de 1974. Plus loin, à 0,6 W/m³·K, environ 94 % †, mais il faut ouvrir les fenêtres : il y a plus de soleil que la maison n’en peut prendre. Pas un rayon de plus.',
      'Nothing changes on the wall, the house simply loses less. Over the heating season the share electricity does not pay for goes from about 47 % † to 74 % † with the insulation of 1974. Further on, at 0.6 W/m³·K, about 94 % †, but windows must be opened: there is more sun than the house can take. Not one ray more.',
    ],
  },
  chauvency: {
    name: ['Sous les nuages de Chauvency', 'Under the clouds of Chauvency'],
    lesson: [
      'La même maison, à Chauvency-le-Château. En janvier le soleil sur ce mur tombe à un quart de celui d’Odeillo, et le mur prend souvent à la pièce plus qu’il ne lui donne. Sur la saison, le modèle trouve environ 32 % †, là où les inventeurs annoncent 35 à 45 % pour leur maison de là-bas, dont il ignore l’isolation.',
      'The same house, at Chauvency-le-Château. In January the sun on this wall falls to a quarter of Odeillo’s, and the wall often takes more from the room than it gives. Over the season the model finds about 32 % †, where the inventors report 35 to 45 % for their house there, whose insulation it does not know.',
    ],
  },
  'earth-tube': {
    name: ['Et si : un puits canadien', 'What if: an earth tube'],
    lesson: [
      'Aucune source ne mentionne de puits canadien dans cette maison : c’est une hypothèse. L’air neuf passe par un tuyau de 50 m * enterré à 2 m *. À Odeillo, en janvier il sort à environ 3 °C † quand il fait −1 °C, en juillet à 10 °C † quand il fait 15 °C. Sur une année : environ 1 point † de plus. Au niveau de la mer, il compte davantage, et il rafraîchit vraiment l’été. Il ne remplace ni l’aération ni l’isolation.',
      'No source mentions an earth tube in this house: it is an assumption. Fresh air comes through a pipe of 50 m * buried at 2 m *. At Odeillo, in January it leaves at about 3 °C † when it is −1 °C, in July at 10 °C † when it is 15 °C. Over a year: about 1 point † more. At sea level it counts for more, and it truly cools the summer. It replaces neither ventilation nor insulation.',
    ],
  },
};

export const VENT_TEXTS: Record<VentMode, Pair> = {
  open: ['Ouvertes', 'Open'],
  closed: ['Fermées', 'Closed'],
  'one-way': ['Clapet, sens unique', 'One-way flap'],
};

export const MODE_TEXTS: Record<SeasonMode, Pair> = {
  winter: ['Hiver : l’air revient dans la pièce', 'Winter: the air comes back into the room'],
  summer: ['Été : l’air part dehors', 'Summer: the air goes outside'],
};

export const MATERIAL_TEXTS: Record<WallMaterialId, Pair> = {
  concrete: ['Béton de gravier, celui des constructeurs', 'Gravel concrete, the builders’ own'],
  brick: ['Brique pleine *', 'Solid brick *'],
  stone: ['Granite *', 'Granite *'],
  adobe: ['Adobe *', 'Adobe *'],
};

export const SITE_TEXTS: Record<SiteId, Pair> = {
  odeillo: ['Odeillo, 1 550 m', 'Odeillo, 1,550 m'],
  chauvency: ['Chauvency-le-Château', 'Chauvency-le-Château'],
  darmstadt: ['Darmstadt', 'Darmstadt'],
  sealevel: ['Au niveau de la mer', 'At sea level'],
};

export const SKY_TEXTS: Record<SkyMode, Pair> = {
  clear: ['Un jour clair', 'A clear day'],
  mean: ['Le jour moyen du mois', 'The month’s mean day'],
  series: ['Une suite de jours variés', 'A series of varied days'],
  recorded: ['Les jours mesurés en 1974-75', 'The days measured in 1974-75'],
};

/** How each slider is called, its unit, and where its value comes from: reported (none), `*` estimate. For the panel. */
export const PARAM_TEXTS: Partial<Record<keyof HouseParams, { label: Pair; unit: string; tag: '' | '*' }>> = {
  wallThickness: { label: ['Épaisseur du mur', 'Wall thickness'], unit: 'm', tag: '' },
  glazingLayers: { label: ['Vitres', 'Sheets of glass'], unit: '', tag: '' },
  gap: { label: ['Lame d’air', 'Air gap'], unit: 'm', tag: '' },
  ductScale: { label: ['Section des conduits', 'Duct section'], unit: '×', tag: '' },
  collectorArea: { label: ['Surface de mur capteur', 'Collector wall area'], unit: 'm²', tag: '' },
  southWindows: { label: ['Fenêtres au sud', 'South windows'], unit: 'm²', tag: '*' },
  G: { label: ['Déperditions G', 'Heat loss G'], unit: 'W/m³·K', tag: '' },
  setpoint: { label: ['Thermostat', 'Thermostat'], unit: '°C', tag: '' },
  gains: { label: ['Occupants et appareils', 'People and appliances'], unit: 'W', tag: '*' },
  wind: { label: ['Vent', 'Wind'], unit: 'm/s', tag: '*' },
  airOffset: { label: ['Air extérieur, décalage', 'Outside air, shift'], unit: 'K', tag: '' },
  absorptance: { label: ['Absorption de la peinture', 'Paint absorptance'], unit: '', tag: '*' },
  lossK: { label: ['Pertes de charge du circuit', 'Loop’s pressure losses'], unit: '', tag: '*' },
};

/** Who says what about the share of the heating, for the season's view. Reported, with no tag; the model's own figures come from `HouseSim.ladder`. */
export const SHARE_CLAIMS: { who: Pair; value: Pair }[] = [
  { who: ['Les inventeurs, Odeillo', 'The inventors, Odeillo'], value: ['60 à 70 %', '60 to 70 %'] },
  { who: ['Les inventeurs, Chauvency', 'The inventors, Chauvency'], value: ['35 à 45 %', '35 to 45 %'] },
  {
    who: ['Un collègue, maisons de ce genre', 'A colleague, houses of that kind'],
    value: ['75 à 90 %', '75 to 90 %'],
  },
  {
    who: ['Une simulation de 1978, non lue', 'A simulation of 1978, unread'],
    value: ['autour de 40 %, d’après un résumé', 'around 40 %, per a summary'],
  },
  {
    who: ['L’encyclopédie, à travers un livre de 2013', 'The encyclopaedia, through a book of 2013'],
    value: ['70 %', '70 %'],
  },
];
