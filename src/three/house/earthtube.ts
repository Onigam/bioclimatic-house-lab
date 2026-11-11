import * as THREE from 'three';
import { joined, stick, tubeGeometry } from '../common';
import { ROOM, TUBE, TUBE_BED, TUBE_FALL, TUBE_PLAN, Z_NORTH } from '../dims';
import type { Mats } from '../materials';
import { groundY } from '../land/ground';
import { strataV, type Hole } from '../land/terrain';
import { AT } from '../room/equipment';

// The what-if: an earth tube for the house's fresh air. It is under 2 m of earth, so it is drawn the way a buried thing is drawn in a section: the ground over it is cut away (a window in the land, `TUBE_PIT`, with the
// earth's strata on its four walls and a bed of sand under the pipe) and closed again by a translucent lid of the same ground, so that the pipe is seen where it lies, in the earth, and never in front of anything. Every surface
// is drawn with the depth test on: seen from the south the house hides it, seen from above the lid does. Always there, pale, with its own labels « et si… »; the scenario makes it firmer (`setOn`). It is not in this house.
// The research: no measured earth tube on a house, at altitude or in France, has reached us.
//
// The route is a serpentine of five runs (`TUBE_PLAN`), each run level, the bends dropping by the tube's fall (1.5 %), so the bed under it is a stair of flat steps, one run each, and the pipe lies on its own step.

export interface EarthTube {
  intake: THREE.Group;
  pipe: THREE.Group;
  drain: THREE.Group;
  /** The window in the ground: walls, steps, and the translucent lid. Scenery that goes with the pipe. */
  pit: THREE.Group;
  /** Length of the pipe's axis from the standpipe's foot to the riser's top, m. */
  length: number;
  /** The route on the plan and the pipe's axis height along it. */
  route: THREE.Vector3[];
  /** Each run's axis height and the height of the bed under it, from the intake. */
  runs: { z: number; y: number; bed: number }[];
  /** The riser's top, where the pipe meets the vent. */
  ventEnd: THREE.Vector3;
  intakeTop: THREE.Vector3;
  drainAt: THREE.Vector3;
  /** The cut-away in the land, as the land's grid has it. */
  hole: Hole;
  /** The scenario's state: firmer when it runs, pale when it does not. */
  setOn(on: boolean): void;
}

/** The plan: five runs side by side, the intake at the west end of the first, the last one ending at the vent's riser against the north wall. Lengths chosen so the whole is the model's 50 m (`TUBE.length`) within a few percent. */
export function tubeRoute(): { x: number; z: number }[] {
  const { runs, spacing, xWest, xEast, zFar } = TUBE_PLAN;
  const out: { x: number; z: number }[] = [];
  for (let k = 0; k < runs; k++) {
    const z = zFar + k * spacing;
    out.push({ x: k % 2 === 0 ? xWest : xEast, z }, { x: k % 2 === 0 ? xEast : xWest, z });
  }
  out.push({ x: AT.ventX, z: Z_NORTH - 0.45 });
  return out;
}

/** The length of the plan from point `a` to point `b` of the route, m. */
function planLength(plan: { x: number; z: number }[], a: number, b: number): number {
  let s = 0;
  for (let i = a + 1; i <= b; i++) s += Math.hypot(plan[i]!.x - plan[i - 1]!.x, plan[i]!.z - plan[i - 1]!.z);
  return s;
}

/**
 * The height of each run's axis and of the bed under it. The first run is `TUBE.depth` under the ground at the intake; each run is level, and the bend before it drops to the level the tube's fall (`TUBE_FALL`) gives it
 * at its start, so the pipe falls to the house and the bed is a stair of flat steps, one run each.
 */
export function tubeRuns(): { z: number; y: number; bed: number }[] {
  const plan = tubeRoute();
  const R = TUBE.diameter / 2;
  const y0 = groundY(plan[0]!.x, plan[0]!.z) - TUBE.depth;
  const runs: { z: number; y: number; bed: number }[] = [];
  for (let k = 0; k < TUBE_PLAN.runs; k++) {
    const y = y0 - TUBE_FALL * planLength(plan, 0, 2 * k);
    runs.push({ z: plan[2 * k]!.z, y, bed: y - R + TUBE_BED });
  }
  return runs;
}

export function buildEarthTube(mats: Mats, hole: Hole): EarthTube {
  const ghost = new THREE.MeshStandardMaterial({
    color: 0x78a9c1,
    roughness: 0.45,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  ghost.userData.noShare = true;
  ghost.userData.whatIf = true;
  const R = TUBE.diameter / 2;
  const plan = tubeRoute();
  const len = planLength(plan, 0, plan.length - 1);
  const runs = tubeRuns();
  const route: THREE.Vector3[] = [];
  for (let k = 0; k < runs.length; k++)
    route.push(
      new THREE.Vector3(plan[2 * k]!.x, runs[k]!.y, plan[2 * k]!.z),
      new THREE.Vector3(plan[2 * k + 1]!.x, runs[k]!.y, plan[2 * k + 1]!.z),
    );
  const last = plan[plan.length - 1]!;
  route.push(new THREE.Vector3(last.x, runs[runs.length - 1]!.y, last.z));

  // the pipe: a tube along the route with rounded bends, with joints (rings) every 3 m
  const pipe = new THREE.Group();
  pipe.name = 'earth-tube-pipe';
  const pts: THREE.Vector3[] = [];
  // the pipe goes through a few extra points so Catmull-Rom does not overshoot the corners: round the corners by hand
  for (let i = 0; i < route.length; i++) {
    const p = route[i]!;
    if (i === 0 || i === route.length - 1) pts.push(p.clone());
    else {
      const a = route[i - 1]!;
      const b = route[i + 1]!;
      const k = 0.9 / Math.max(0.1, p.distanceTo(a));
      const j = 0.9 / Math.max(0.1, p.distanceTo(b));
      pts.push(p.clone().lerp(a, Math.min(0.45, k)), p.clone(), p.clone().lerp(b, Math.min(0.45, j)));
    }
  }
  const body = new THREE.Mesh(tubeGeometry(pts, R, 640, 10), ghost);
  body.name = 'pipe';
  body.renderOrder = 8;
  body.castShadow = false;
  pipe.add(body);
  const joints: THREE.BufferGeometry[] = [];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const n = Math.floor(curve.getLength() / 3);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const g = new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.08, 12);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan));
    g.translate(c.x, c.y, c.z);
    joints.push(g);
  }
  const jm = new THREE.Mesh(joined(joints), ghost);
  jm.renderOrder = 8;
  jm.castShadow = false;
  pipe.add(jm);
  // the riser: from the pipe's end up the wall's outer face to the vent, an elbow into the grille
  const end = route[route.length - 1]!;
  const ventY = ROOM.freshVent.y + ROOM.freshVent.h / 2;
  const riser = new THREE.Mesh(
    joined([stick(new THREE.Vector3(end.x, end.y, end.z), new THREE.Vector3(end.x, ventY, end.z), R, 12)]),
    ghost,
  );
  riser.renderOrder = 8;
  riser.castShadow = false;
  pipe.add(riser);
  const ventEnd = new THREE.Vector3(end.x, ventY, end.z);
  const elbow = new THREE.Mesh(
    joined([stick(ventEnd, new THREE.Vector3(end.x, ventY, Z_NORTH - 0.012), R, 12)]),
    ghost,
  );
  elbow.renderOrder = 8;
  elbow.castShadow = false;
  pipe.add(elbow);

  // the intake: a concrete foot, a standpipe 1.8 m above the ground, a hood and a mesh
  const intake = new THREE.Group();
  intake.name = 'earth-tube-intake';
  const ix = route[0]!.x;
  const iz = route[0]!.z;
  const gy = groundY(ix, iz);
  const top = gy + 1.8;
  const intakeMeshes: THREE.Mesh[] = [];
  const addIntake = (g: THREE.BufferGeometry): void => {
    const m = new THREE.Mesh(g, ghost);
    m.renderOrder = 8;
    m.castShadow = false;
    intake.add(m);
    intakeMeshes.push(m);
  };
  addIntake(joined([stick(new THREE.Vector3(ix, route[0]!.y, iz), new THREE.Vector3(ix, top, iz), R * 1.05, 14)]));
  const hood = new THREE.ConeGeometry(R * 2.1, 0.22, 16);
  hood.translate(ix, top + 0.2, iz);
  addIntake(hood);
  const rim = new THREE.CylinderGeometry(R * 1.6, R * 1.6, 0.02, 16);
  rim.translate(ix, top + 0.04, iz);
  addIntake(rim);
  const base = new THREE.CylinderGeometry(0.4, 0.45, 0.3, 14);
  base.translate(ix, gy + 0.04, iz);
  addIntake(base);

  // the drain: a pit at the low point, west of the last bend, a short stub into the pipe and a lid at the ground
  const drain = new THREE.Group();
  drain.name = 'earth-tube-drain';
  const dx = TUBE_PLAN.xEast - 0.8;
  const lastRun = runs[runs.length - 1]!;
  const dz = lastRun.z + 0.45;
  const dy = lastRun.y;
  const dg = groundY(dx, dz);
  const shaft = new THREE.BoxGeometry(0.5, dg - (dy - 0.4), 0.5);
  shaft.translate(dx, (dg + dy - 0.4) / 2, dz);
  const shaftMesh = new THREE.Mesh(shaft, ghost);
  shaftMesh.renderOrder = 8;
  shaftMesh.castShadow = false;
  drain.add(shaftMesh);
  const stub = new THREE.Mesh(
    joined([stick(new THREE.Vector3(dx, dy, lastRun.z), new THREE.Vector3(dx, dy, dz), R * 0.5, 10)]),
    ghost,
  );
  stub.renderOrder = 8;
  stub.castShadow = false;
  drain.add(stub);
  const lid = new THREE.BoxGeometry(0.56, 0.05, 0.56);
  lid.translate(dx, dg + 0.01, dz);
  drain.add(new THREE.Mesh(lid, mats.steelDark));

  // the window in the ground: the four walls with the strata, the bed of each run, the risers between the beds
  const pit = new THREE.Group();
  pit.name = 'earth-tube-pit';
  const { x0, x1, z0, z1 } = hole;
  const step = TUBE_PLAN.spacing;
  // the bed of run k holds from its middle less half a spacing to its middle plus half; the first and the last reach the edges
  const edges: number[] = [z0];
  for (let k = 0; k < runs.length - 1; k++) edges.push(runs[k]!.z + step / 2);
  edges.push(z1);
  const floors: THREE.BufferGeometry[] = [];
  for (let k = 0; k < runs.length; k++) {
    const a = edges[k]!;
    const b = edges[k + 1]!;
    const g = new THREE.PlaneGeometry(x1 - x0, b - a);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, runs[k]!.bed, (a + b) / 2);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    floors.push(g);
  }
  const floor = new THREE.Mesh(joined(floors), mats.gravel);
  floor.name = 'pit-floor';
  floor.receiveShadow = true;
  floor.castShadow = false;
  pit.add(floor);

  const wp: number[] = [];
  const wu: number[] = [];
  const wi: number[] = [];
  /** A strip of wall from a to b on the plan, from the ground down to `bottom(t)`; the strata read downwards from the surface, as on the diorama's own sides. */
  const wall = (ax: number, az: number, bx: number, bz: number, bottom: (z: number) => number, n: number): void => {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const gy0 = groundY(x, z);
      const yb = bottom(z);
      const base = wp.length / 3;
      wp.push(x, gy0, z, x, yb, z);
      const u = (x * 0.9 + z * 1.1) / 10;
      wu.push(u, strataV(0), u, strataV(gy0 - yb));
      if (i > 0) wi.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
  };
  wall(x0, z0, x1, z0, () => runs[0]!.bed, 12); // north
  wall(x0, z1, x1, z1, () => lastRun.bed, 12); // south
  for (const x of [x0, x1]) {
    // west and east walls run along z, each run's step its own depth
    for (let k = 0; k < runs.length; k++) {
      const a = edges[k]!;
      const b = edges[k + 1]!;
      wall(x, a, x, b, () => runs[k]!.bed, Math.max(2, Math.round((b - a) / 0.35)));
    }
  }
  // the risers: between the beds, facing the house (the bed falls to the south)
  for (let k = 0; k < runs.length - 1; k++) {
    const hgt = runs[k]!.bed - runs[k + 1]!.bed;
    const z = edges[k + 1]!;
    const base = wp.length / 3;
    const dz0 = groundY(0, z);
    wp.push(x0, runs[k]!.bed, z, x1, runs[k]!.bed, z, x0, runs[k + 1]!.bed, z, x1, runs[k + 1]!.bed, z);
    wu.push(
      0,
      strataV(dz0 - runs[k]!.bed),
      1,
      strataV(dz0 - runs[k]!.bed),
      0,
      strataV(dz0 - runs[k]!.bed + hgt),
      1,
      strataV(dz0 - runs[k]!.bed + hgt),
    );
    wi.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
  }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  wg.setAttribute('uv', new THREE.Float32BufferAttribute(wu, 2));
  wg.setIndex(wi);
  wg.computeVertexNormals();
  const walls = new THREE.Mesh(wg, mats.strata);
  walls.name = 'pit-walls';
  walls.receiveShadow = true;
  walls.castShadow = false;
  pit.add(walls);

  return {
    intake,
    pipe,
    drain,
    pit,
    length: len + (ventY - end.y),
    route,
    runs,
    ventEnd,
    intakeTop: new THREE.Vector3(ix, top + 0.3, iz),
    drainAt: new THREE.Vector3(dx, dg + 0.06, dz),
    hole,
    setOn(on) {
      ghost.opacity = on ? 0.8 : 0.45;
      ghost.color.set(on ? 0x6aa6c6 : 0x9db4c0);
    },
  };
}
