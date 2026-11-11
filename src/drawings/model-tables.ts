// The results of the model that the sheets print, pinned here and held to docs/physics.md by drawings.test.ts: a sheet never runs a season at the moment it is opened. A pin is not a target: when the model moves, the lines of docs/physics.md move, this
// file with them. Each table says which line of docs/physics.md it is.

/** §4.5, the efficiency of the collector by month, January to December, %: what S1's curve gives by eye, and what the model gives on the PVGIS series. */
export const MONTH_EFF_EYE = [37, 35, 31, 26, 22, 15, 17, 24, 27, 33, 36, 36] as const;
export const MONTH_EFF_MODEL = [25, 29, 24, 20, 18, 20, 28, 29, 32, 34, 29, 28] as const;

/** §4.2, Table II against the model, the first days: ΣQ given back in kJ/m² of collector, the model's, and its efficiency in %. The dates are Table II's. */
export const DAYS_MODEL: { date: string; sum: number; eff: number }[] = [
  { date: '23/12', sum: 7347, eff: 34.1 },
  { date: '24/12', sum: 4179, eff: 367 },
  { date: '25/12', sum: 4476, eff: 22.4 },
  { date: '26/12', sum: 5186, eff: 29.5 },
  { date: '27/12', sum: 3635, eff: 77.0 },
  { date: '28/12', sum: 2254, eff: 45.8 },
  { date: '29/12', sum: 3856, eff: 19.2 },
];

/** §5, the ladder of the share: what electricity does not pay for, %; and the lines of the load as shares of it, %. */
export const LADDER = {
  wall: 32.0,
  windows: 42.5,
  all: 47.1,
  lines: { wallAir: 9.8, wallConduction: 14.4, windows: 18.9, people: 6.0, electricity: 52.9 },
} as const;

/** §5, the sensitivity table, the last rung ("the wall, the windows and the people"): what moves the share, %. */
export const SENSITIVITY: { key: string; fr: string; en: string; share: number; line: string }[] = [
  { key: 'g1', fr: 'Isolation de 1974 (G 1,00)', en: '1974 insulation (G 1.00)', share: 74.2, line: 'G = 1.00' },
  { key: 'air5', fr: 'Air plus chaud de 5 K', en: 'Air 5 K warmer', share: 61.1, line: 'Air +5 K' },
  { key: 'set18', fr: 'Thermostat à 18 °C', en: 'Thermostat at 18 °C', share: 52.6, line: 'Setpoint 18 °C' },
  { key: 'base', fr: 'Telle que dessinée', en: 'As drawn', share: 47.1, line: 'As it stands' },
  { key: 'win30', fr: 'Fenêtres de 30 m²', en: '30 m² of windows', share: 45.6, line: 'Windows 30 m²' },
  {
    key: 'win0',
    fr: 'Fenêtres en mur plein, gens à 500 W',
    en: 'Windows as plain wall, people 500 W',
    share: 42.1,
    line: 'Windows 0 m²',
  },
  { key: 'cha', fr: 'À Chauvency', en: 'At Chauvency', share: 31.7, line: 'Chauvency' },
  { key: 'th45', fr: 'Mur de 45 cm', en: '45 cm wall', share: 47.7, line: '45 cm; 37 cm' },
  { key: 'k30', fr: 'Débit de l’article', en: 'The recorded flow', share: 46.6, line: "Loop's K = 30" },
];

/** §4.3, the flow against the loop's minor losses K: peak flow of the clear days, L/s, and the air leaving the duct, °C; K = 4 is the model's. */
export const FLOW_VS_K: { k: number; flow: number; airOut: number }[] = [
  { k: 2, flow: 50.2, airOut: 34.9 },
  { k: 4, flow: 40.9, airOut: 37.6 },
  { k: 8, flow: 32.8, airOut: 40.9 },
  { k: 16, flow: 25.9, airOut: 44.6 },
  { k: 30, flow: 20.7, airOut: 48.2 },
  { k: 40, flow: 18.6, airOut: 49.9 },
];
