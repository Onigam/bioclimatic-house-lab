# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **61 segments each** (`intro`, 4 worlds, 56 parts: plateau 11, house 18, wall 14, room 13), ids `intro`, `scene-<world>`, `part-<id>`, no lesson segments. The guide is in the **local voice** (`--engine voicebox`, profiles `Onigam narrateur FR` and `EN`, 0 credit, the Voicebox application open): ElevenLabs is not used for this lab. Nobody has listened to it yet; the checks below are what was measured.

Check the length without generating anything (`HOME=<empty dir>` keeps the tool from even opening a key file):

```
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/en.json --out public/audio/en --dry-run --engine voicebox
```

## Budget (spoken characters, cues removed)

| Language | Total  | Words | Intro | Worlds                                          | Parts  | Longest parts                                                                                           |
| -------- | ------ | ----- | ----- | ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| French   | 23,909 | 4,355 | 1,904 | 2,234 (site 582, house 625, wall 503, room 524) | 19,771 | `storage-wall` 526, `summer-flap` 473, `south-facade` 454, `electric-heater` 444, `inner-wall-face` 437 |
| English  | 22,914 | 4,219 | 1,829 | 2,209 (site 567, house 630, wall 498, room 514) | 18,876 | `storage-wall` 494, `summer-flap` 459, `south-facade` 452, `inner-wall-face` 444, `north-wall` 426      |

The ceiling is 30,000 per language; the series aims at 17,000 to 24,000 (`src/narration.test.ts` holds 20,000 to 24,000, and no segment over 2,500, the generator's cap). The median part is 346 characters in French, 326 in English; the heroes of the lab (the slow wave, the night flow, Christmas Eve, the first part of the facade, the heater, the jet) take more. Measured on the audio: **23.3 minutes in French, 22.4 in English**.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`): a warm storyteller who says « vous », « on », « nous », short sentences, one image or one wonder per part, a closing detail from the sheet. The thread is **one small ray of sunshine**, « un petit rayon de soleil »: it crosses two sheets of glass, becomes heat on black paint, chooses the slow road through the concrete (a walk of about four centimetres an hour, fifteen hours through sixty centimetres) and comes out on the room side at midnight. It is in the introduction and in the parts that meet it (`outer-glazing`, `black-paint`, `storage-wall`, `roof-insulation`). The introduction opens on a December night at Odeillo with a wall that is still warm, and closes on « le mur est encore tiède » : a call back, not an order.

Tone statistics (`node ~/Dev/lab-kit/tools/narration/tone-stats.mjs`), against Pelton Lab's:

| Script           | Chars  | Avg sentence | Over 120 chars | Exclamations / 1,000 | Questions / 1,000 | « tu » | Digits |
| ---------------- | ------ | ------------ | -------------- | -------------------- | ----------------- | ------ | ------ |
| `fr.json`        | 23,909 | 68           | 13             | 0.67                 | 0.38              | 0      | 0      |
| Pelton `fr.json` | 23,758 | 79           | 35             | 0.80                 | 0.29              | 0      | 0      |
| `en.json`        | 22,914 | 65           | 6              | 0.70                 | 0.39              | 0      | 0      |
| Pelton `en.json` | 22,836 | 69           | 2              | 0.83                 | 0.35              | 0      | 0      |

The sentences are shorter than Pelton's French (the parts say more figures, so they are cut more often); the exclamations are a little rarer and the questions a little more frequent, both inside the ranges the test holds (0.5 to 1 and 0.25 to 0.6). Every gap is in the direction of fewer long sentences for the subtitles.

## The truths, each said once (`src/narration.test.ts` counts them)

| Truth                                                                                                                                                                                 | Where                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Educational reconstruction; it explains and gives no plan to follow                                                                                                                   | `intro`                                                             |
| The figures come from our simulation unless a source is quoted: calculations, not measurements                                                                                        | `intro`                                                             |
| Where the model does not match the inventors' measurements it says so, and was not tuned to get there                                                                                 | `intro`                                                             |
| The Sources panel says who said what; the honest answer to the lab's question, « une bonne part, selon qui compte, et quoi »                                                          | `intro`                                                             |
| The plateau is composed, not mapped; the sun's two arcs, the mirrors and the snow follow our model's sun                                                                              | `scene-site`                                                        |
| The earth tube never existed in this house: a what-if, drawn only in its scenario; the house drawn is always the 1967 one                                                             | `scene-house`                                                       |
| The 1974 building has no plan in any source (composed as a glazed box); the furnace is composed from a published template                                                             | `part-solar-houses-1974`, `part-solar-furnace`                      |
| The flow: the recordings say about twenty litres a second, the model nearly twice that, and it was not tuned                                                                          | `part-air-gap`                                                      |
| The split between air and concrete: thirty to thirty-five per cent for the inventors, fifty-one for the model (forty-three with their flow)                                           | `part-warm-air-jet`                                                 |
| Christmas Eve: four hundred and seventy-eight per cent is no efficiency (the sun of the day before); the model finds three hundred and sixty-seven, the phenomenon and not the figure | `part-inner-wall-face`                                              |
| What « G·V » counts: read as the whole house, forty-seven per cent; read as the rest of the house, twenty-four                                                                        | `part-north-wall`                                                   |
| The model's winter months are eight to twelve points too low; it does not copy the paper                                                                                              | `part-south-facade`                                                 |
| The water in the concrete is not simulated (the 1974 wall gave back eight to ten points less)                                                                                         | `part-storage-wall`                                                 |
| The night flow: found by the model (twelve litres a second, five hours), absent from the 1967 curves; the model keeps its result                                                      | `part-summer-flap`                                                  |
| No earth tube measured on a house has reached us; the figures are the calculation's; about one point of share                                                                         | `part-earth-tube-pipe`                                              |
| Radon and the condensation of a buried pipe, in one line each, as lesson 7 says them (no reference added)                                                                             | `part-earth-tube-drain`                                             |
| The windows' area (sixteen and a half square metres) and the people (five hundred watts) are estimates                                                                                | `part-south-window`, `part-armchair` (and one line in `scene-room`) |
| The model only reaches the bottom of the inventors' range if the site's air is five degrees warmer                                                                                    | `part-electric-heater`                                              |

**Why the limits are in the parts and not in the introduction.** The owner's rule is that a disclaimer is said once, where it matters. The introduction says once that the model is not tuned; each disagreement is then said in the one segment where the sheets and the lessons say it (the same places as the Simulation's « Là où le modèle ne retrouve pas la source »), with the lessons' own words and figures, never softened. A visitor who plays only the introduction hears that they exist.

**Hedges.** « dans le modèle » is never said (a test holds it). « notre modèle », « notre calcul », « le modèle » appear in 20 segments of 61 in French and 21 in English (a test caps them at 24), where a figure stands against a source or the model is the subject. Estimates are said as estimates by « environ », by « notre estimation » or « notre dessin » where the sheet stars them, never as reported facts.

**No promise, no new law.** No sentence says « safe » or guarantees anything (a test refuses the words). The only lines of law, radon and electricity are the ones the sheets carry: a protected building is not touched without agreement (`solar-houses-1974`), the electric panel is an electrician's job (`electric-panel`), a measurement before any buried pipe where radon is an issue (`earth-tube-drain`). No reference is added and none of the lessons' « from memory » references is spoken.

## Cues (150 in each language, the same in both)

`home` 10, `frame` 16, `scene` 3, `select` 1, `mode` 6 (introduction only); `flows` 16, `xray` 16, `cutaway` 6, `isolate` 28, all switched off before the end; `lab:` cues 56 (`day` 6, `hour` 3, `speed` 6, `preset` 10, `flap` 6, `earthtube` 6, `sheets` 4, `vents` 2, `thickness` 1, `scenario` 2, `setpoint` 2). The cue spacing, worlds, tools and simulation state are held by `src/narration.test.ts`:

- At most one camera move (`scene`, `home`, `frame`, `select`) per 35 spoken characters; a part segment has none (it starts framed and selected); only parts of the current world are framed; **never an earth-tube part** (they are drawn only under the what-if).
- The section only in the house (`cutaway` is used by `floor-slab`, `east-gable`, `west-gable`: a segment that uses it starts without the cut, so the east gable is there to be seen, then the section takes it away); X-ray in the house, the wall and the room, never on the plateau; no explode (the lab's worlds come apart in the sheets' tips, not in the voice).
- **The earth tube's three parts** start with `[[lab:earthtube:on]]` and end with `[[lab:earthtube:off]]`, because the parts collapse to a point inside the house while the what-if is off.
- **The simulation is left as it was found.** Every segment that touches it ends with `[[lab:preset:prototype-1967]]` (a hand-restored toggle: `flap:winter`, `vents:open`, `setpoint:20`, `sheets:2`, `earthtube:off`, `speed:3600`). The clock opens at ×3600; a day a second (`speed:86400`) is used only to show the wave in the wall (`scene-wall`, `storage-wall`, `chart-recorder`), and a scenario is never run at that speed: its timed events run on the real-seconds clock (24 s between two events), so at ×86400 they would pass in a blink.
- **Timing against the model, measured headless** (`HouseSim`, the lab's own engine): in `the-night`, the flow runs 24.5 L/s at 17 h, falls to zero about ten seconds after the start and is reversed (−10 to −12 L/s) from about twelve to fifteen seconds. `summer-flap` places the scenario cue about eight seconds before the sentence that says « regardez les points d'air ». `christmas-1974` starts on 22 December: the 24th is three days of audio away, so `inner-wall-face` does not claim to show it, it only starts the recorded days.
- The introduction goes through the plateau, the wall, the room and the house (it starts on the plateau, ends in the house, where the lab opens), then the six modes in the order of the rail, and clears the selection.

## Anonymous, and « Odeillo » only

No person, channel, company, brand or institution: « l'article », « les inventeurs », « un architecte américain », « un zoologiste », « un modèle de terrain », « un service de données satellite ». A test refuses every name of the Sources panel and of the sheets (the inventors, the architect, the laboratory's parent, the dossier, the instrument's maker, the data services, the cities of the sister houses and of the test rooms). **The houses' position is never said beyond « Odeillo »**: `src/guard.test.ts` now reads `narration/*.json` and this file, and `src/narration.test.ts` adds a list of regions, ranges, communes, countries and a refusal of any capitalised name but the setting's, the buttons' and the months'. The altitude is said once, as « cette altitude », never as a figure.

## What the sheets say and the voice does not

- The sheets' legend of marks (†, \*), the formulas, the specifications tables, the checks and the care paragraphs stay on the sheets; the voice keeps one closing detail from them (the lid, the rug in front of the grille, the dirty dome, the rust under the bars).
- The lessons' tables stay in the lessons: the satellite service's kilowatt-hours per square metre, the inventors' twenty days, the test rooms' kelvins, the Darmstadt house's figures. The voice keeps the one image each time (a zoologist's black plate, the sun of the day before).
- Said in the voice as the sheets say them, but worth a second look by the lead (the sheets read them only in summary, `docs/data.md`): the protection of the 1974 building (« un bâtiment protégé », `solar-houses-1974`), the radon line (`earth-tube-drain`, no commune, no zone), the patent (`black-paint`, « la fin du dix-neuvième siècle », no name, no year).
- Not spoken, by choice: the sheets' guide warnings (weight, glass at height, mains, vents shut in summer, fresh air and carbon monoxide) belong to the assembly and installation guides, in the steps where the gesture is risky; the introduction does not repeat them and no part gives a safety promise.

## Choices the lead may want to change

- The introduction opens on the plateau (not on the house, where the lab opens) for the establishing shot, and ends in the house.
- The `scene:` cues of the introduction hop plateau → wall → room → house: the plateau first so that the visitor sees where the house stands, the wall because it is the heart.
- Titles keep the sheets' names (`Tuyau enterré (et si…)`) and may carry a digit (`La maison de 1967`): a title is shown, never spoken.
- `src/narration.test.ts` reads the private transcripts (no seven-word run of a script may come from them) **only when `NARRATION_TRANSCRIPTS=1`**: this lab's cache also holds what says where the houses stand, so an ordinary `npm test` never opens it. The test prints only the segment and language of a copy, never the words.

## Checks after generation

Nobody has listened to it. What was measured (the scripts that did it are not in the repository: they only read `public/audio` and the scripts):

- **Back-transcription** (Whisper `small`, every clip, normalised words, Python `difflib` ratio against the script; a number in digits is turned back into words): **French mean 0.956, lowest 0.882** (`tree-clumps`: « chênes » heard as « chaînes », which are the same sound, and « pins » as « pains »), **English mean 0.975, lowest 0.875** (`prototype-house`: « storey » and « metres » spelt American, « nineteen sixty-seven » written as a number). **No segment under 0.85** in either language, no run of three words skipped, doubled or invented in any of the 122 clips. Of the 160 and 81 differences, the 89 and 29 that are neither a plural nor a one-letter variant were all read: digits, units (« cm », « kWh »), « pour cent » written as a symbol, homophones and Whisper's own slips. The doubtful ones were heard again with `large-v3-turbo`, which agreed with the script (« un pont possible », « sans fenêtre », « couvercle à ras », « thaw », « curves »).
- **What the check found and the retakes fixed** (a text or a cue changed, the hash cache redid only those segments, locally): French `wall-thermocouples` (« en noie six » came out as « oie scisse »: now « met six perles »), `meadow-clearing` (« sans rien devant » heard as « de vent »: « sans obstacle »), `scene-house` (« c'est un et si » was heard as « essi »: « c'est une hypothèse »); and in both languages `summer-flap` (the night's reverse flow starts about ten seconds after the scenario does, so the sentence that says « regardez les points d'air » now comes last), `scene-site` and `heliostat-terraces` (the sun's demonstration starts at nine, not eight: at eight on a December morning the model shows its reverse-flow alarm, true but distracting).
- **Speaking rate** (characters per second, from the manifests): French median 17.1 (14.8 to 19.6), English 17.2 (15.5 to 19.3). No segment is more than 25 % from the median (the slowest, `room-floor`, is 13 % below). The sister labs' guides are at 17.4 and 17.0.
- **Loudness** (EBU R128, every clip): French mean −27.5 LUFS (−27.6 to −27.4), English −27.5 (−27.5 to −27.4): the series' target is −27, the mass heater's guide measures −27.5, Pelton's −28.3 and −26.9.
- **Subtitles and cues** (from the manifests): captions in order, no gap over a pause and none after the voice ends, 373 captions in French and 366 in English (the longest 130 and 123 characters, two lines at most), every cue inside its segment's duration and in order, no two camera cues less than a second and a half apart.
- **The guide played in headless Chrome** (dev mode, `window.__lab`, 1280 px, the real player on the real audio at 1.5 times, each segment started from the 1967 prototype): **every segment of both languages, 122 in all, played to its end with every cue landed** (the world, the selection and the outline of a framed part, the tools, the mode, the scenario, the flap, the vents, the sheets, the thickness, the set point, the earth tube), nothing left on, the simulation back as it was found, **0 console errors, 0 warnings of the player**. A few stills confirmed what the eye sees: the three earth-tube parts appear when their segment starts, the night's scenario runs under `summer-flap`, the section takes the east gable away.

**What could not be checked by ear, and what the owner should listen for**: the pronunciation of « Odeillo » (Whisper `small` hears « audio », « odeo » or « eau des eaux » in French and « odio » or « odilo » in English; the stronger model hears « Odeyo » in French and « Odilo » or « Odio » in English, so the English voice probably says it as written in English); the warmth and the pace of the voice itself; whether the timing of the simulation's demonstrations feels in step with the words (the cues are placed at the words, the simulation runs on its own clock at an hour a second, so the night's flow, the sun and the snow follow within a few seconds of the sentence); the names of the kit's buttons in French (« Éclaté, Transparence, Coupe et Flux »).
