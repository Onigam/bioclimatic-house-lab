# Physics of the Bioclimatic House lab

The simulation in `src/sim` (pure TypeScript, no DOM, no three.js, runs in Node under vitest). It models the 1967 CNRS prototype at Odeillo as its builders describe it in their 1976 paper (S1 of `docs/research.md`): one storey, 76 m², 300 m³, a south wall of 48 m² of concrete, 60 cm thick, painted black, behind two sheets of glass at 12 cm, with a duct at the floor and a duct near the ceiling.

The flow, the temperatures, the daily balances and the share of the heating are **outcomes** of the equations below, not curves drawn.

**Nothing is tuned to a reported figure.** The inputs were fixed before the first comparison. §7 lists every change made after a comparison, with its reason: none moves a parameter towards a source. The pins of `src/sim/figures.test.ts` record what the model gives; a pin is not a target.

Words used for a number: **reported** (a source of `docs/research.md`, K or S number), **derived** (computed from reported figures, the computation is next to it), **estimate** (the sources are silent: a choice with its reason), **assumption** (a choice of how to run it), **model** (an output of this simulation), **by eye** (read off a printed curve, ± a few percent). In what a visitor reads `†` marks a model result and `*` an estimate.

## The short version

| Question                                | Answer of the model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Can this house heat itself?**         | **The wall alone: 32 % of the heating load over the season. With the south windows: 42.5 %. With the people too: 47 %.** On PVGIS's sun and ERA5's air (2.9 °C on average over the heating period), 16.7 m² of windows and 500 W of people, both estimates. The inventors say 60–70 %, a 1978 model about 40 %, a colleague 75–90 %. **The model reaches the bottom of the inventors' range only if the air at the site is 5 K warmer than ERA5 says** (K58 is a real tension: their clear days average 5 °C, ERA5's December and January −0.5 °C). It says so; it does not settle who is right. |
| The wave in the wall                    | **Retrieved.** Closed form: 4.03 cm/h, 14.9 h through 60 cm, 9.2 h through 37 cm, against 3.7–4 cm/h, 14–16 h, 9–10 h measured. In the numerical wall, the crest followed inside the concrete: 3.85 cm/h and 14.5 h at 60 cm, 8.1 h at 37 cm (an hour short).                                                                                                                                                                                                                                                                                                                                    |
| The total given to the house            | **Retrieved, row by row, on the source's own weather.** 35.0 % against 36.7 % over the 20 continuous days of its Table II; 29 December 3,856 against 3,800 kJ/m², 28 December 2,254 against 2,223.                                                                                                                                                                                                                                                                                                                                                                                               |
| Christmas Eve 1974                      | **The phenomenon is retrieved, the figure is not.** On the same 1,134 kJ/m² of sun the model gives 4,179 kJ/m² back, 367 %. The source: 5,424, 478.30 %. The wall starts the day about 2 K cooler in the model than on the recording.                                                                                                                                                                                                                                                                                                                                                            |
| The air flow                            | **Not retrieved.** 34–41 L/s at the peak of the clear days against about 20 L/s recorded. The gap is what the research foresaw, and it is reported, not tuned. In June the model finds 14–20 L/s, the recording still 20: its curves stay flat from December to June where a push from warm air should double. §4.3.                                                                                                                                                                                                                                                                             |
| Air against conduction                  | **Not retrieved.** Thermocirculation is 51 % of the total in the model, 31 % in the table. The total agrees, the split does not. Lowering the flow does not close it: S1's inner-face streams are about twice what its own λ allows between its own curves. §4.4.                                                                                                                                                                                                                                                                                                                                |
| Does the flow's gap change the answer?  | **No.** From a loss factor of 2 to 40, 50 L/s to 19 L/s, the season's share moves from 47.2 to 46.5 %.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Too thick, too thin?                    | **It decides the hour, not the amount.** The season's share is 46.6 to 48.1 % from 15 to 80 cm, top at about 30 cm. The crest reaches the inner side near 4 h at 60 cm, 22 h at 37 cm, midnight at 45 cm, the inventors' wish. Their other wish, a lag of about 12 h, asks for 48 cm by the closed form, 51 cm by the crest in the wall. At 60 cm the inner face moves by ± 0.25 K, at 37 cm by ± 2.1 K, at 15 cm by ± 10 K.                                                                                                                                                                     |
| More sun in January than in June?       | **Exact from PVGIS:** 129.6 against 78.7 kWh/m², × 1.65. By the model's own clear days × 1.77. At noon the glass passes 0.75 in December, 0.50 in June.                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| A reverse flow at night?                | **The model finds one**, −12 L/s for 5 h on a clear December night, and more after cloud (−17 L/s). **S1's curves show none.** Kelbaugh's house had it. It costs little here: 0.4 kWh a night, a flap brings 1 point of share.                                                                                                                                                                                                                                                                                                                                                                   |
| How long does the wall carry the house? | After clear days, the sun out: 45 kWh the first day, 10 the second, against a load of 248 kWh a day. From the third day it takes from the room.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| The earth tube, at Odeillo              | **One point of share.** A 50 m pipe at 2 m on half a volume an hour: January −1 → 3 °C, July 15 → 10 °C, 625 kWh a year of a 57,000 kWh load, no cooling worth the name. At sea level: 731 kWh of heat and 484 kWh of cooling on a 22,000 kWh load.                                                                                                                                                                                                                                                                                                                                              |
| The summer position                     | 2.2 to 3.3 volumes an hour against about 2 on the recorded flow. It works too well here: in June the room falls to 13–19 °C with the air at 8–18 °C.                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## 1. The hand checks, first

Done by hand before the model and held by tests (`figures.test.ts`, « the hand checks »):

| Check                              | Computation                                      | Result                             | Source                             | K   |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------- | ---------------------------------- | --- |
| Diffusivity                        | λ/(ρc) = 1.75/(2,200 × 921)                      | 8.64×10⁻⁷ m²/s                     | their own material                 | K71 |
| Speed of the crest                 | √(2αω), ω = 2π/86,400                            | **4.03 cm/h**                      | 3.7–4 cm/h                         | K24 |
| Depth of 1/e                       | √(2α/ω)                                          | 0.154 m                            |                                    | K71 |
| Lag and damping, 60 cm             | L/speed, e^(−L/δ)                                | **14.9 h**, 2.0 %                  | 14–16 h                            | K23 |
| Lag and damping, 37 cm             |                                                  | **9.2 h**, 9.1 %                   | 9–10 h                             | K23 |
| Lag and damping, 45 cm             |                                                  | 11.2 h, 5.4 %                      | « better 40–45 cm »                | K24 |
| A real slab, a film on far side    | 1/(cosh γL + (h/kγ) sinh γL), γ = (1+i)/δ, h 7.6 | 13.95 h, 2.96 %; 8.26 h at 37 cm   | the far face comes an hour earlier | K71 |
| The mass                           | 48 × 0.60 × 2,200                                | 63.4 t, 58.4 MJ/K, 16.2 kWh/K      |                                    | K72 |
| Density at altitude                | standard atmosphere, 1,550 m: 84.0 kPa           | 0.999 kg/m³ at 20 °C               | their « 1 kg/m³ »                  | K19 |
| A flow against Table II            | 20 L/s × 1 × 1,007 × 26 K / 5.56 m², over 7 h    | 94 W/m², 2,373 kJ/m²               | 2,172 kJ/m²                        | K75 |
| Christmas Eve                      | 5,424 / 1,134                                    | **4.783**                          | 478.30 %                           | K31 |
| The wall's seasons                 | 129.6 / 78.7; 126.9 / 58.5                       | **× 1.65; × 2.17**                 | PVGIS                              | K56 |
| Noon on the wall                   | 90° − (42.5° − δ)                                | 24.05° in December, 70.95° in June | above 70° at the solstice          | K34 |
| The wall alone on the table's days | 6,719 kJ/m² × 48 m² / (489 W/K × 14.3 K × 24 h)  | 53 %                               | research: 51 % on 25 days          | K76 |
| Their conduction, by hand          | (1.75/0.60) × (37 − 26.5) K, by eye, the 23rd    | **31 W/m²**                        | their Qr + Qc: 66 W/m². §4.4       | new |

The wave is **the backbone and it holds**: with the source's own material the textbook finds the source's own measurements. The numerical wall is tested against this: a sine on one face, a film on the other, the grid's lag within 5 % of the slab's closed form.

## 2. The model

**One column of wall, one gap, one room**, the element multiplied by the wall's area (8.63 elements of 5.56 m²): no edges, no four rooms, no vertical structure in the wall. A step is a minute of model time, in two parts: what holds heat goes through the kit's network; what holds almost none (the wall's two faces, the gap's air) is solved in closed form.

**The network** (`src/sim/plant.ts`, on `createNetwork`, `buildGrid`, `stepNetwork`): the store as a one-dimensional grid of cells of about 2.5 cm (24 at 60 cm), one to three sheets of glass, the room's air, the room's mass, three fixed nodes outside.

**The sun** (`solar.ts`, `optics.ts`, `climate.ts`). Position and clear-sky formula copied from Solar Heater Lab's `solar.ts`: Meinel's 0.7^(AM^0.678) with Laue's altitude term, diffuse a tenth of the beam, ground albedo 0.2. Each day has that clear-sky shape, scaled to its total: **a record's total, as printed, or the month's from PVGIS**. A day at under a quarter of its clear total has no beam at all. The beam stops under a coarse horizon (K57) and the plate's top is in the shadow of the head of the frame by gap × tan(profile angle): 8 % of the plate at noon in June, 1 % in December.

**The glass**: Fresnel's two polarisations and the sum over reflections between N sheets, absorption e^(−KL/cos θ₂) per sheet, (τα) = τα/(1 − (1 − α)ρ_d) with ρ_d read at 60°, a table per glazing. Diffuse at one angle, 59.5° (Brandemuehl and Beckman's fits at 90° tilt). All formulas are Duffie and Beckman's, **from memory, not read for this lab**.

**The gap.** Between the two ducts (height H = 3.50 m) the air rises against the plate at T_f and the inner glass at T_g:

T_eq = (h_p T_f + h_g T_g)/(h_p + h_g), N = (h_p + h_g) A_swept / ṁcₚ, T_out = T_eq + (T_in − T_eq) e^(−N), T̄ = T_eq + (T_in − T_eq) (1 − e^(−N))/N

The films are the kit's `naturalFilm` at altitude (1.31 × (p/p₀)^(2/3) ΔT^(1/3)), joined to the forced film of `tubeFlow` as (h_n³ + h_f³)^(1/3), the gap's hydraulic diameter passed as a tube's. Plate to glass by radiation, ε_eff from 0.94 and 0.88. The element's 0.88 m above and below the ducts is a pocket of still air: its share is taken as plate-to-glass through the two films in series.

**The plate's balance** is linear in T_f once N is known, and is solved exactly for each trial flow, so the air and the plate agree: S_p + G_c(T_c − T_f) + h_r(T_g − T_f) + (1 − s)h_s(T_g − T_f) − s h_p(T_f − T̄) = 0. Energy closes exactly: Q_air = ṁcₚ(T_out − T_in) = s A [h_p(T_f − T̄) + h_g(T_g − T̄)].

**The flow** (`solveLoopFlow`, signed): g H (ρ(T_beside) − ρ(T̄)) = sign(ṁ) [(K + 2 f L_d/D_d) ½ρv_d² + f (H/D_g) ½ρv_g²], at the site's pressure. **K = 4**, the estimate: sharp entry 0.5, turn and widening into the gap 1, narrowing and turn out 1.5, exit 1. Forward, the air enters at T_room − 3 K (K21: 17 °C for a room at 20 °C); backward, at T_room. T_beside is the room's mean air. In the summer position T_beside is the outside air, the air enters from the room and leaves outside; the room gets outside air in its place.

**The inner face**, also massless: G_c(T_c − T_b) = h_c(T_b − T_air) + h_r(T_b − T_mass), with **S1's own coefficients**: h_c the mean of 5.108 ΔT^¼ and 6.364 ΔT^⅓ kJ/h·m²·°C (K35), radiation 17.95×10⁻⁸ kJ/h·m²·K⁴, ε_eff 0.88 (K36). The kit's film is a switch (`innerFilm`).

**The room**: two nodes. The air takes the jet, the inner face's convection, half the people and the heater. The mass takes the inner face's radiation, the windows' sun and half the people. Air to mass 3 W/m²·K × 380 m² (estimate). The air's own link to outside carries half a volume an hour (estimate) and the windows; the mass's link carries the rest of the envelope. **The thermostat is ideal**, on the air, up to 20 kW; nobody heats in the summer position. Above 26 °C (estimate) the occupants open a window: 250 W/K, with its book.

**G·V, the whole-house figure.** Nobody defines it, and K79 shows K and G do not reconcile in 1974. In 1967, G·V/K is 365 m² and a box of the house has about 380 m², so **G·V is read as the whole envelope, with the south façade in it**. The network's collector and windows are physical links, so their reference loss (1.15 W/m²·K × 48 m², 3 W/m²·K × 16.7 m²) is taken out of it, and what is left runs air-to-outside through the air-to-mass film in series. A check: **the dark house with shut vents needs 98 % of G·V·ΔT**. `gvHoldsWall: false` reads it the other way (both in §5).

**Long runs** (`runs.ts`): the same `Plant` and `Weather`. `replay` lives a record, with its first day repeated 14 days before it. `periodicDay` repeats a day until nothing changes. `seasonRun` runs 1 October to 20 May (K20) with a month of run-in, on a seeded series of clear and cloudy days whose months close on PVGIS exactly. Step 120 s: 60 s moves a share by under 0.2 of a point (tested), 240 s is too long. A day's lag is read by following the crest through the cells (`CrestTracker`, §7).

## 3. Parameters

| Parameter                     | Value                         | Tag                                                      |
| ----------------------------- | ----------------------------- | -------------------------------------------------------- |
| Wall, element, glass, ducts   | §2 of the research, 1967      | **reported**, K10–K17                                    |
| ρ, λ, c of the concrete       | 2,200; 1.75; 0.22 kcal/kg·K   | **reported**, K11                                        |
| Area, volume, G               | 48 m²; 300 m³; 1.63 W/m³·K    | **reported**, K4, K6, K7                                 |
| Setpoint, floor air           | 20 °C; 17 °C                  | **reported**, K21                                        |
| Emittances of the room        | ε_eff 0.88                    | **reported**, K36                                        |
| Latitude, altitude            | 42.5°; 1,550 m                | **reported**, K19                                        |
| Sun and air of the year       | PVGIS, ERA5, 2005–2023        | **reported** by a service, K55; sits below S1's air, K58 |
| Sun and air of the records    | Table II and Fig. 3, 5, 7, 9  | **reported**; air of the figures **by eye**              |
| Plate's absorptance           | 0.93                          | estimate, 0.90–0.95                                      |
| Glass extinction, index       | 20 m⁻¹; 1.526                 | estimate, usual values                                   |
| Glass spacing                 | 25 mm                         | estimate                                                 |
| Loop's minor losses K         | 4                             | estimate, 3–5                                            |
| South windows, U, glass share | 16.7 m²; 3 W/m²·K; 0.85       | estimate, one photograph                                 |
| People and appliances         | 500 W                         | estimate, nobody says                                    |
| Air change inside G·V         | 0.5 h⁻¹                       | estimate, only splits G·V                                |
| Room's mass                   | 20 MJ/K                       | estimate, 10–40                                          |
| Air to surfaces               | 3 W/m²·K on 380 m²            | estimate                                                 |
| Wind on the glass             | 2 m/s                         | estimate; the source prints none                         |
| Open window                   | above 26 °C, 250 W/K          | estimate                                                 |
| Air's daily swing             | ± 4 K clear, ± 1.5 K overcast | by eye on the recordings                                 |
| Overcast day; persistence     | 15 % of clear; 0.3            | estimate                                                 |
| Night screen                  | 1 m²·K/W                      | estimate; S1 names them only                             |
| Soil at Odeillo               | k 1.5, α 0.7×10⁻⁶; 50 m Ø0.2  | estimate; the pipe from an architect's illustration      |

**Three towns beyond the research's table.** Chauvency-le-Château, Darmstadt and a sea-level site come from my own PVGIS 5.3 query of 2026-11-03 (SARAH3 and ERA5, 2005–2023, vertical south, same call as K55), kept in `src/sim/climate.ts` with the towns' rounded coordinates. The research's §5.3 also names Princeton: left out, nothing in the lab needs it, and PVGIS's SARAH3 doesn't cover it; the sea-level site is the « at sea level » of the earth tube's scenario. G's slider stops at 0.4 rather than the research's 0.3: under about 0.35 W/m³·K the wall and the windows alone lose more than the whole house is said to.

## 4. Figures retrieved and not retrieved

### 4.1 The table

**R** retrieved, **N** near, **X** not retrieved, **F** a finding with no target. Details of the by-eye figures are in `figures.test.ts`.

| K                                            | Figure                              | Source                                | Model                                                                       | Verdict  |
| -------------------------------------------- | ----------------------------------- | ------------------------------------- | --------------------------------------------------------------------------- | -------- |
| K8                                           | Collector per m³                    | 0.16                                  | 0.16                                                                        | R exact  |
| K18                                          | Wall/air exchange area              | 4.50 and 3.25 m²                      | 4.45 and 3.41 m² (width × duct span)                                        | N        |
| K19                                          | Air at 1,550 m, 20 °C               | 1 kg/m³                               | 0.999 kg/m³                                                                 | R        |
| K23, K71                                     | Lag, 60 cm                          | 14–16 h                               | closed form 14.9 h; crest in the wall 14.5 h                                | R        |
| K23                                          | Lag, 37 cm                          | 9–10 h                                | closed form 9.2 h; crest in the wall 8.1 h                                  | N        |
| K24                                          | Speed                               | 3.7–4 cm/h                            | closed form 4.03; crest in the wall 3.85                                    | R        |
| K25                                          | Daily efficiency, clear days        | 32–40 %                               | 19–40 % on the same days (the table's own rows: 19–43 %)                    | R        |
| K25                                          | The 1974 wall                       | 8–10 points below 1967                | 1.4 points **above**: the model's wall is dry. Left to the water            | X, said  |
| K26                                          | Thermocirculation's share           | 30–35 %                               | 51 %; 1974: 46 % against 35–40 %                                            | X        |
| K27                                          | Flow after the sun                  | « effectively » 2–3 h                 | under half its peak after 3.1 h; zero after 10 h, as Fig. 3's dashes        | R        |
| K28                                          | Plate over the gap's air            | 30–35 K mid-height, 40–45 K at bottom | 33 K, 44 K                                                                  | R        |
| K29                                          | Inner face over the room            | −3 to +9 K                            | +0.3 to +5.4 K on Dec.–Jan.                                                 | N        |
| K31                                          | Christmas Eve                       | 5,424 kJ/m², 478 %                    | 4,179 kJ/m², 367 %                                                          | N        |
| K31                                          | 28–31 Dec., ΣQ                      | 2,223; 3,800; 5,121; 6,223            | 2,254; 3,856; 5,280; 6,323                                                  | R        |
| K31                                          | Over 20 days: η                     | 36.7 %                                | 35.0 %                                                                      | R        |
| K31                                          | Over 20 days: Qt, Qr, Qc, kJ/m²/day | 2,078; 3,224; 1,417                   | 3,258; 2,421; 743                                                           | X        |
| K32                                          | Efficiency with the air             | 2 % per 10 K in winter                | 7.4 points per 10 K on a steady clear day; no slope on the table's own rows | X        |
| K34                                          | Noon incidence                      | above 70° in June, 55° after 15 April | 70.95°; 56.9°                                                               | R exact  |
| K35                                          | Film on the inner face              | their mean: 2.72 W/m²·K at 6 K        | used as input; the kit's 2.38 at sea level                                  | input    |
| K37                                          | Outer face, Christmas               | peak 63–66 °C, down to 21–24 °C       | 61 °C, down to 25.5 °C                                                      | N        |
| K37                                          | Inner face, Christmas               | about 25–28 °C, nearly flat           | 21–24 °C, nearly flat                                                       | X, 2 K   |
| K37                                          | Air out, Christmas                  | 40–43 °C                              | 33–36 °C                                                                    | X        |
| K37, K80                                     | Peak flow, clear days               | about 20 L/s                          | 34–41 L/s                                                                   | X, × 2   |
| K37                                          | Peak sun                            | about 950 W/m²                        | 898 W/m², clear-sky formula alone                                           | N        |
| K38a                                         | 1974: inner face swings             | about 21–28 °C                        | 23.5–27.5 °C                                                                | R        |
| K38a                                         | 1974: outer, flow                   | 62–64 °C; 19 L/s                      | 57 °C; 34 L/s                                                               | X        |
| K38b                                         | April: face, inner, flow            | 40–45; 20–24 °C; 20 L/s               | 44; 22–23 °C; 28 L/s                                                        | R, X     |
| K38c                                         | June: face, air out, flow           | 32–38; up to 30 °C; 20 L/s            | 29–33; 24–26 °C; 14–20 L/s                                                  | N, R     |
| K38d                                         | Feb.: face, four days               | 63, 61, 30, 52 °C by eye              | 59, 50, 30, 47 °C: a day's shape is the clear sky's, §9                     | N        |
| K39                                          | Monthly efficiency, by eye          | 36, 36, 37 … 15 in June … 33          | 25–29 in winter, 18 in May, 20 in June, 34 in Oct.: table in §4.5           | X, shape |
| K40                                          | Clear days: three bands             | near 35, 24, 17 %                     | Jan. 32, April 25, June 22, Oct. 37 %                                       | N        |
| K42                                          | A 1978 model                        | about 40 %                            | 32 % wall alone, 42.5 % with windows                                        | F        |
| K22                                          | Solar share, Odeillo                | 60–70 %                               | **47 %**; 61 % with the air 5 K warmer                                      | F        |
| K22                                          | Solar share, Chauvency              | 35–45 %                               | 32 %, the same house there                                                  | N        |
| K41                                          | A colleague                         | 75–90 %                               | 74 % at the 1974 envelope: not this house                                   | F        |
| K44                                          | Kelbaugh, cooler room               | 72 %, 17–20 °C                        | 52.6 % at 18 °C, here                                                       | F        |
| K45                                          | Thickness, Balcomb's model          | 68 % at 1 ft, a little over 70 % best | a flat 46.6–48.1 % from 15 to 80 cm                                         | F        |
| K46                                          | Test rooms: with vents              | swing 14 K, peak 4 p.m.               | 6.5 K, 3:15 p.m.: same shape, the model's room is big for its wall          | N        |
| K46                                          | Test rooms: no vents                | swing 5 K, peak 10 p.m.               | 2.2 K, 8:40 p.m.; ratio 2.9 against 2.9                                     | R ratio  |
| K47, K48                                     | Reverse flow                        | Kelbaugh yes, S1 no                   | yes, −12 L/s for 5 h: disagrees with S1's curves                            | F        |
| K54                                          | Pipes' Θ, by a steady soil          | 0.944, 0.766, 0.804                   | 0.56, 0.36, 0.69: too pessimistic for pipes run part-time; §4.6             | X        |
| K54                                          | From the source's fitted h          | 0.944, 0.766, 0.804                   | 0.92, 0.66, 0.81                                                            | N        |
| K56                                          | January against June                | × 1.65                                | exact; the model's clear days × 1.77                                        | R exact  |
| K75                                          | Thermocirculation check             | 2,172 kJ/m²                           | 2,373 by the hand check; the model's own run 3,755                          | R, X     |
| K76                                          | Clear days, wall alone              | about 51 %                            | 51 %                                                                        | F        |
| K77                                          | A season, wall alone                | 31–36 %, by hand                      | 32 %                                                                        | F        |
| K78                                          | With windows and people             | 55–70 %, by hand                      | 47 %; 61 % with the air 5 K warmer                                          | F        |
| K80                                          | Implied loss coefficient            | about 20–40                           | at K = 30 the flow is 20.7 L/s, but the air out 48 °C                       | §4.3     |
| K82                                          | Summer draw                         | about 2 volumes/h                     | 2.2 to 3.3 volumes/h                                                        | N        |
| K1–K17, K20, K21, K55, K72–K74, K79, K83–K87 | arithmetic and printed data         | exact                                 | tested one by one                                                           | R exact  |

Context only, not modelled, nothing to retrieve: K30 (error bars), K33 (moisture, no model), K43 (a repeated figure), K59–K61, K62–K65, K67–K70, K81 (a suspicion), K88, K89, K91. K52 and K53, the pipes' yearly energies, cannot be compared without the climate series of Hamm, Freiburg and Weilheim. K66's 1,154 W is exact, a comparison and nothing else.

### 4.2 The 20 days, row by row

Table II against the model, kJ/m² of collector, on Table II's own sun and air, rooms held at 20 °C as the source books them. The first week's low values are a matter of the start: nothing is known of the days before the record (its first day is repeated), and the model's wall starts about 2 K cool.

| Date  | Incident | Qt    | Qt †  | Qr    | Qr †  | Qc    | Qc †  | ΣQ    | ΣQ †  | η %    | η † % |
| ----- | -------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ------ | ----- |
| 23/12 | 21,630   | 2,172 | 3,755 | 3,968 | 2,765 | 1,741 | 827   | 7,881 | 7,347 | 36.43  | 34.1  |
| 24/12 | 1,134    | 0     | 366   | 3,829 | 3,157 | 1,595 | 656   | 5,424 | 4,179 | 478.30 | 367   |
| 25/12 | 20,034   | 2,468 | 2,595 | 2,719 | 1,627 | 1,142 | 255   | 6,329 | 4,476 | 31.59  | 22.4  |
| 26/12 | 17,588   | 1,895 | 2,746 | 2,864 | 1,988 | 1,249 | 452   | 6,008 | 5,186 | 34.16  | 29.5  |
| 27/12 | 4,704    | 429   | 811   | 2,625 | 2,341 | 1,082 | 484   | 4,136 | 3,635 | 87.91  | 77.0  |
| 28/12 | 4,904    | 323   | 342   | 1,547 | 1,717 | 353   | 195   | 2,223 | 2,254 | 45.32  | 45.8  |
| 29/12 | 20,129   | 2,082 | 2,693 | 1,277 | 1,022 | 441   | 140   | 3,800 | 3,856 | 18.88  | 19.2  |
| 30/12 | 19,971   | 1,745 | 2,817 | 2,499 | 2,106 | 877   | 357   | 5,121 | 5,280 | 25.64  | 26.5  |
| 31/12 | 21,798   | 2,089 | 3,439 | 3,052 | 2,350 | 1,082 | 534   | 6,223 | 6,323 | 28.55  | 29.0  |
| 1/1   | 21,788   | 2,237 | 3,885 | 3,064 | 2,419 | 1,366 | 746   | 6,667 | 7,050 | 30.60  | 32.4  |
| 2/1   | 20,664   | 2,411 | 4,004 | 3,184 | 2,469 | 1,475 | 917   | 7,070 | 7,390 | 34.22  | 35.8  |
| 3/1   | 21,767   | 2,510 | 4,207 | 3,432 | 2,594 | 1,467 | 978   | 7,409 | 7,780 | 34.04  | 35.7  |
| 4/1   | 20,286   | 2,554 | 3,681 | 3,692 | 2,933 | 1,643 | 941   | 7,789 | 7,554 | 38.39  | 37.2  |
| 5/1   | 20,412   | 2,555 | 3,929 | 3,383 | 2,593 | 1,604 | 942   | 7,542 | 7,464 | 36.95  | 36.5  |
| 6/1   | 19,436   | 2,741 | 3,961 | 3,539 | 2,463 | 1,715 | 1,008 | 7,995 | 7,433 | 41.13  | 38.2  |
| 7/1   | 23,907   | 2,963 | 4,801 | 3,625 | 2,466 | 1,830 | 1,049 | 8,418 | 8,317 | 35.21  | 34.7  |
| 8/1   | 20,874   | 2,285 | 4,323 | 3,988 | 2,777 | 1,906 | 1,135 | 8,179 | 8,235 | 39.18  | 39.3  |
| 9/1   | 23,310   | 2,720 | 4,832 | 4,018 | 2,646 | 2,068 | 1,148 | 8,007 | 8,626 | 37.78  | 36.8  |
| 10/1  | 20,370   | 2,670 | 4,014 | 4,098 | 3,015 | 1,933 | 1,118 | 8,701 | 8,147 | 42.71  | 40.1  |
| 11/1  | 21,798   | 2,709 | 3,962 | 4,070 | 2,975 | 1,771 | 978   | 8,550 | 7,915 | 39.22  | 36.4  |
| Mean  | 18,325   | 2,078 | 3,258 | 3,224 | 2,421 | 1,417 | 743   | 6,719 | 6,422 | 36.7   | 35.0  |

Each ΣQ in the table's column is as printed; two of them do not follow from their parts (4/1, 9/1), and the means take the parts.

### 4.3 The flow: what the gap is, and what would change it

**The model finds 34–41 L/s at the peak of the clear days against about 20 L/s**, with K = 4. The research foresaw 2 to 3 times, K80: it is 1.7 to 2.

| K (minor losses) | Peak flow, L/s | Air out, °C | Face, °C | Qt, kJ/m²/day | Thermo. share | η %  | Season's share |
| ---------------- | -------------- | ----------- | -------- | ------------- | ------------- | ---- | -------------- |
| 2                | 50.2           | 34.9        | 64.7     | 3,421         | 52 %          | 35.6 | 47.2 %         |
| **4, the model** | **40.9**       | **37.6**    | **65.3** | **3,258**     | **51 %**      | 35.0 | **47.1 %**     |
| 8                | 32.8           | 40.9        | 66.0     | 3,060         | 49 %          | 34.3 | 47.0 %         |
| 16               | 25.9           | 44.6        | 66.9     | 2,827         | 46 %          | 33.5 | 46.8 %         |
| 30               | 20.7           | 48.2        | 67.7     | 2,583         | 43 %          | 32.6 | 46.6 %         |
| 40               | 18.6           | 49.9        | 68.2     | 2,462         | 42 %          | 32.2 | 46.5 %         |
| Source           | about 20       | 40–43       | 63–66    | 2,078 ± 28 %  | 31 %          | 36.7 | 60–70 %        |

What the table says:

- **K = 30 prints 20 L/s and is not a fix**: the air comes out at 48 °C, 5–8 K too hot, and the source's Qt stays below. S1's two measurements, the flow and the air's rise, cannot be had together by one K.
- **K = 16, four times the handbook's, reaches the edge of the source's own bars**: 25.9 L/s against 20 + 28 %, 44.6 °C against 40–43 °C. Ducts of half the printed section do the same (25 L/s, 45 °C), which is what a sharp edge's contraction, a grille or a frame in the duct would do. Nobody says the ducts are clear. **This is the plausible range, not a setting**: the model stays at 4 and says 2×.
- **A clue on the plateau.** The recordings are flat-topped at 20 L/s in December (plate 65 °C, air out 43 °C) and at 20 L/s in June (plate 38 °C, air out 30 °C), in both collectors, while a column's push differs by about a factor of three between them and the flow should go with its root. The model finds 41 L/s in December and 20 L/s in June: **in June they agree.** That is K81's suspicion, the anemometer's ceiling of 60 cm/s at a centre speed of 46–64 cm/s, and it argues for it. Against it: the 1974 duct is 28 % bigger and plateaus at the same flow, and the air's temperature rise is what a lower flow would give. **Unsettled.** S1 blames turbulence and allows ± 28 %.
- **The answer to the film's question does not depend on it.** From 50 L/s to 19 L/s the season's share moves 0.7 of a point: what the air does not carry, the wall keeps and gives back through the concrete or loses a little more through the glass.

**The model's flow is not flat-topped**: it follows the plate, 19 L/s at 9 h, 36 at 14 h, 22 at 18 h.

### 4.4 Air against conduction: why the split doesn't close

The total agrees, the split doesn't: Qt 3,258 against 2,078, Qr + Qc 3,164 against 4,641 kJ/m²/day. Lowering the flow moves it only partly: at K = 30, Qt 2,583 and Qr + Qc 3,393.

**A hand check on the source's own figures:** in steady days, what crosses the wall is λ/L × (mean of the outer face − mean of the inner one). On Fig. 3, 23 December, by eye, the outer face averages about 37 °C and the inner about 26.5 °C: **31 W/m². Their Qr + Qc that day is 66 W/m²**, their 20-day mean 54 W/m². Storage cannot pay for it: 1 K of the whole wall in four days is about 3.5 W/m². So **S1's stream off the inner face is about twice what its own λ allows between its own curves.** The model's closes by construction: 37 W/m² on the 20 days.

The model's T_ref, 18 °C, is close to the 17.6 °C that S1's Qr and its T_w imply. **So the two part on T_w itself:** with S1's outer face, λ and films the inner face would stand at about 24 °C, which is what the model finds. On the recordings it stands at 26–27 °C.

Possible causes, none settled: paths a one-column wall has not got, such as the hot air of the upper duct crossing the 60 cm and warming the concrete around it, or an outer face hotter below the thermocouple's height (K28); the reading of T_w, a thermocouple 1 mm into the masonry; S1's T_ref, given at « ± 5 % » on T⁴, which, read on T⁴ itself, is ± 3.6 K on a difference of 9 K, ± 40 % on Qr, where S1 prints an inaccuracy of 4 % (my reading, to check); a lived-in room's draughts on Qc (S1's ± 20 %).

I would not touch this. It is the most interesting thing the model found, and it should reach the owner as a question.

### 4.5 The year (K39)

| Month                  | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
| ---------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1, by eye, 1974–75    | 37  | 35  | 31  | 26  | 22  | 15  | 17  | 24  | 27  | 33  | 36  | 36  |
| Model, PVGIS series, % | 25  | 29  | 24  | 20  | 18  | 20  | 28  | 29  | 32  | 34  | 29  | 28  |
| Model, a clear day, %  | 32  |     | 30  | 25  | 21  | 22  | 27  | 31  | 34  | 37  |     |     |

The fall from winter to May–June is there, 9 points against 18. **In winter the model's months are 6 to 12 points low** (November to February: 7, 8, 12 and 6; 8 to 12 in December and January), the air and the cloud of PVGIS against S1's sequences (the same model is at 35.0 % on S1's own days). **In July to September it is 5 to 11 points high**, and I don't know why: the model holds the room at 20 °C and credits air warmed from 17 °C, as S1 says it does, but the houses were lived in at some other temperature, in some other position, and the frame's shading is only the head's. Reported.

### 4.6 The earth tube

**A steady soil finds Θ of 0.56, 0.36, 0.69 against the measured 0.944, 0.766, 0.804.** It is too pessimistic: the pipes run a third of the time and their soil recovers; the source says the film dominates. From the source's own fitted h: 0.92, 0.66, 0.81, and its own NTU gives 0.925, 0.792, 0.824. For the house's pipe, a small flow in a long pipe, the steady form gives 0.81 and a fitted h would give about 0.97: **the what-if's 625 kWh could be about 750.** It stays about 1 point of share.

## 5. The share: the ladder and its sensitivity

**The ladder**: the same season four times. Each rung is measured by what is left for electricity, so what the house cannot use counts for nothing: `share = 1 − aux / (G·V × ΣΔT⁺)`. Over the period: load 46,670 kWh at 2.9 °C of mean air, sun on the wall 43,570 kWh.

| Rung                                         | Electricity, kWh | Share      |
| -------------------------------------------- | ---------------- | ---------- |
| The house in the dark, no people, vents open | 49,682           | −6.5 %     |
| The same, vents shut                         | 45,597           | 2.3 %      |
| **The wall alone**                           | 31,749           | **32 %**   |
| **The wall and the windows**                 | 26,813           | **42.5 %** |
| **The wall, the windows and the people**     | 24,686           | **47.1 %** |

The lines of the last rung, against the load: wall by air 10 %, wall by conduction 14 %, windows 19 %, people 6 %, electricity 53 %. They add to 102 %: a little of what enters is lost by a warmer house. The collector's efficiency over the period is 26 %.

**Sensitivity of the last rung.** Each row moves one thing.

| Change                           | Wall alone | + windows  | + people   | Against the dark house |
| -------------------------------- | ---------- | ---------- | ---------- | ---------------------- |
| **As it stands**                 | **32.0**   | **42.5**   | **47.1**   | **50.3**               |
| Air −2 K                         | 28.2       | 38.5       | 42.7       | 46.2                   |
| Air +3 K                         | 39.1       | 49.9       | 54.9       | 57.6                   |
| Air +5 K                         | 45.0       | 55.6       | 61.1       | 63.4                   |
| The month's mean day, no series  | 31.8       | 44.6       | 49.5       | 52.6                   |
| Five seeds of the series         |            |            | 47.3–48.0  |                        |
| Windows 0 m²                     | 37.3       | 37.3       | 42.1       | 42.6                   |
| Windows 8 m²                     | 34.7       | 40.1       | 44.8       | 46.7                   |
| Windows 30 m²                    | 23.9       | 41.3       | 45.6       | 52.6                   |
| People 0 W                       | 32.0       | 42.5       | 42.5       | 46.0                   |
| People 1,000 W                   | 32.0       | 42.5       | 51.6       | 54.5                   |
| G·V is the rest of the house     | 9.0        | 19.2       | 23.7       | 40.7                   |
| Wind 0 m/s                       | 34.9       | 45.1       | 49.6       | 52.5                   |
| Wind 5 m/s                       | 32.1       | 42.7       | 47.2       | 49.2                   |
| Absorptance 0.90                 | 31.1       | 41.8       | 46.4       | 49.7                   |
| Absorptance 0.95                 | 32.5       | 43.0       | 47.6       | 50.7                   |
| Loop's K = 30, the recorded flow | 30.7       | 42.0       | 46.6       | 48.9                   |
| The kit's film on the inner face | 31.9       | 42.4       | 47.0       | 50.0                   |
| Setpoint 18 °C                   | 36.8       | 47.6       | 52.6       | 55.4                   |
| A one-way flap                   | 33.0       | 43.6       | 48.1       | 46.9                   |
| Vents shut all season            | 24.9       | 37.9       | 42.8       | 41.5                   |
| Night screens                    | 39.4       | 49.6       | 54.1       | 53.6                   |
| The earth tube                   | 33.0       | 43.5       | 48.1       | 50.8                   |
| 45 cm; 37 cm                     | 32.6; 33.0 | 43.2; 43.5 | 47.7; 48.0 |                        |
| **G = 1.00**, the 1974 envelope  | 53.1       | 67.9       | 74.2       | 76.6                   |
| The 1974 wall on the 1974 house  | 38.4       | 50.0       | 54.4       | 57.0                   |
| Chauvency                        | 19.2       | 25.7       | 31.7       | 35.5                   |
| Darmstadt                        | 22.1       | 29.5       | 35.3       | 39.3                   |
| Sea level                        | 61.1       | 72.0       | 77.6       | 79.2                   |

What moves it, most first: **the insulation, the climate, the air's reading, the people and the windows, the night screens.** What hardly moves it: the wall's thickness, the flow, the film, the paint. **So the inventors' 60–70 % is reachable, and this is what it takes: air 5 K warmer than ERA5 (61 %); or 3 K warmer in a room at 18 °C (62 %); or 3 K warmer with night screens (62 %); 5 K warmer in a room at 18 °C reaches 69 %.** Their own period, setpoint and whether windows count are unknown. Nothing here calls them wrong; it says what it would take.

## 6. The kit's two questions

**`stackDraft` at altitude.** It calls `airRho` at sea-level pressure: 20.6 % high at Odeillo (tested). The lab writes `draftAt(H, Tcolumn, Tbeside, p)` in `plant.ts`, and scales `FILM_VERTICAL` by (p/p₀)^(2/3). Listed in `docs/kit-requests.md`, item 1.

**`tubeFlow`'s reversed flow.** This lab has a reversed flow every clear night, and needs nothing of the kit's fix. **It passes `tubeFlow` the flow's size, `Math.abs`, and keeps the sign in its own balance**, so it gives the same answer on the published 0.6.0, which reads a negative flow as laminar, and after the fix: a test holds it. The film is only used through a cube-root sum where natural convection dominates (natural 3.6 W/m²·K, forced about 1.1). Friction doesn't go through `tubeFlow` either: its jump at Re 2300 would pin a flow driven by a fraction of a pascal and print a false plateau, in a lab where the plateau is the question. `frictionOf` takes the larger of 64/Re and Petukhov's.

## 7. What was changed after a comparison

Everything else was fixed before the first comparison. Three changes to the model, a threshold, and one choice of how to read a result:

1. **The envelope's series.** The first run had the envelope's conductance in series with the air-to-mass film, a true load 23 % below G·V: the first season gave 64 %, and the dark house didn't need G·V·ΔT. A bug of the books, found by that check. It lowered the share, and did not go towards any source.
2. **The noon incidence.** A wrong formula in a helper (the zenith's in place of the altitude's), found by K34's test. It touches no model figure.
3. **The head's shadow.** Added after seeing the summer months come out high, as the one piece of geometry I knew was missing: it's geometry, with no parameter. It moved June by about one point; the summer is still high (§4.5).
4. **The paint's alarm**, an estimate, was set at 70 °C after seeing that shut vents reach 66–70 °C: at the 80 °C first written it would never ring.
5. **Reading the lag.** At 60 cm the inner face's own peak comes at 2 h, because at ± 0.25 K the room's day decides it (6 h by phase, 12.3 h with no windows). I then chose to follow the crest inside the wall, which reads the wave and finds 14.5 h. **Both are reported**: that the method was chosen after seeing the number should be known. The measured 14–16 h on a curve this flat must have come from something like this, and S1 doesn't say.

## 8. Assumptions the owner should confirm

1. **G·V is the whole house, the wall in it.** Read the other way the model gives 24 %, 41 % against the dark house. It is why K79 matters.
2. **16.7 m² of south windows and 500 W of people** are read off one photograph and nobody's data. They carry 15 points of the 47.
3. **The air of the season is ERA5's.** 5 K warmer is the difference between 47 % and 61 %. The lab should show both lines of that sentence.
4. **The first house is thermally one room.** S1 has four, with their own thermostats.
5. **Reverse flow is left in the model**, against S1's curves, because the physics asks for it and another house had it: it costs little. The flap is a scenario. If the owner prefers a default with no reverse flow, the 3D's dots at night change and nothing else.
6. **The summer position is a free choice of `mode`**: S1 does not say when the houses changed position. The model's June is run in the position its scenario names.
7. **The 2× on the flow, the 2 K on the inner face and the 51 % against 31 %** go to the visitor as they are, said once, in the panel's who-says-what. Their wording is the author's, on §4.3 and §4.4.

## 9. Limits of the model

- One column of wall: no hot bottom and cool top, no heat from the upper duct into the wall (one candidate for §4.4), no edge of 8.63 elements.
- **A day's shape is the clear sky's.** A short sharp day (21 February 1975) comes out with a lower peak than it had: 50 °C against about 61 °C.
- **No moisture.** The drying (K33) is said in words: the model only knows dry concrete. Its dry 1974 wall comes out 1.4 points above 1967, where it measured 8–10 below.
- Four rooms are one room. The floor is part of the envelope; the ground has no node.
- **Sky and wind are estimates**, wind a constant 2 m/s; no snow on the ground though it would light the wall from below and the source's sensor saw it. The sun of the records is forced anyway.
- PVGIS's horizon is the terrain's; trees and the twin house are not on it.
- Thermosiphon: one-dimensional, no two-way exchange in a duct at low flow, which may be why S1 sees no reverse flow. No flap's resistance.
- Glass: from memory; S1 gives none of τ, α, K.
- Room: ideal heater, no comfort figure, no fresh-air path of its own. **The loop recirculates the room's air, it brings none.**
- The pipe's soil is steady; no condensation, no mould, no radon: said in words where they matter (`docs/research.md` §7).
- 3 materials other than the concrete are handbook values from memory.
- The wave's closed form and the crest assume one frequency: the outer face's sharp peak travels a little faster near the surface. The fit leaves out the 20 % next to each face.

## 10. For the 3D and data roles: what's in the state

`HouseSim.state` (`src/sim/types.ts`) is flat, read-only, without allocation in the hot path (the alarms array is reused). Temperatures in °C, powers in W.

- **The wall**: `layers` (cell centres, outer to inner) and `layerDepths`, `wallThickness`. **`layers` changes length with the thickness**: 24 cells at 60 cm, 15 at 37: read `length` each frame. Faces `tOuterFace`, `tInnerFace`; glass `tGlassOuter`, `tGlassInner`; `crestDepth` (where the crest stands now, m from the outer face; NaN when none); `waveSpeedCmH`, `waveLagHours` (closed form); `lagHours`, `waveArrival` (followed in the wall, after a clear day).
- **The gap**: `flowLs` (one element, signed), `flowTotalLs`, `flowDir`, `gapSpeed` and `ductSpeed` in m/s, signed, for the dots; `tGapIn`, `tGapMean`, `tGapMid`, `tGapOut`; `flapOpen` 0 or 1. The dots run from about 0 to 30 cm/s in the gap and 60 in the duct: at real time, on `view.slowMo`.
- **The room**: `tRoom`, `tSurfaces`, and the three streams with what electricity adds: `qThermo`, `qRad`, `qConv`, `qWindows`, `qGains`, `qAux`, `qDraw`, `qTube`, `qLoad`.
- **The sky**: `sunAltitude`, `sunAzimuth` (from the south, positive west), `sunIncidence`, `glassRefuses` (0 to 1), `incidentWm2`, `tOutside`, `tSkyGround`. `dayOfYear`, `hour` (solar: the source's curves are on local time, about an hour on), `month`.
- **The day**: `dayEfficiency` (NaN on the first, partial day), `todayIncident`, `todayThermo`, `todayConduction`, `lastIncident`, `lastThermo`, `lastRad`, `lastConv`, in kJ/m² of collector, as the source books them. `recordDate`, `recordEnded`.
- **The moments for the film**: `waveArrival`, `flowStarted`, `flowStopped`, `reverseFlow`. The wave wants hours of model per second of film; the dots, real time. `params.timeScale`, `params.slowMo`, `set(patch)`; same inputs, same state.
- **On demand**: `sim.season()` (about half a second; it fills `solarShareSeason`) and `sim.ladder()` (four of them), kept by parameters; `sim.scope` for three days of curves. `src/sim/strip.ts` for the bottom strip; `src/sim/texts.ts` for every word, with `SHARE_CLAIMS` for the panel's who-says-what. `src/sim/wave.ts`'s `waveAt` draws the closed form for a slow view.
- **`src/three/dims.ts` is to import the printed figures** from `src/sim/machine.ts` (`COLLECTOR_1967`, `COLLECTOR_1974`, `HOUSE_1967`, `HOUSE_1974`), as Solar Heater Lab does. `src/lab.ts` imports `HouseSim` from `src/sim/engine.ts`. _Lead, at integration: `placeholder.ts` and the `DemoSim` re-export are deleted, and `HouseSim` gained a read-only `scenarioNow` (the scenario it was last started from, or null) so that the simulation panel can show a scenario's lesson when a lesson or the spoken guide started it from outside. Nothing else of `src/sim` changed._
- Nothing in this repository says where the houses stand beyond « Odeillo », and a test holds it.
