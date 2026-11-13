import * as THREE from 'three';
import { boxAt, joined, polyShape, uvMetric, softBox } from './common';
import type { Mats } from './materials';
import { plain } from './materials';

// Small things people leave about: a stool, a mug, a coat on a nail. Built from boxes, lathes and extrusions, merged per material, never a stand-in for a part: scenery that says someone lives here. UVs in metres.

const cyl = (r0: number, r1: number, h: number, seg = 14): THREE.BufferGeometry =>
  uvMetric(new THREE.CylinderGeometry(r0, r1, h, seg));

function mesh(g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
}

/** A three-legged stool of timber: a round seat, legs splayed a little, a ring between them. Its feet are at y = 0. */
export function buildStool(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stool';
  const seatH = 0.46;
  const seat = cyl(0.17, 0.17, 0.035, 20);
  seat.translate(0, seatH - 0.0175, 0);
  const parts: THREE.BufferGeometry[] = [seat];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const top = new THREE.Vector3(Math.cos(a) * 0.1, seatH - 0.035, Math.sin(a) * 0.1);
    const foot = new THREE.Vector3(Math.cos(a) * 0.15, 0, Math.sin(a) * 0.15);
    const len = top.distanceTo(foot);
    const leg = new THREE.CylinderGeometry(0.017, 0.012, len, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(foot).normalize());
    leg.applyQuaternion(q);
    leg.translate((top.x + foot.x) / 2, (top.y + foot.y) / 2, (top.z + foot.z) / 2);
    parts.push(uvMetric(leg));
  }
  const ring = new THREE.TorusGeometry(0.125, 0.007, 6, 18);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, 0.17, 0);
  parts.push(ring);
  g.add(mesh(joined(parts), mats.timber));
  return g;
}

/** A mug with a handle. Its base is at y = 0. */
export function buildMug(color = 0x3d6f8e): THREE.Group {
  const g = new THREE.Group();
  g.name = 'mug';
  const body = cyl(0.04, 0.036, 0.09, 16);
  body.translate(0, 0.045, 0);
  const handle = new THREE.TorusGeometry(0.026, 0.006, 6, 12, Math.PI);
  handle.rotateZ(-Math.PI / 2);
  handle.translate(0.04, 0.045, 0);
  // a glazed stoneware: smooth, so that the window and the sun leave a highlight on it
  g.add(mesh(joined([body, handle]), plain(color, 0.22)));
  const coffee = cyl(0.034, 0.034, 0.002, 16);
  coffee.translate(0, 0.082, 0);
  g.add(mesh(coffee, plain(0x2a1a10, 0.12), false));
  return g;
}

/** A coat on a nail: a wooden peg and the garment's silhouette hanging from it, the sleeves down. The peg's axis is the group's origin, the coat hangs in −y, 0.9 m long. */
export function buildCoat(mats: Mats, color = 0x4b5a49): THREE.Group {
  const g = new THREE.Group();
  g.name = 'coat';
  const peg = cyl(0.012, 0.012, 0.08, 8);
  peg.rotateX(Math.PI / 2);
  peg.translate(0, 0, 0.04);
  g.add(mesh(peg, mats.timberDark));
  // silhouette: hood-less jacket, shoulders sloping from the nail, sleeves hanging at the sides, a hem
  const pts: [number, number][] = [
    [0, 0.0],
    [0.07, -0.05],
    [0.22, -0.09],
    [0.31, -0.2],
    [0.36, -0.55],
    [0.33, -0.6],
    [0.27, -0.58],
    [0.25, -0.35],
    [0.2, -0.3],
    [0.22, -0.9],
    [-0.22, -0.9],
    [-0.2, -0.3],
    [-0.25, -0.35],
    [-0.27, -0.58],
    [-0.33, -0.6],
    [-0.36, -0.55],
    [-0.31, -0.2],
    [-0.22, -0.09],
    [-0.07, -0.05],
  ];
  const geo = new THREE.ExtrudeGeometry(polyShape(pts), {
    depth: 0.07,
    bevelEnabled: true,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    bevelSegments: 2,
  });
  geo.translate(0, 0, 0.012);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, map: mats.cloth.map });
  const coat = new THREE.Mesh(uvMetric(geo), mat);
  coat.castShadow = true;
  coat.receiveShadow = true;
  g.add(coat);
  return g;
}

/** A small rounded box: a book, a matchbox, a tin. */
export const small = (w: number, h: number, d: number, color: number, r = 0.004): THREE.Mesh => {
  const m = mesh(softBox(0, h / 2, 0, w, h, d, r), plain(color, 0.7));
  return m;
};

export { boxAt };
