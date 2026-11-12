# Fifth pass: the replay of the clips redone since `d8bdfb6`, one line each

Commit `cf49238` (the last block: `edbcd9b`), on a copy of the committed tree, headless Chrome for Testing 154 (software GL), 1280 × 800, the kit player through `window.__lab.narration`, state sampled every 150 ms, **all at 1×**. 17 French and 21 English clips (`git diff --name-only d8bdfb6..cf49238 -- public/audio`). Columns as in `fourth-replay-table.md`: **Captions seen** is the share of the manifest's caption pieces that the sampler caught (the manifests' captions are identical to the committed scripts in all 122 entries); **Cues seen** the cues seen applied or already in place; **lag** the largest delay between a cue's time and the first sample showing it; **End** the starting-point select of the simulation panel read after the clip, and the simulation against its default. Every row: played to its end, voice label visible mid-play, nothing left on, mode back to Explore, and no console entry but the copy's font 403s.

## Français

| Segment           | Audio (s) | Captions seen | Cues seen | Largest lag (s) | End: label and simulation  |
| ----------------- | --------- | ------------- | --------- | --------------- | -------------------------- |
| intro             | 108.3     | 28/32         | 16 of 16  | 7.75            | Prototype de 1967, default |
| scene-house       | 41.8      | 12/12         | 9 of 9    | 1.38            | Prototype de 1967, default |
| tree-clumps       | 19.4      | 6/6           | 3 of 3    | 0.09            | Prototype de 1967, default |
| solar-furnace     | 15.4      | 6/6           | 0 of 0    | -               | Prototype de 1967, default |
| pyranometer       | 18.9      | 4/4           | 2 of 2    | 0.03            | Prototype de 1967, default |
| south-facade      | 24.7      | 6/6           | 0 of 0    | -               | Prototype de 1967, default |
| south-window      | 25.0      | 6/6           | 0 of 0    | -               | Prototype de 1967, default |
| north-wall        | 24.5      | 7/7           | 0 of 0    | -               | Prototype de 1967, default |
| roof-insulation   | 22.5      | 7/7           | 2 of 2    | 0.07            | Prototype de 1967, default |
| earth-tube-intake | 12.6      | 3/3           | 2 of 2    | 0.12            | Prototype de 1967, default |
| earth-tube-pipe   | 27.3      | 7/7           | 2 of 2    | 0.23            | Prototype de 1967, default |
| earth-tube-drain  | 18.5      | 5/5           | 2 of 2    | 0.07            | Prototype de 1967, default |
| black-paint       | 21.0      | 4/4           | 2 of 2    | 0.07            | Prototype de 1967, default |
| upper-duct        | 19.0      | 5/5           | 2 of 2    | 0.11            | Prototype de 1967, default |
| warm-air-jet      | 18.6      | 6/6           | 2 of 2    | 0.06            | Prototype de 1967, default |
| floor-return      | 21.2      | 6/6           | 2 of 2    | 0.10            | Prototype de 1967, default |
| chart-recorder    | 18.9      | 6/6           | 2 of 2    | 0.19            | Prototype de 1967, default |

## English

| Segment           | Audio (s) | Captions seen | Cues seen | Largest lag (s) | End: label and simulation   |
| ----------------- | --------- | ------------- | --------- | --------------- | --------------------------- |
| intro             | 105.6     | 28/31         | 16 of 16  | 7.37            | The 1967 prototype, default |
| scene-wall        | 27.7      | 9/9           | 7 of 7    | 0.34            | The 1967 prototype, default |
| scene-room        | 31.3      | 9/9           | 7 of 7    | 1.17            | The 1967 prototype, default |
| tree-clumps       | 17.7      | 6/6           | 3 of 3    | 0.14            | The 1967 prototype, default |
| solar-furnace     | 14.7      | 6/6           | 0 of 0    | -               | The 1967 prototype, default |
| pyranometer       | 18.1      | 5/5           | 2 of 2    | 0.12            | The 1967 prototype, default |
| south-facade      | 23.9      | 6/6           | 0 of 0    | -               | The 1967 prototype, default |
| entrance-balcony  | 18.9      | 4/4           | 0 of 0    | -               | The 1967 prototype, default |
| south-window      | 23.5      | 6/6           | 0 of 0    | -               | The 1967 prototype, default |
| north-wall        | 21.2      | 7/7           | 0 of 0    | -               | The 1967 prototype, default |
| roof-insulation   | 21.8      | 6/6           | 2 of 2    | 0.15            | The 1967 prototype, default |
| earth-tube-pipe   | 26.5      | 7/7           | 2 of 2    | 0.04            | The 1967 prototype, default |
| earth-tube-drain  | 18.9      | 5/5           | 2 of 2    | 0.22            | The 1967 prototype, default |
| air-gap           | 22.2      | 7/7           | 2 of 2    | 0.21            | The 1967 prototype, default |
| black-paint       | 17.6      | 4/4           | 2 of 2    | 0.02            | The 1967 prototype, default |
| summer-flap       | 26.5      | 8/8           | 4 of 6    | 0.15            | The 1967 prototype, default |
| air-thermocouples | 21.2      | 5/5           | 2 of 2    | 0.24            | The 1967 prototype, default |
| warm-air-jet      | 17.4      | 6/6           | 2 of 2    | 0.01            | The 1967 prototype, default |
| floor-return      | 21.4      | 6/6           | 2 of 2    | 0.07            | The 1967 prototype, default |
| room-air-probe    | 17.1      | 6/6           | 2 of 2    | 0.05            | The 1967 prototype, default |
| chart-recorder    | 17.8      | 6/6           | 2 of 2    | 0.17            | The 1967 prototype, default |

## Replayed again at `edbcd9b` (the two lines of the fifth fact-check)

| Segment            | Audio (s) | Captions seen | Cues seen | Largest lag (s) | End: label and simulation   |
| ------------------ | --------- | ------------- | --------- | --------------- | --------------------------- |
| FR solar-furnace   | 16.4      | 5/6           | 0 of 0    | -               | Prototype de 1967, default  |
| FR earth-tube-pipe | 26.9      | 7/7           | 2 of 2    | 0.05            | Prototype de 1967, default  |
| EN solar-furnace   | 16.6      | 5/6           | 0 of 0    | -               | The 1967 prototype, default |
| EN earth-tube-pipe | 29.1      | 7/7           | 2 of 2    | 0.25            | The 1967 prototype, default |

`solar-furnace` is the first clip played after a fresh load: the sampler's first sample came at 2.1 to 2.4 s and missed the first caption (« Le grand frère de la maison. », « The house's big brother. »); the manifest's captions are the committed script. The label of `earth-tube-pipe` is back 0.05 s (FR) and 0.25 s (EN) after its off cue, with 1.7 s and 2.3 s of audio left.

**Reading the exceptions.** `intro` (both languages): captions 28 of 32 (FR) and 28 of 31 (EN) and the largest lags (7.75 s FR, 7.37 s EN): the first build of the wall, the room and the house freezes the page under the software renderer; with the worlds built first the same clip shows 32 of 32 and 31 of 31 captions and `scene` cues within 0.27 s (`qa.md`, « Fifth pass »). `summer-flap` (EN): its last two cues (`flows:off`, `preset:prototype-1967`) sit on the last word, after the sampler stops; the end state read 0.5 s later is the default.
