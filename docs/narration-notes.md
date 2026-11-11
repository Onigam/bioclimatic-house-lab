# Notes of the spoken guide's writer, for the lead

What was found while writing `narration/fr.json` and `narration/en.json` that is not the narrator's to fix (`src/three`, `src/sim`, the sheets and the lessons are untouched). The guide itself is described in `narration/README.md`.

## Text defects in the sheets

1. **`air-gap`, « Conception »** (`src/data/parts/wall.ts`): « le modèle prend 4\*, au milieu de de 3 à 5\* » and « in the middle of from 3 to 5\* ». `lossKRange` already carries « de » and « from », so the sentence has it twice. Say « au milieu de la fourchette, 3 à 5\* », or drop the word from the sentence.
2. **`west-gable`, « Description »** (`src/data/parts/house.ts`): « la fondation descend en 5 gradins\* gradins sous lui » and « steps\* steps beneath it »: `gableSteps` carries its unit, the sentence adds the noun again.
3. **The tips « Activez la Coupe »** (`south-facade`, `floor-slab`): the house opens cut (« Ce monde s'ouvre coupé », the first frame turns the section on), so on a first visit the tool is already on and « Activez » reads as an order to switch it off. The tips of `entrance-balcony` and `west-gable` already say « Gardez la Coupe active »; the same wording would do here. `east-gable` says « Activez la Coupe : ce pignon part avec la moitié est » and the gable is in fact visible only without the cut: « Coupez, puis remettez l'ensemble » is nearer the truth, or « Désactivez la Coupe pour le voir ».

## Place names beyond « Odeillo », in the lab's own texts

`docs/data.md` says « nothing says where the houses stand beyond Odeillo », and `src/guard.test.ts` only looks for coordinates, a street, an identifier. Three places in the content still go further, which the guard cannot see:

- `src/data/lessons.ts`, lesson 7, the paragraph on radon (French and English): it names the commune in full, and the national radon map.
- `src/data/sources.ts`: the entry for a town hall's heritage page (title and link) and the entry for the radon zones' fact sheet, whose title names the département.
- `docs/research.md` §0 and §4: the commune, the département and the plateau's regional name.

If the rule is « Odeillo and nothing else », these need a decision (generalise the lesson's sentence; keep the sources by their titles as the credits require). The spoken guide repeats none of them: `src/narration.test.ts` refuses a list of regions, ranges, communes and countries in the voice and the titles, and `src/guard.test.ts` reads `narration/*.json`.

## What the lab does not have

- **No `SPOKEN` flag.** The brief says to flip it when `public/audio/<lang>/manifest.json` exists; `src/lab.ts` of this lab wires `manifest: 'audio/{lang}/manifest.json'` directly (a missing file answers 404 and nothing of the feature shows). There is nothing to flip.
- **No `scripts/check-narration.mjs` and no narration step in `npm run build`.** Added, from the sister labs' (`node scripts/check-narration.mjs && tsc --noEmit && vite build`).
- **No `src/narration.test.ts`.** Added: ids, cues, tools of each world, camera spacing, the lab's `[[lab:…]]` cues against `planCue`, the simulation left as found, the figures against `src/data/figures.ts`, anonymity, the place guard, the budget, and, once the audio exists, the manifests.
