// Test helper: the numbers that the texts of src/data type in themselves, because a source reports them. Everything else a text prints comes through a figure of ./figures.ts, which carries its mark. Each group says where the numbers are
// from (the research's tables, docs/research.md): a number in a text that is in neither place fails data.test.ts. Not imported by the application.

export const KNOWN: readonly number[] = [
  // ---- the house, S1 Table I and p. 202 (K1–K18): storeys, rooms, area, volume, K, G, collector, the element, the glass, the gap, the ducts
  1,
  4, 76, 300, 1.34, 1.63, 1.0, 0.4, 48, 0.16, 0.1, 55, 450, 525, 650, 0.6, 0.37, 4.38, 1.27, 0.12, 3, 0.565, 56.5, 0.11,
  0.11, 621.5, 3.5, 3.5, 4.5, 4.5, 2, 6, 7,
  // the material, K11: ρ 2,200, λ 1.75, 0.22 kcal/kg·K; the 1974 glass 4 mm
  2200, 1.75, 0.22, 0.94, 0.88,
  // ---- the place and the method, K19–K22: 1,550 m, 17 and 20 °C, 1.50 m, 1 October to 20 May, 60 to 70 %, 35 to 45 %
  1550, 17, 20, 1.5, 1.5, 60, 70, 35, 45, 20, 18, 1, 10, 12,
  // ---- what they measured, K23–K40: lags 14–16 h and 9–10 h, 3.7–4 cm/h, 30–35 % and 35–40 % of the total, 2–3 h, 30–35 K and 40–45 K, −3 to +9 K, ± 28 %, 4 %, ± 20 %, ± 13 %, 8 to 10 points, 36.7 %
  14,
  16, 9, 3.7, 4, 30, 40, 2, 28, 13, 8, 5, 36.7, 36,
  // the recordings by eye, K37–K39: plate 63–66 °C, inner 25–28 °C, air out 40–43 °C, flow about 20 L/s, peak 3.3–3.5 MJ/m² (about 950 W/m²), the days' energy
  63,
  66, 25, 26, 27, 28, 43, 3.3, 950, 20.3, 20.3, 21.63, 1.14, 20.04, 16, 15,
  // Christmas Eve, K31: 1,134 in, 5,424 out, 478.30 %; the 29 December 18.88 %
  1134, 5424, 478, 478.3, 478.3, 18.88, 29,
  // ---- the sun, K34 and the patents: over 70° at the solstice; Morse 1881, Trombe and Michel's priority 1971
  1881, 1971, 1967, 1974, 1975, 1976, 1978, 1991, 2011, 1969, 1970, 2009, 1968, 2013, 2005, 2023,
  // ---- PVGIS at the clearing, K55: 129.6 and 78.7, 126.9 and 58.5 kWh/m²; 1,334 and 1,550 kWh/m² a year; air 6.6 mean, −1.2 in January, 15.7 in July; the horizon 2.7°, 5.7°, 1.1°, about 8° (K57)
  129.6,
  78.7, 126.9, 58.5, 1334, 6.6, 1.2, 15.7, 2.7, 5.7, 1.1, 8,
  // ---- the furnace and the monument, K60 and K61: 48 and 54 m, 1,000 kW, 1,830 m², focal 18 m, 63 heliostats, 2,835 m², about 61 × 34 m; the 1974 building 333 m², 37 × 14 m, 12.9 m, 6 or 7 rooms, 25 May 2011
  54,
  1000, 1830, 18, 63, 2835, 61, 34, 333, 37, 14, 12.9, 25,
  // ---- comparators: Kelbaugh 72 %, 58 to 68 °F, 4–5 °F (K44, K47); Balcomb's 68 % and test rooms 38, 26 and 9 °F at 4 p.m. and 10 p.m. (K45, K46); Darmstadt 156 m², 445 mm, 7.4 W/m², under 10 and about 170 kWh/m² a year, about 80 % (K62–K66)
  72,
  58, 68, 38, 9, 156, 445, 7.4, 170, 80, 75, 90, 4, 5,
  // the earth tube, K49–K54 and K89: three office systems, effectiveness 0.944, 0.766 and 0.804 (0.77 to 0.94 as written); an architect's 25 to 50 m at 1.5 or 2 m
  0.77,
  0.94, 25, 50, 1.5, 2,
  // ---- the slider ranges and the scenarios' own figures (src/sim/presets.ts RANGES, src/sim/texts.ts): thickness 15 to 80 cm, gap 5 to 20 cm, windows 0 to 30 m², people 0 to 1,000 W, thermostat 16 to 22 °C, collector 10 to 55 m², G 1.63 to 1.00 and 0.6 W/m³·K; the 5 K of the air
  15,
  80, 0, 30, 1000, 22, 0.6, 10, 55,
  // ---- the geometry the texts say in words: the pitch's rise (1.3 to 1.6 m over a half-depth of 3.3 m, the height precision 2.5 m: K86), a 15 × 6.6 × 4 m box, the open data's 2 to 3.5 m, 1,5 m cm, a metre and a half
  1.3,
  1.6, 3.3, 15, 6.6, 4, 2.5, 3.5, 0.5, 1.0,
  // ---- the hours of the model's days (16 h and 22 h of Los Alamos), the years of the record and of the film's shots
  22, 4, 21, 15,
  // ---- the order of the sheets: the 1 to 2, 3 to 5 and so on are words; and the figure 1 and 2 of the paper
  3, 1,
];
