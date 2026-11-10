import * as THREE from 'three';
import { joined, softBox } from '../common';
import { X_EAST_IN, X_WEST_IN, Z_NORTH_IN, LIVING_X0, LIVING_X1 } from '../dims';
import { bx } from '../house/geo';
import type { Mats } from '../materials';
import { plain } from '../materials';
import { knitMap, tiled } from '../textures';
import { buildChair, buildTable } from './furniture';

// The rest of the house, furnished enough that it reads as lived in: two bedrooms on the south, with the sun on their beds, and a kitchen at the north-west. Scenery for the `house` world's section and its X-ray: none of it
// is a part. The plan is an estimate (research §2.11: the plan of the rooms is not known).

const part = (g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};

function bed(mats: Mats, w: number, color: number, blanket: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'bed';
  const L = 2.0;
  g.add(
    part(
      joined([
        bx(-w / 2, 0.18, -L / 2, w / 2, 0.3, L / 2),
        bx(-w / 2, 0.18, -L / 2 - 0.05, w / 2, 0.95, -L / 2),
        bx(-w / 2, 0.18, L / 2, w / 2, 0.52, L / 2 + 0.04),
        bx(-w / 2, 0, -L / 2, -w / 2 + 0.05, 0.18, -L / 2 + 0.05),
        bx(w / 2 - 0.05, 0, -L / 2, w / 2, 0.18, -L / 2 + 0.05),
        bx(-w / 2, 0, L / 2 - 0.05, -w / 2 + 0.05, 0.18, L / 2),
        bx(w / 2 - 0.05, 0, L / 2 - 0.05, w / 2, 0.18, L / 2),
      ]),
      mats.timber,
    ),
  );
  g.add(part(softBox(0, 0.38, 0, w - 0.06, 0.2, L - 0.1, 0.05, 2), plain(0xe9e3d0, 1)));
  g.add(
    part(
      softBox(0, 0.52, 0.28, w - 0.04, 0.07, L * 0.62, 0.035, 2),
      new THREE.MeshStandardMaterial({ color: blanket, roughness: 1, map: tiled(knitMap(), 1 / 0.3) }),
    ),
  );
  const pillows = w > 1.0 ? [-w / 4, w / 4] : [0];
  for (const px of pillows)
    g.add(part(softBox(px, 0.5, -L / 2 + 0.28, Math.min(0.55, w * 0.42), 0.12, 0.34, 0.05, 2), plain(color, 1)));
  return g;
}

function wardrobe(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'wardrobe';
  g.add(part(bx(-0.5, 0, -0.28, 0.5, 2.0, 0.28), mats.timberDark));
  g.add(part(joined([bx(-0.48, 0.05, 0.28, -0.01, 1.95, 0.3), bx(0.01, 0.05, 0.28, 0.48, 1.95, 0.3)]), mats.timber));
  g.add(
    part(joined([bx(-0.06, 0.95, 0.3, -0.04, 1.1, 0.33), bx(0.04, 0.95, 0.3, 0.06, 1.1, 0.33)]), mats.brass, false),
  );
  return g;
}

export function buildOtherRooms(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'other-rooms';
  const put = (o: THREE.Object3D, x: number, z: number, ry = 0): void => {
    o.position.set(x, 0, z);
    o.rotation.y = ry;
    g.add(o);
  };
  // west block, south of the dividing wall: a double bed with its head to the west gable, a wardrobe, a bedside table
  put(bed(mats, 1.45, 0xdcd2bf, 0x8a4a3a), X_WEST_IN + 1.15, 1.55, Math.PI / 2);
  put(wardrobe(mats), X_WEST_IN + 0.32, 0.3, Math.PI / 2);
  put(buildChair(mats), LIVING_X0 - 0.7, 1.6, -Math.PI / 2 - 0.4);
  // east block, south: two beds side by side along the wall
  put(bed(mats, 0.9, 0xc9d3dc, 0x4a6a7a), X_EAST_IN - 1.0, 1.3, -Math.PI / 2);
  put(bed(mats, 0.9, 0xd8cfb5, 0x7a6a3a), X_EAST_IN - 1.0, 0.25, -Math.PI / 2);
  put(wardrobe(mats), LIVING_X1 + 0.32, 2.0, -Math.PI / 2);
  // kitchen, north-west: a counter with a sink along the north wall, a table with a chair
  const counter = new THREE.Group();
  counter.add(part(bx(0, 0, 0, 2.2, 0.9, 0.6), mats.whitePaint));
  counter.add(part(bx(0, 0.9, 0, 2.2, 0.94, 0.62), mats.oak));
  counter.add(part(bx(1.4, 0.9, 0.1, 1.9, 0.935, 0.5), mats.steel, false));
  counter.add(
    part(joined([bx(1.6, 0.94, 0.4, 1.64, 1.2, 0.44), bx(1.6, 1.16, 0.3, 1.64, 1.2, 0.44)]), mats.steel, false),
  );
  put(counter, X_WEST_IN + 1.0, Z_NORTH_IN, 0);
  const t = buildTable(mats);
  t.scale.set(0.8, 1, 0.9);
  put(t, X_WEST_IN + 3.0, -1.5, 0);
  put(buildChair(mats), X_WEST_IN + 3.0, -2.0, 0);
  void LIVING_X0;
  return g;
}
