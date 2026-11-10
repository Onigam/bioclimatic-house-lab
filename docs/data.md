# Data of the Bioclimatic House lab (data role)

The texts of the lab, in French and English written together: 56 part sheets, the assembly guide (20 steps) and the installation guide (10), four overviews, seven lessons with fourteen questions, the Sources panel, the interface strings. The house drawn is the 1967 CNRS prototype at Odeillo; its source is the inventors' own paper (S1 of `docs/research.md`), so the lab has **no main video**. Every number comes from `docs/research.md`, `docs/physics.md` or `src/three/dims.ts`.

## Files

| File                              | What                                                                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/figures.ts`             | every number that is not a source's: a size read from `dims.ts` (estimate by construction), a derived figure (`d`), a model result (`m`). Each carries its mark; `figures.test.ts` recomputes them from `src/sim`      |
| `src/data/part-helpers.ts`        | `lf` fills `{placeholders}` with number, unit and mark in each language (it throws on an unknown one); `sp` writes a spec row and turns a French-written plain value into English; `maint` writes the three paragraphs |
| `src/data/parts/*.ts`             | `site` 11, `house` 18, `wall` 14, `room` 13. `dim-specs.ts` appends the few drawn sizes no row gives, read from `dims.ts`                                                                                              |
| `src/data/assembly.ts`            | 20 steps, each in the world where its parts stand, each ending on its origin (reported, usual practice, our reconstruction)                                                                                            |
| `src/data/install.ts`             | 10 steps, same rules                                                                                                                                                                                                   |
| `src/data/overviews.ts`           | `{ title, text }` of the four worlds, for `scenes[i].overview`                                                                                                                                                         |
| `src/data/lessons.ts`             | the seven lessons, see `docs/lessons.md`                                                                                                                                                                               |
| `src/data/sources.ts`, `about.ts` | the Sources panel as data and the function that builds it (`about: aboutPanel`): links, how each source was read, the law place by place                                                                               |
| `src/i18n/ui.ts`                  | title, tagline, worlds, shortcuts, intros of Plans and Lessons, the notices of the Sources panel. The template's flywheel strings are deleted: the lead wired the lab                                                  |
| `src/data/*.test.ts`              | `data.test.ts` (ids, sheets, guides, overviews, numbers, marks, once-only, position), `figures.test.ts`, `lessons.test.ts`, `rich.test.ts`; `reported.ts` and `texts.ts` are their helpers                             |

## What the lead wires in `src/lab.ts`

- `brand.title: strL('labTitle')`, `tagline: strL('tagline')`; the four scenes `site`, `house`, `wall`, `room` with `label: strL('scene…')` and `overview: { ...OVERVIEWS[id], actions }` (the shortcuts are `goSite`, `goHouse`, `goWall`, `goRoom`).
- `guides: { assembly: { scene: 'house', steps: ASSEMBLY }, install: { scene: 'house', steps: INSTALL } }`: **every step names its own world** (`scene`), the guide's is only the default.
- `lessons: { items: LESSONS, intro: strL('lessonsIntro') }`, `plans: { sheets: SHEETS, groups: SHEET_GROUPS, intro: strL('plansIntro') }`, `about: aboutPanel`, `partLinks` (`prototype-house` → `house`, `collector-element` → `wall`, `interior-partitions` → `room`), `envelopeMark: '*'` (the sheet's « Encombrement » is the 3D's own measure), `strip.alarms` with `allGood` already overridden to « Aucune alerte ».
- _Done by the lead:_ `src/three/device.ts`, `src/sim/placeholder.ts`, the flywheel strings of `src/i18n/ui.ts` and the template's `src/panels/sim.ts` are deleted; the simulation panel is written (`src/panels/`).
- `public/lab.json`: proposed title « Maison bioclimatique : le mur qui garde le soleil » / « Bioclimatic house: the wall that keeps the sun » (research §8, question 9, **the owner's answer is pending**); tagline « Une maison peut-elle se chauffer seule ? » / « Can a house heat itself? »; a fuller line for the showcase: FR « Une maison de 1967 à Odeillo, coupée en deux : un mur de béton noir de 60 cm derrière deux vitres, la vague de chaleur qui y marche à 4 cm par heure, et la question que posent ses inventeurs : une maison peut-elle se chauffer seule ? » / EN « A house of 1967 at Odeillo, cut open: a black concrete wall 60 cm thick behind two sheets of glass, the wave of heat that walks through it at 4 cm an hour, and the question its inventors ask: can a house heat itself? ».

## Conventions

- **Marks.** No mark: reported by a source (named in words: « l'article », « les inventeurs »). **†**: computed, from reported figures (research: derived) or by the model. **\***: estimated, the sources are silent, a choice of this lab. « À l'œil » (words): read off a published curve. `lf` refuses an unknown placeholder at import; `figures.ts` decides the mark in one place (`markOf`). The legend is said once, in the overview of the first world, and on each sheet that carries dimensions.
- **Said once.** « Educational reconstruction », the safety line, the hazards together, the law: the Sources panel (`safety`, `hazards`, `disclaimer`, `LAW`). « Not a plan to follow »: the first step of each guide. Each warning where the gesture is risky, in the step's `warning`: the weight (assembly `storage-wall`), the glass at height (`glazing`), the mains (`heating`), the vents shut in summer (installation `summer-position`), fresh air and carbon monoxide (`fresh-air`). **That the earth tube is a what-if**: the overview of `house` and the pipe's sheet. **That the plateau is composed and that the sun's arcs, the heliostats and the snow follow the model**: the overview of `site`. **Hygiene and radon of an earth tube**: lesson 7. A test counts each.
- **No « this is a model » on a sheet**: the simulation panel says it once (`MODEL_NOTE`).
- **Tools.** A tip names only a tool its world has: no Section on the plateau, the wall and the room, no Explode or Slow-mo on the plateau; isolating hides what is around, so no tip asks to look at it.
- **Names.** Félix Trombe, Jacques Michel (the architect, by Mérimée), D. Kelbaugh, B. Anderson, J. D. Balcomb appear as the sources give them. An American architect stands for Kelbaugh on the sheets; the 1974 building's owners are never named.
- **Nothing says where the houses stand beyond « Odeillo »** (a test over the content and these documents; the street of the monument, the coordinates and the identifiers never appear). The open data's outline is credited « sans la situer ». The `docplayer` link to the 2011 protection dossier is **not** reproduced, because its address holds the street.
- **English** follows British spelling: draught, metre, grey, insulation; « the », « a house of 1967 ».
- **Numbers.** A reported figure is typed in both spellings and held by `src/data/reported.ts` (each group says which table of the research it is). Any other goes through `figures.ts`. A test compares the numbers of each text in French and in English one by one (an English 10-at-night is the French 22 h).

## The estimates, as the sheets mark them

The frame's section (22 mm), its glazing bars and four panes to a column; the 25 mm between the sheets; the 0.10 m of the lower duct above the floor; the air probes' heights (15, 50 and 85 % of the span) and the thermocouples' depths (14, 50, 150, 300, 450, 585 mm); the plan of the rooms, the partitions (0.10 m), the doors, the living room's four bays; the roof's build-up (rafters 0.14 m, covering 0.03 m, insulation 0.10 m laid over the ceiling), the overhang, the ridge height, the pitch (rough); the chimney's section and place; the foundation's footing (0.5 m), its five steps and the ground's fall; the floor slab (0.20 m), its tile, the ceiling (0.06 m); the window, the recess's door and transom, the balcony and its stair, the head band; the north window; the heater, the panel and the recorder (type and size); the fresh-air vent (nothing is drawn behind it); the flap's mechanism; the furnace's mirror outline and the 1974 building's plan (only the footprints and heights are open data); the twin's offset; the species of the trees; the road; the granite; and, for the model, 16.7 m² of windows, 500 W of people, a paint absorptance of 0.93, loop losses K = 4, a room mass of 20 MJ/K, a wind of 2 m/s, the earth tube's 50 m, Ø 200 mm, 2 m, 150 m³/h and 1.5 % of fall.

## Gaps and open questions (nothing is filled)

1. **The ground's fall** — _settled at integration:_ 2.0 m, the low end of the open data's 2 to 3.5 m; `dims.ts` now agrees with `docs/3d.md`, the sheets print 2.0 m\*, and the balcony stands « plus de 2 m » above the ground at its edge (`docs/3d-requests.md`).
2. **The pyranometer's plane.** The research names a Kipp pyranometer « at the laboratory » and does not say how it was oriented, so the sheet says only what the paper counts. To read on the page.
3. **Whether S1's « 1967 prototypes » are one design twice** (S5, searched only): the twin's sheet says the paper speaks of prototypes and nothing more. Open question 3 of the research (the IGN outline) is stated on that sheet and in the Sources, flagged, without a place.
4. **What the paper's letters T_s and V mean** (figure 1): the head and sill sheets say they are read as a head and a foot, our reading.
5. **How fresh air came in; the chimney's use; the heater's type**: unknown; the sheets say so, the vent draws nothing behind it.
6. **How the houses changed position, and when**: the paper does not say; the model's June is run in the summer position by choice.
7. **The monument's plan** and the **protection dossier** (S5): unread, the host does not answer; the Sources say so. Research question 6 (writing to PROMES-CNRS and the DRAC) is the owner's.
8. **The video question (research §8, question 4).** The roadmap's film that sells a document and says 1956 and 20 cm **is not credited**, as the research recommends; Penn Ar Web's film (CC BY) is credited as a companion, **not heard**, no fact taken from it. If the owner keeps the first, a line goes to `sources.ts` and to nothing else.
9. **The title (question 9)** is the research's proposal, awaiting the owner; applied as a **reversible default** at integration in `public/lab.json` (title; tagline = the fuller showcase line above, as the sister labs do), `index.html`, `package.json`, the README and the strings `labTitle` and `tagline`. The visitor-facing tagline under the title in the app stays the short question.
10. **The architect's earth-tube figures** (10 and 17 °C) are left out: the transcript is Whisper's, numbers to check by ear. The lesson gives his opinion, his reservations and « his figures are illustrations ».

## What rests on a source read only in summary

Used in the lab's own words, never quoted; to re-read before a visitor sees them (research §9). `f` fetch summary, `s` search summary.

| Fact                                                                                   | Source              | Where                                                                |
| -------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------- |
| 25 May 2011 inscription, three units, stepped foundations in rock, Michel as architect | S4 (f)              | `solar-houses-1974`, `foundation`, `granite-slope`, `LAW`, `sources` |
| winter and summer modes, priority 29 June 1971                                         | S8 (f, OCR)         | `summer-flap`                                                        |
| Morse's black plate, glass, two openings, no store; a zoologist                        | S9, S10 (f)         | `black-paint`, lesson 1                                              |
| 63 heliostats, 2,835 m², mirror 1,830 m², focal 18 m; 1969 against 1970                | S11 (t), S12 (s, f) | `solar-furnace`, `heliostat-terraces`                                |
| a model of 1978, « of the order of 40 % »                                              | S19 (s)             | `electric-heater`, lesson 5                                          |
| Darmstadt: 445 mm of wool, under 10 kWh/m²a, 7.4 W/m², about 80 % recovery, about 170  | S13, S14 (f)        | `roof-insulation`, lesson 5, lesson 7                                |
| a house at Sète altered to open its high windows                                       | S21 (f)             | `inner-glazing`                                                      |
| radon zone 3                                                                           | S24 (s)             | lesson 7, `LAW`                                                      |
| an architect's reservations on the earth tube                                          | V3 (w)              | lesson 7                                                             |
