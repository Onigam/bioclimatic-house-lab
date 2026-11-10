import * as THREE from 'three';
import { joined, stick, tubeGeometry } from '../common';
import { GROUND_NORTH, ROOM, TUBE, TUBE_FALL, Z_NORTH } from '../dims';
import type { Mats } from '../materials';
import { groundY } from '../land/ground';
import { AT } from '../room/equipment';

// The what-if: an earth tube for the house's fresh air. A standpipe with a hood and a mesh on the slope above, a pipe of the model's length, diameter and depth buried along the contour (the ground falls only with z, so a line
// at constant z stays at the same depth), a turn to the house, a drain pit at the low point and the riser to the vent in the north wall. All translucent: it is drawn only in its scenario and says it is not in this house.
// The research: no measured earth tube on a house, at altitude or in France, has reached us.

export interface EarthTube {
  intake: THREE.Group;
  pipe: THREE.Group;
  drain: THREE.Group;
  /** Length of the pipe's axis from the standpipe's foot to the riser's top, m. */
  length: number;
  /** The route on the plan and the pipe's axis height along it. */
  route: THREE.Vector3[];
  /** The riser's top, where the pipe meets the vent. */
  ventEnd: THREE.Vector3;
  intakeTop: THREE.Vector3;
  drainAt: THREE.Vector3;
}

/** The plan: from the intake, west along the contour, a short run south, east to the vent's x, south to the wall. Lengths chosen so the whole is the model's 50 m (`TUBE.length`) within a few percent. */
export function tubeRoute(): { x: number; z: number }[] {
  const zRun = -8.0;
  return [
    { x: 11.0, z: zRun },
    { x: -16.5, z: zRun },
    { x: -16.5, z: -5.5 },
    { x: AT.ventX, z: -5.5 },
    { x: AT.ventX, z: Z_NORTH - 0.45 },
  ];
}

export function buildEarthTube(mats: Mats): EarthTube {
  const ghost = new THREE.MeshStandardMaterial({
    color: 0x78a9c1,
    roughness: 0.45,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  ghost.userData.noShare = true;
  ghost.userData.whatIf = true;
  // seen through the ground: the pipe lies under 2 m of earth, and a what-if has to be readable
  const under = ghost.clone();
  under.depthTest = false;
  under.userData.noShare = true;
  under.userData.whatIf = true;
  const plan = tubeRoute();
  let len = 0;
  for (let i = 1; i < plan.length; i++) len += Math.hypot(plan[i]!.x - plan[i - 1]!.x, plan[i]!.z - plan[i - 1]!.z);
  // the axis: constant depth under the ground at the intake, then falling by TUBE_FALL towards the house
  const y0 = groundY(plan[0]!.x, plan[0]!.z) - TUBE.depth;
  const route: THREE.Vector3[] = [];
  let s = 0;
  for (let i = 0; i < plan.length; i++) {
    if (i > 0) s += Math.hypot(plan[i]!.x - plan[i - 1]!.x, plan[i]!.z - plan[i - 1]!.z);
    route.push(new THREE.Vector3(plan[i]!.x, y0 - TUBE_FALL * s, plan[i]!.z));
  }
  const R = TUBE.diameter / 2;

  // the pipe: a tube along the route with rounded bends, with joints (rings) every 6 m
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
  const body = new THREE.Mesh(tubeGeometry(pts, R, 120, 12), under);
  body.name = 'pipe';
  body.renderOrder = 8;
  body.castShadow = false;
  pipe.add(body);
  const joints: THREE.BufferGeometry[] = [];
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const n = Math.floor(curve.getLength() / 6);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    const g = new THREE.CylinderGeometry(R * 1.12, R * 1.12, 0.08, 12);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan));
    g.translate(c.x, c.y, c.z);
    joints.push(g);
  }
  const jm = new THREE.Mesh(joined(joints), under);
  jm.renderOrder = 8;
  jm.castShadow = false;
  pipe.add(jm);
  // the riser: from the pipe's end up the wall's outer face to the vent, an elbow into the grille
  const end = route[route.length - 1]!;
  const ventY = ROOM.freshVent.y + ROOM.freshVent.h / 2;
  const riser = new THREE.Mesh(
    joined([stick(new THREE.Vector3(end.x, end.y, end.z), new THREE.Vector3(end.x, ventY, end.z), R, 12)]),
    under,
  );
  riser.renderOrder = 8;
  riser.castShadow = false;
  pipe.add(riser);
  const ventEnd = new THREE.Vector3(end.x, ventY, end.z);
  const elbow = new THREE.Mesh(
    joined([stick(ventEnd, new THREE.Vector3(end.x, ventY, Z_NORTH - 0.012), R, 12)]),
    under,
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
  intake.add(
    new THREE.Mesh(
      joined([stick(new THREE.Vector3(ix, route[0]!.y, iz), new THREE.Vector3(ix, top, iz), R * 1.05, 14)]),
      ghost,
    ),
  );
  const hood = new THREE.ConeGeometry(R * 2.1, 0.22, 16);
  hood.translate(ix, top + 0.2, iz);
  intake.add(new THREE.Mesh(hood, ghost));
  const rim = new THREE.CylinderGeometry(R * 1.6, R * 1.6, 0.02, 16);
  rim.translate(ix, top + 0.04, iz);
  intake.add(new THREE.Mesh(rim, ghost));
  const base = new THREE.CylinderGeometry(0.4, 0.45, 0.3, 14);
  base.translate(ix, gy + 0.04, iz);
  intake.add(new THREE.Mesh(base, ghost));

  // the drain: a pit at the low point, a short stub into the pipe and a lid at the ground
  const drain = new THREE.Group();
  drain.name = 'earth-tube-drain';
  const dx = route[route.length - 2]!.x + 0.0;
  const dz = route[route.length - 2]!.z;
  const dy = route[route.length - 2]!.y;
  const dg = groundY(dx, dz);
  const pit = new THREE.BoxGeometry(0.7, dg - (dy - 0.5), 0.7);
  pit.translate(dx, (dg + dy - 0.5) / 2, dz + 0.55);
  const pitMesh = new THREE.Mesh(pit, under);
  pitMesh.renderOrder = 8;
  drain.add(pitMesh);
  drain.add(
    new THREE.Mesh(
      joined([stick(new THREE.Vector3(dx, dy, dz), new THREE.Vector3(dx, dy, dz + 0.55), R * 0.5, 10)]),
      under,
    ),
  );
  const lid = new THREE.BoxGeometry(0.76, 0.05, 0.76);
  lid.translate(dx, dg + 0.01, dz + 0.55);
  drain.add(new THREE.Mesh(lid, mats.steelDark));
  void GROUND_NORTH;
  return {
    intake,
    pipe,
    drain,
    length: len + (ventY - end.y),
    route,
    ventEnd,
    intakeTop: new THREE.Vector3(ix, top + 0.3, iz),
    drainAt: new THREE.Vector3(dx, dg + 0.06, dz + 0.55),
  };
}
