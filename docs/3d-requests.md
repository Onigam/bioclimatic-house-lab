# Requests to the 3D role (from the data and drawings role)

1. **The ground's fall.** `docs/3d.md` says the ground falls 2.0 m over the 6.6 m of the footprint; `src/three/dims.ts` has `GROUND_NORTH = −0.3` and `GROUND_SOUTH = −2.0`, which is 1.7 m between them. The sheets and the sheet PL-H01 print what `dims.ts` gives (`groundFall`, 1.7 m\*). Please say in `3d.md` which is meant, or move `dims.ts`.
2. **The north window's place** is not in `dims.ts` (only its size and heights, `ROOM.northWindow`): PL-H01 cannot draw it in plan. An `x` for it would do.
3. **The chimney's height.** `CHIMNEY.above` is 0.9 in `dims.ts`, with no word on what it is above. The elevation of PL-H01 reads it as above the roof's surface at the stack's place (`ridgeAt`), and `3d.md` says the stack clears the ridge by 0.6 m (measured on the meshes). Please say in the comment of `CHIMNEY` which is meant, so that the two agree.
