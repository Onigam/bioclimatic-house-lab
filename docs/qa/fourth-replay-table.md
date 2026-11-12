# Fourth pass: the replay of the 61 segments, one line each

Commit `d8bdfb6`, headless Chrome for Testing 154 (software GL), 1280 × 800, the kit player through `window.__lab.narration`, state sampled every 150 ms. **Speed**: 1× for the 33 clips redone by the slop pass (`git diff --name-only a517702..HEAD -- public/audio`, marked **\***), 1.5× for the other 28. **Captions seen**: caption pieces of the manifest that the live sampler caught, of the manifest's (the manifests' captions are identical to the committed scripts in all 122 clips; a dip is a page stall under the software renderer, see the section). **Cues**: how many of the segment's cues (camera, tool, mode, world, simulation) the sampler saw applied or already in place; **lag**: the largest delay between the cue's time and the first sample showing it. **End**: the starting-point select of the simulation panel, read after the clip, and the simulation against its default (every value, the day and the hour apart). Every row: played to its end, « Voix de synthèse » / « Synthetic voice » visible mid-play, 0 console errors, nothing left on, mode back to Explore.

## Français

| Segment                    | Speed | Audio (s) | Captions seen | Cues seen | Largest lag (s) | End: label and simulation  |
| -------------------------- | ----- | --------- | ------------- | --------- | --------------- | -------------------------- |
| intro **\***               | 1×    | 104.5     | 29/32         | 16 of 16  | 4.33            | Prototype de 1967, default |
| scene-site **\***          | 1×    | 32.8      | 9/9           | 9 of 9    | 0.58            | Prototype de 1967, default |
| scene-house **\***         | 1×    | 40.2      | 12/12         | 9 of 9    | 1.16            | Prototype de 1967, default |
| scene-wall **\***          | 1×    | 29.4      | 9/9           | 7 of 7    | 0.33            | Prototype de 1967, default |
| scene-room                 | 1.5×  | 30.6      | 9/9           | 7 of 7    | 0.44            | Prototype de 1967, default |
| prototype-house **\***     | 1×    | 17.7      | 4/4           | 0 of 0    | -               | Prototype de 1967, default |
| twin-house **\***          | 1×    | 14.0      | 4/4           | 2 of 2    | 0.11            | Prototype de 1967, default |
| granite-slope              | 1.5×  | 18.9      | 5/5           | 2 of 2    | 0.24            | Prototype de 1967, default |
| meadow-clearing            | 1.5×  | 17.6      | 4/4           | 3 of 3    | 0.17            | Prototype de 1967, default |
| tree-clumps **\***         | 1×    | 19.4      | 6/6           | 3 of 3    | 0.02            | Prototype de 1967, default |
| access-road **\***         | 1×    | 15.5      | 5/5           | 2 of 2    | 0.20            | Prototype de 1967, default |
| solar-furnace **\***       | 1×    | 17.4      | 6/6           | 0 of 0    | -               | Prototype de 1967, default |
| heliostat-terraces **\***  | 1×    | 17.4      | 5/5           | 3 of 3    | 0.11            | Prototype de 1967, default |
| solar-houses-1974 **\***   | 1×    | 18.3      | 5/5           | 0 of 0    | -               | Prototype de 1967, default |
| pyranometer                | 1.5×  | 19.3      | 4/4           | 2 of 2    | 0.19            | Prototype de 1967, default |
| far-ridge                  | 1.5×  | 17.8      | 5/5           | 4 of 4    | 0.14            | Prototype de 1967, default |
| south-facade **\***        | 1×    | 22.2      | 5/5           | 0 of 0    | -               | Prototype de 1967, default |
| collector-element **\***   | 1×    | 21.6      | 5/5           | 0 of 0    | -               | Prototype de 1967, default |
| entrance-recess **\***     | 1×    | 19.2      | 5/5           | 2 of 2    | 0.13            | Prototype de 1967, default |
| entrance-balcony **\***    | 1×    | 17.6      | 4/4           | 0 of 0    | -               | Prototype de 1967, default |
| south-window **\***        | 1×    | 24.3      | 6/6           | 0 of 0    | -               | Prototype de 1967, default |
| east-gable                 | 1.5×  | 20.8      | 5/5           | 2 of 2    | 0.39            | Prototype de 1967, default |
| west-gable                 | 1.5×  | 19.5      | 6/6           | 2 of 2    | 0.42            | Prototype de 1967, default |
| north-wall                 | 1.5×  | 21.8      | 7/7           | 0 of 0    | -               | Prototype de 1967, default |
| north-window               | 1.5×  | 19.8      | 5/5           | 2 of 2    | 0.12            | Prototype de 1967, default |
| pitched-roof **\***        | 1×    | 16.4      | 4/4           | 2 of 2    | 0.20            | Prototype de 1967, default |
| roof-insulation **\***     | 1×    | 21.7      | 7/7           | 2 of 2    | 0.05            | Prototype de 1967, default |
| floor-slab                 | 1.5×  | 15.6      | 4/4           | 2 of 2    | 0.00            | Prototype de 1967, default |
| foundation **\***          | 1×    | 21.3      | 7/7           | 2 of 2    | 0.05            | Prototype de 1967, default |
| interior-partitions **\*** | 1×    | 14.8      | 4/4           | 0 of 0    | -               | Prototype de 1967, default |
| chimney **\***             | 1×    | 18.2      | 5/5           | 2 of 2    | 0.16            | Prototype de 1967, default |
| earth-tube-intake          | 1.5×  | 12.2      | 3/3           | 2 of 2    | 0.04            | Prototype de 1967, default |
| earth-tube-pipe            | 1.5×  | 22.6      | 7/7           | 2 of 2    | 0.18            | Prototype de 1967, default |
| earth-tube-drain           | 1.5×  | 19.0      | 5/5           | 2 of 2    | 0.21            | Prototype de 1967, default |
| outer-glazing              | 1.5×  | 22.0      | 7/7           | 3 of 4    | 0.18            | Prototype de 1967, default |
| inner-glazing              | 1.5×  | 16.0      | 4/4           | 2 of 2    | 0.06            | Prototype de 1967, default |
| steel-frame **\***         | 1×    | 18.2      | 4/4           | 2 of 2    | 0.46            | Prototype de 1967, default |
| air-gap **\***             | 1×    | 22.7      | 7/7           | 2 of 2    | 0.09            | Prototype de 1967, default |
| black-paint                | 1.5×  | 21.4      | 5/5           | 2 of 2    | 0.07            | Prototype de 1967, default |
| storage-wall **\***        | 1×    | 31.3      | 9/9           | 3 of 3    | 0.08            | Prototype de 1967, default |
| upper-duct **\***          | 1×    | 18.7      | 5/5           | 2 of 2    | 0.26            | Prototype de 1967, default |
| lower-duct **\***          | 1×    | 17.9      | 5/5           | 2 of 2    | 0.21            | Prototype de 1967, default |
| summer-flap **\***         | 1×    | 25.0      | 7/7           | 6 of 6    | 0.06            | Prototype de 1967, default |
| head-beam **\***           | 1×    | 19.6      | 5/5           | 2 of 2    | 0.12            | Prototype de 1967, default |
| sill-beam                  | 1.5×  | 21.0      | 5/5           | 2 of 2    | 0.14            | Prototype de 1967, default |
| wall-thermocouples         | 1.5×  | 20.2      | 5/5           | 2 of 2    | 0.12            | Prototype de 1967, default |
| air-thermocouples          | 1.5×  | 22.7      | 6/6           | 2 of 2    | 0.01            | Prototype de 1967, default |
| hot-wire-anemometer        | 1.5×  | 22.6      | 5/5           | 2 of 2    | 0.06            | Prototype de 1967, default |
| inner-wall-face **\***     | 1×    | 26.8      | 7/7           | 3 of 4    | 0.03            | Prototype de 1967, default |
| warm-air-jet **\***        | 1×    | 21.5      | 6/6           | 2 of 2    | 0.12            | Prototype de 1967, default |
| floor-return               | 1.5×  | 23.3      | 6/6           | 2 of 2    | 0.07            | Prototype de 1967, default |
| thermostat **\***          | 1×    | 16.3      | 3/3           | 2 of 2    | 0.13            | Prototype de 1967, default |
| electric-heater            | 1.5×  | 21.1      | 4/4           | 0 of 0    | -               | Prototype de 1967, default |
| electric-panel             | 1.5×  | 13.2      | 3/3           | 0 of 0    | -               | Prototype de 1967, default |
| room-air-probe             | 1.5×  | 19.0      | 6/6           | 2 of 2    | 0.34            | Prototype de 1967, default |
| room-surface-probes        | 1.5×  | 23.9      | 6/6           | 2 of 2    | 0.32            | Prototype de 1967, default |
| chart-recorder **\***      | 1×    | 20.4      | 7/7           | 2 of 2    | 0.03            | Prototype de 1967, default |
| fresh-air-vent **\***      | 1×    | 24.0      | 7/7           | 2 of 2    | 0.19            | Prototype de 1967, default |
| room-floor                 | 1.5×  | 21.3      | 5/5           | 2 of 2    | 0.12            | Prototype de 1967, default |
| room-ceiling               | 1.5×  | 21.0      | 5/5           | 2 of 2    | 0.31            | Prototype de 1967, default |
| armchair                   | 1.5×  | 18.4      | 5/5           | 0 of 0    | -               | Prototype de 1967, default |

## English

| Segment                    | Speed | Audio (s) | Captions seen | Cues seen | Largest lag (s) | End: label and simulation   |
| -------------------------- | ----- | --------- | ------------- | --------- | --------------- | --------------------------- |
| intro **\***               | 1×    | 96.5      | 27/31         | 16 of 16  | 7.73            | The 1967 prototype, default |
| scene-site **\***          | 1×    | 31.3      | 9/9           | 9 of 9    | 0.74            | The 1967 prototype, default |
| scene-house **\***         | 1×    | 41.3      | 12/12         | 9 of 9    | 1.27            | The 1967 prototype, default |
| scene-wall **\***          | 1×    | 27.0      | 9/9           | 7 of 7    | 0.39            | The 1967 prototype, default |
| scene-room                 | 1.5×  | 30.4      | 9/9           | 7 of 7    | 0.65            | The 1967 prototype, default |
| prototype-house **\***     | 1×    | 18.1      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |
| twin-house **\***          | 1×    | 15.1      | 4/4           | 2 of 2    | 0.11            | The 1967 prototype, default |
| granite-slope              | 1.5×  | 17.4      | 4/4           | 2 of 2    | 0.19            | The 1967 prototype, default |
| meadow-clearing            | 1.5×  | 16.3      | 4/4           | 3 of 3    | 0.15            | The 1967 prototype, default |
| tree-clumps **\***         | 1×    | 18.0      | 6/6           | 3 of 3    | 0.07            | The 1967 prototype, default |
| access-road **\***         | 1×    | 15.3      | 5/5           | 2 of 2    | 0.07            | The 1967 prototype, default |
| solar-furnace **\***       | 1×    | 17.0      | 6/6           | 0 of 0    | -               | The 1967 prototype, default |
| heliostat-terraces **\***  | 1×    | 16.6      | 5/5           | 3 of 3    | 0.06            | The 1967 prototype, default |
| solar-houses-1974 **\***   | 1×    | 17.3      | 5/5           | 0 of 0    | -               | The 1967 prototype, default |
| pyranometer                | 1.5×  | 18.6      | 5/5           | 2 of 2    | 0.15            | The 1967 prototype, default |
| far-ridge                  | 1.5×  | 17.8      | 5/5           | 4 of 4    | 0.17            | The 1967 prototype, default |
| south-facade **\***        | 1×    | 22.2      | 5/5           | 0 of 0    | -               | The 1967 prototype, default |
| collector-element **\***   | 1×    | 22.9      | 5/5           | 0 of 0    | -               | The 1967 prototype, default |
| entrance-recess **\***     | 1×    | 17.7      | 5/5           | 2 of 2    | 0.11            | The 1967 prototype, default |
| entrance-balcony **\***    | 1×    | 19.3      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |
| south-window **\***        | 1×    | 22.0      | 6/6           | 0 of 0    | -               | The 1967 prototype, default |
| east-gable                 | 1.5×  | 20.8      | 5/5           | 2 of 2    | 0.12            | The 1967 prototype, default |
| west-gable                 | 1.5×  | 20.5      | 5/5           | 2 of 2    | 0.36            | The 1967 prototype, default |
| north-wall                 | 1.5×  | 24.1      | 7/7           | 0 of 0    | -               | The 1967 prototype, default |
| north-window               | 1.5×  | 19.2      | 5/5           | 2 of 2    | 0.19            | The 1967 prototype, default |
| pitched-roof **\***        | 1×    | 18.0      | 4/4           | 2 of 2    | 0.09            | The 1967 prototype, default |
| roof-insulation **\***     | 1×    | 20.8      | 6/6           | 2 of 2    | 0.21            | The 1967 prototype, default |
| floor-slab                 | 1.5×  | 14.0      | 4/4           | 2 of 2    | 0.00            | The 1967 prototype, default |
| foundation **\***          | 1×    | 20.2      | 6/6           | 2 of 2    | 0.17            | The 1967 prototype, default |
| interior-partitions **\*** | 1×    | 14.8      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |
| chimney **\***             | 1×    | 16.6      | 5/5           | 2 of 2    | 0.24            | The 1967 prototype, default |
| earth-tube-intake          | 1.5×  | 12.3      | 3/3           | 2 of 2    | 0.35            | The 1967 prototype, default |
| earth-tube-pipe            | 1.5×  | 25.1      | 7/7           | 2 of 2    | 0.03            | The 1967 prototype, default |
| earth-tube-drain           | 1.5×  | 19.0      | 5/5           | 2 of 2    | 0.10            | The 1967 prototype, default |
| outer-glazing              | 1.5×  | 21.4      | 7/7           | 4 of 4    | 0.21            | The 1967 prototype, default |
| inner-glazing              | 1.5×  | 15.4      | 4/4           | 2 of 2    | 0.13            | The 1967 prototype, default |
| steel-frame **\***         | 1×    | 19.4      | 4/4           | 2 of 2    | 0.04            | The 1967 prototype, default |
| air-gap **\***             | 1×    | 19.6      | 7/7           | 2 of 2    | 0.18            | The 1967 prototype, default |
| black-paint                | 1.5×  | 19.8      | 4/4           | 2 of 2    | 0.10            | The 1967 prototype, default |
| storage-wall **\***        | 1×    | 31.1      | 9/9           | 3 of 3    | 0.15            | The 1967 prototype, default |
| upper-duct **\***          | 1×    | 20.0      | 6/6           | 2 of 2    | 0.05            | The 1967 prototype, default |
| lower-duct **\***          | 1×    | 18.6      | 5/5           | 2 of 2    | 0.13            | The 1967 prototype, default |
| summer-flap **\***         | 1×    | 28.9      | 8/8           | 6 of 6    | 0.11            | The 1967 prototype, default |
| head-beam **\***           | 1×    | 19.8      | 5/5           | 2 of 2    | 0.11            | The 1967 prototype, default |
| sill-beam                  | 1.5×  | 20.6      | 5/5           | 2 of 2    | 0.13            | The 1967 prototype, default |
| wall-thermocouples         | 1.5×  | 20.5      | 4/4           | 2 of 2    | 0.18            | The 1967 prototype, default |
| air-thermocouples          | 1.5×  | 21.7      | 5/5           | 2 of 2    | 0.08            | The 1967 prototype, default |
| hot-wire-anemometer        | 1.5×  | 23.7      | 5/5           | 2 of 2    | 0.05            | The 1967 prototype, default |
| inner-wall-face **\***     | 1×    | 25.8      | 7/7           | 4 of 4    | 0.12            | The 1967 prototype, default |
| warm-air-jet **\***        | 1×    | 18.4      | 6/6           | 2 of 2    | 0.03            | The 1967 prototype, default |
| floor-return               | 1.5×  | 20.6      | 6/6           | 2 of 2    | 0.15            | The 1967 prototype, default |
| thermostat **\***          | 1×    | 16.6      | 3/3           | 2 of 2    | 0.13            | The 1967 prototype, default |
| electric-heater            | 1.5×  | 19.7      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |
| electric-panel             | 1.5×  | 13.0      | 3/3           | 0 of 0    | -               | The 1967 prototype, default |
| room-air-probe             | 1.5×  | 18.5      | 6/6           | 2 of 2    | 0.12            | The 1967 prototype, default |
| room-surface-probes        | 1.5×  | 23.2      | 6/6           | 2 of 2    | 0.46            | The 1967 prototype, default |
| chart-recorder **\***      | 1×    | 18.3      | 7/7           | 2 of 2    | 0.12            | The 1967 prototype, default |
| fresh-air-vent **\***      | 1×    | 22.6      | 7/7           | 2 of 2    | 0.07            | The 1967 prototype, default |
| room-floor                 | 1.5×  | 17.9      | 5/5           | 2 of 2    | 0.15            | The 1967 prototype, default |
| room-ceiling               | 1.5×  | 19.7      | 5/5           | 2 of 2    | 0.14            | The 1967 prototype, default |
| armchair                   | 1.5×  | 19.8      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |

**Reading the exceptions.** `intro` (both languages): captions 29 of 32 (FR) and 27 of 31 (EN), and the largest lags (4.3 s FR, 7.7 s EN): the page freezes for a few seconds the first time the wall, the room and the house are built under the software renderer; second runs and the control with the worlds built first are in the section « Fourth pass » of `docs/qa.md`. `outer-glazing` and `inner-wall-face` (FR): their last cue (`sheets:2`, `preset:prototype-1967`) sits at the exact end of the clip, after the last word, so the sampler stops before it; the end state read 0.5 s later is the default (label « Prototype de 1967 »), so the cue ran. In English the sampler happened to catch both.
