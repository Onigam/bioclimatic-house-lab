# Drawings of the Bioclimatic House lab

Eight A3 sheets (`src/drawings/`), numbers `PL-H01` to `PL-H08`, in three groups (the house and its sun, the wall, the balance). Every length is read from `src/three/dims.ts` (in millimetres, model Y up), every figure of the simulation from `src/data/figures.ts` or from `model-tables.ts`, through `mL`, `numL` and `fig`, which attach the mark. They explain; the title block of each says « Pour comprendre, pas un plan à suivre ».

| Sheet | id                      | World   | What it shows                                                                                                                                                | Scale     |
| ----- | ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| H01   | `general-arrangement`   | `house` | the house in plan at the slab and the south front: twelve bays, nine of collector, the window, the recess and balcony, the partitions, the chimney           | 1:110     |
| H02   | `section-winter-summer` | `house` | the north–south section through the sample bay twice: winter (flap flat, loop into the room, sun at 24°) and summer (flap hanging, air out by the head, 71°) | 1:50      |
| H03   | `sun-and-seasons`       | `house` | the sun on the wall and on a flat roof by month (PVGIS), the noon incidence by month, the efficiency by month, by eye and by the model                       | none      |
| H04   | `collector-element`     | `wall`  | the element's section over 4.38 m with its ducts, flap and instruments, the plan section at the upper duct, and what the paper gives against what we add     | 1:20, 1:8 |
| H05   | `ducts-and-air`         | `wall`  | the circuit with its sections and speeds, the 1967 and 1974 elements side by side, the model's flow against the loop's losses and the recorded 20 L/s        | none      |
| H06   | `heat-wave`             | `wall`  | the closed-form wave at four hours, the lag against the thickness with the inventors' two measurements and wish, what is left on the room side               | none      |
| H07   | `christmas-1974`        | `room`  | Table II, 23–29 December: sun received, heat given back (paper), heat given back (model), the 478.30 %                                                       | none      |
| H08   | `heat-budget`           | `room`  | the season's load by line, the ladder of the share, who says what, what moves the share                                                                      | none      |

## Marks

No mark: given by a source. **†**: computed, from published figures or by the model. **\***: estimated, or a choice of the drawing. The legend is on the sheets that carry both. **Not on a sheet**: « educational reconstruction » and « this is a model » (the Sources and the simulation's note say them once).

## Model results the sheets print, and how they are held

`model-tables.ts` pins the efficiency of the months (by eye and by the model), the model's sums for 23–29 December, the ladder and its lines, the sensitivity rows, and the flow against K. **A sheet never runs a season when it is opened**; `drawings.test.ts` reads each table back from `docs/physics.md` (§4.2, §4.3, §4.5, §5), so a change of the model that moves physics.md fails here. `PL-H06` computes its curves from `src/sim/wave.ts` at render (cheap); `PL-H03` the noon incidence from `src/sim/solar.ts`.

## What is left out

The earth tube's sheet (research's 11th), the 1967-and-1974 sheet and the assembly-sequence sheet of the research's plan: the standard asks for 8, the last two need a long exploded view that the 3D's own « Éclaté » and the guide already give. `PL-H05` carries the two elements' table. No image of the paper is reused: its figures are redrawn from our dimensions.

## Tests

`src/drawings/drawings.test.ts`: the contract (numbers, groups, parts of the right world, order), a render in both languages with no NaN and no text off the sheet, on another text or in the title block, the cartouche's words, the dimensions read from `dims.ts` (star or none), the model tables against `docs/physics.md`, no promise of safety.
