# Scenery: what stands in the worlds besides the machine

Every prop is built from nothing (boxes, lathes, extrusions, noise-pushed spheres, procedural maps, no file, no canvas, no text), and each one is listed here with what it is for and what drives it. **None of it is a part**, except where a part's own id is named. Nothing says where the houses stand beyond « Odeillo »: the plateau is composed, not mapped (`worlds.test.ts` holds that no coordinate, street or identifier is in any file of `src/three` or in these notes).

## The land (`site` and `house`)

One ground function, `src/three/land/ground.ts`, for both worlds: a granite slope that falls to the south, 2 m across the house's 6.6 m (`dims.ts`: `GROUND_NORTH`, `GROUND_SOUTH`, an estimate within the open data's 2–3.5 m), flat across the yard, rolling away from it, rising to the north. The house stands on it the same way in both worlds: the stepped foundation follows the fall within 5 cm (`machine.test.ts`).

| Piece | What it is | Driven by |
| --- | --- | --- |
| Ground (`granite-slope`) | A graded grid out to the far hills, vertex colours (meadow in patches, bare earth and gravel round the house, rock where steep), the kit's grass detail on top | The state's day: the snow (`land/season.ts`) lies when the model's monthly air at the site is under about 3 °C (January 1, December 0.7, March 0.3, none from April to October) |
| Boulders | 150 granite blocks, noise-pushed, sunk a hand's breadth into the slope, merged into one mesh | Nothing |
| Clearing (`meadow-clearing`) | A mown overlay, lighter and greener, faded at its edge | The snow |
| Road (`access-road`) | A gravel ribbon along a centre line with a bend, laid on the land | Nothing |
| Trees (`tree-clumps`) | Scots or mountain pine (bole, bare limbs, flat layered clumps of needles), downy oak (short bole, broad crown, leaves that stay brown through the winter), juniper and broom. Species are an estimate (« pine and oak, to look at »). Instanced: a stand is two draw calls | Oak: the day of the year (brown to green from late April, russet then brown from October) |
| Far ridges (`far-ridge`) | Two rings of hills at 3.8 and 6.2 km, their height from the model's own horizon (`SITES.odeillo.horizon`: 2.7° south, 5.7° south-east, 1.1° south-west) | The horizon table of the simulation |
| Sky | Preetham dome, stars and a moon at night, a thin haze so the ridges stay a pale blue | The state's sun (altitude and azimuth) |
| The sun's two arcs | Tubes along the sun's path at the December and the June solstice, a bead each hour, the sun itself on its arc | `sim/solar.ts` for the arcs, the state for the sun |

## The setting's buildings (`site`)

| Piece | Built from | Note |
| --- | --- | --- |
| Solar furnace (`solar-furnace`) | The reported 48 m high, 54 m wide; the mirror a paraboloid of 18 m focal length concave to the south, 46 × 34 m of 2 m facets (the mirror's reported area of 1,830 m² is not drawn exactly: its outline is an estimate), the focus building 18 m in front of it, two annexes | |
| Heliostats (`heliostat-terraces`) | 63 plane mirrors of 45 m² each (6 × 7.5 m, derived from the reported 2,835 m²) on eight terraces | They turn with the model's sun: the normal is the bisector of the directions to the sun and to the mirror, the width kept horizontal; parked face down at night. At the December noon they lie nearly flat, as they should |
| The 1974 building (`solar-houses-1974`) | 37 × 14 × 12.9 m in three units, rendered, with a band of Trombe walls on its south front built by **the same function as the collector element, on the 1974 dimensions** | Composed: no plan of it exists in the sources |
| Pyranometer (`pyranometer`) | A tripod, a body, a dome, a shade ring, a cable to a post | The stand is an estimate |
| The twin (`twin-house`) | The prototype's function, moved 38 m along the row | Follows the same sliders |

## The yard of the house (`site` and `house`)

A washing line with eight garments (swayed by the wind of the parameters), a wheelbarrow with a spade in it, a bucket and a mat at the stair's foot, a vegetable bed, planks under a sheet against the west gable, on the balcony a chair and two pots of geraniums. Each stands on the ground at its own place: `machine.test.ts` measures the lowest point of each against the land.

## The rooms (`room` and `house`)

The living room as the family left it, one function (`room/living.ts`) for both worlds: an oak table with a runner, a teapot, two cups, a bowl of apples, papers and a pen; four ladder-back chairs; an armchair with a knitted blanket thrown over its back (the armchair is the one part: `armchair`); a floor lamp; a woven rug; a rubber plant by the window; pleated curtains tied back; a bookshelf of books in eight colours, a few lying flat; two pictures; a coat on a peg; boots on a mat by the door; a toolbox; a drying rack with the week's washing by the warm wall. The lamps and a point light come on at night (from the sun's altitude in the state). The rest of the house, for the section: two bedrooms (a double bed and a wardrobe; two single beds) and a kitchen with a counter, a table and a chair. The plan of the rooms is an estimate.

## What the picture does not follow

The wind (a constant 2 m/s in the model) only sways the washing; no snow on the roof, on the trees or on the heliostats; no cloud shadows on the ground; the sky's clouds are Preetham's, not the model's weather (the key light, however, follows the model's cloud: the share of the clear sky's irradiance the state holds).
