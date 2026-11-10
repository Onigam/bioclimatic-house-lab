import * as THREE from 'three';
import { clamp } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { joined, stick, tubeGeometry } from '../common';
import {
  BAY,
  CEILING,
  CEILING_T,
  LIVING_X0,
  LIVING_X1,
  ROOM,
  SAMPLE_BAY,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
  type ElementSpec,
} from '../dims';
import { heatColor } from '../heat';
import { ROOM_PARTS, type RoomPart } from '../ids';
import { bx } from '../house/geo';
import { Z_RUN } from '../house/shell';
import type { Mats } from '../materials';
import { buildCoat } from '../props';
import {
  AT,
  buildAirProbe,
  buildFreshVent,
  buildHeater,
  buildPanel,
  buildRecorder,
  buildSurfaceProbes,
  buildThermostat,
  innerFaceGeo,
  plumeGeo,
  streamMaterial,
} from './equipment';
import {
  buildArmchair,
  buildBoots,
  buildBookshelf,
  buildChair,
  buildCurtains,
  buildDryingRack,
  buildLamp,
  buildPicture,
  buildPlant,
  buildRug,
  buildTable,
  buildToolbox,
} from './furniture';

// The living room's contents, one function for the `room` world (which registers the thirteen parts) and the `house` world (which shows them as the rooms of the house). Equipment, the loop's streams, the furniture the
// family left, and the way the model moves them: the heater's glow, the thermostat's dial, the recorder's pen, the lamps at night.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Living {
  parts: Record<RoomPart, THREE.Group>;
  furniture: THREE.Group;
  roomLight: THREE.PointLight;
  /** The elements of the face and the streams follow the spec. */
  relayout(spec: ElementSpec): void;
  update(s: HouseState, o: { setpoint: number; night: number; forwardFlow: boolean }): void;
  drawn: { heater: number; carriage: number; jet: number; night: number; setpointDial: number };
  /** The recorder's desk, the recorder's input, the junction box's top, for tests. */
  desk: THREE.Group;
  recorderInput: THREE.Vector3;
  boxTop: THREE.Vector3;
}

export function buildLiving(mats: Mats, spec0: ElementSpec, o: { floorAndCeiling: boolean }): Living {
  const L0 = elementLayout(spec0);
  const zIn = Z_SOUTH + L0.inner;
  const sampleX = bayX(SAMPLE_BAY);
  const parts = {} as Record<RoomPart, THREE.Group>;
  for (const id of ROOM_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    parts[id] = g;
  }

  // floor and ceiling over the living room only (the room world's own; the house world's are the shell's)
  const flexTop = V(0.0, CEILING, 0.7);
  const lampshade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.24, 0.2, 20, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xe8d6b0,
      roughness: 0.9,
      side: THREE.DoubleSide,
      emissive: 0xffd8a0,
      emissiveIntensity: 0,
    }),
  );
  lampshade.position.set(flexTop.x, CEILING - 0.45, flexTop.z);
  (lampshade.material as THREE.Material).userData = { noShare: true };
  lampshade.castShadow = true;
  if (o.floorAndCeiling) {
    const f = new THREE.Mesh(bx(LIVING_X0, -0.03, Z_NORTH_IN, LIVING_X1, 0, Z_RUN), mats.tile);
    f.receiveShadow = true;
    f.name = 'floor-tile';
    parts['room-floor'].add(f);
    const c = new THREE.Mesh(
      bx(LIVING_X0, CEILING, Z_NORTH_IN, LIVING_X1, CEILING + CEILING_T, Z_RUN),
      mats.ceiling.clone(),
    );
    c.receiveShadow = true;
    c.name = 'ceiling';
    (c.material as THREE.Material).userData = { noShare: true };
    parts['room-ceiling'].add(c);
  }
  parts['room-ceiling'].add(lampshade);
  parts['room-ceiling'].add(
    new THREE.Mesh(
      joined([
        stick(flexTop, V(flexTop.x, CEILING - 0.35, flexTop.z), 0.004, 5),
        stick(V(flexTop.x - 0.04, CEILING, flexTop.z), V(flexTop.x + 0.04, CEILING, flexTop.z), 0.03, 10),
      ]),
      mats.whitePaint,
    ),
  );

  // the face of the wall: a lime wash with holes for the two ducts
  const face = new THREE.Mesh(
    innerFaceGeo(spec0, sampleX - BAY / 2, sampleX + BAY / 2),
    new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.95 }),
  );
  face.receiveShadow = true;
  face.name = 'inner-face-plate';
  face.position.z = Z_SOUTH;
  face.userData.dynamic = true;
  parts['inner-wall-face'].add(face);

  // equipment
  const heater = buildHeater(mats);
  parts['electric-heater'].add(heater.group);
  const panel = buildPanel(mats);
  parts['electric-panel'].add(panel.group);
  const thermostat = buildThermostat();
  parts['thermostat'].add(thermostat.group);
  parts['fresh-air-vent'].add(buildFreshVent(mats));
  const recorder = buildRecorder(mats, zIn);
  parts['chart-recorder'].add(recorder.group);
  const boxTop = V(sampleX - 0.32, 1.544, zIn - 0.02);
  parts['room-air-probe'].add(buildAirProbe(mats, boxTop));
  parts['room-surface-probes'].add(buildSurfaceProbes(zIn, recorder.inputTop));
  {
    const box0 = V(sampleX - 0.32, 1.45, zIn - 0.022);
    const t = recorder.inputTop;
    const cable = tubeGeometry(
      [box0, V(box0.x - 0.02, 1.2, zIn - 0.05), V(t.x + 0.06, t.y + 0.35, t.z + 0.05), t.clone()],
      0.0045,
      24,
      6,
    );
    parts['chart-recorder'].add(
      new THREE.Mesh(cable, new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.7 })),
    );
  }

  // the two streams of the loop
  const jetMat = streamMaterial();
  const jet = new THREE.Mesh(new THREE.BufferGeometry(), jetMat);
  jet.name = 'jet';
  jet.castShadow = false;
  parts['warm-air-jet'].add(jet);
  const returnMat = streamMaterial();
  const ret = new THREE.Mesh(new THREE.BufferGeometry(), returnMat);
  ret.name = 'return';
  ret.castShadow = false;
  parts['floor-return'].add(ret);
  const streamGeos = (s: ElementSpec): void => {
    const L = elementLayout(s);
    const zi = Z_SOUTH + L.inner;
    jet.geometry.dispose();
    jet.geometry = plumeGeo(
      [
        V(sampleX, L.yDuctHigh, zi - 0.02),
        V(sampleX, L.yDuctHigh - 0.03, zi - 0.5),
        V(sampleX, L.yDuctHigh - 0.35, zi - 1.15),
        V(sampleX, L.yDuctHigh - 1.0, zi - 1.6),
      ],
      0.045,
      0.3,
      0.35,
    );
    ret.geometry.dispose();
    ret.geometry = plumeGeo(
      [
        V(sampleX, 0.2, zi - 1.5),
        V(sampleX, 0.14, zi - 0.9),
        V(sampleX, L.yDuctLow, zi - 0.3),
        V(sampleX, L.yDuctLow, zi - 0.02),
      ],
      0.22,
      0.05,
      0.35,
    );
  };
  streamGeos(spec0);

  // furniture
  const furniture = new THREE.Group();
  furniture.name = 'furniture';
  const put = (ob: THREE.Object3D, x: number, y: number, z: number, ry = 0): THREE.Object3D => {
    ob.position.set(x, y, z);
    ob.rotation.y = ry;
    furniture.add(ob);
    return ob;
  };
  put(buildRug(), -1.1, 0, 0.9, 0.12);
  put(buildTable(mats), -1.1, 0, 0.9, 0.12);
  put(buildChair(mats), -1.3, 0, 0.35, 0.1);
  put(buildChair(mats), -0.75, 0, 1.52, Math.PI - 0.15);
  put(buildChair(mats), -1.95, 0, 0.95, Math.PI / 2 + 0.1);
  put(buildChair(mats), -0.3, 0, 0.78, -Math.PI / 2 + 0.35);
  const arm = buildArmchair(mats);
  arm.group.position.set(-1.95, 0, 2.05);
  arm.group.rotation.y = Math.PI + 0.55;
  parts['armchair'].add(arm.group);
  const lamp = buildLamp(mats);
  put(lamp.group, -2.28, 0, 1.45);
  put(buildPlant(), -1.0, 0, 2.28);
  put(buildCurtains(mats, 0.52), bayX(4), 0, zIn - 0.07);
  put(buildBookshelf(mats), LIVING_X0 + 0.1 + 0.14, 0, -0.95, Math.PI / 2);
  put(buildPicture(), LIVING_X1 - 0.1 - 0.012, 1.65, 0.2, -Math.PI / 2);
  put(buildPicture(), -0.6, 2.0, Z_NORTH_IN + 0.012, 0);
  put(buildCoat(mats, 0x7a4a2e), LIVING_X0 + 0.1, 1.78, 1.9, Math.PI / 2);
  put(buildBoots(mats), 0.25, 0, 2.2, 0.3);
  put(buildToolbox(mats), 0.72, 0, 2.18, 0.2);
  put(buildDryingRack(mats), 2.2, 0, 1.55, 0.0);
  for (const g of [furniture, parts['armchair']])
    g.traverse((m) => ((m as THREE.Mesh).isMesh ? ((m as THREE.Mesh).castShadow = true) : null));

  const roomLight = new THREE.PointLight(0xffc88a, 0, 9, 1.6);
  roomLight.position.set(-2.28, 1.45, 1.45);

  const drawn = { heater: 0, carriage: 0, jet: 0, night: 0, setpointDial: 0 };
  const R = ROOM.recorder.w - 0.1;
  const tmp = new THREE.Color();
  const ceilingShade = lampshade.material as THREE.MeshStandardMaterial;
  return {
    parts,
    furniture,
    roomLight,
    desk: recorder.group,
    recorderInput: recorder.inputTop,
    boxTop,
    drawn,
    relayout(spec) {
      face.geometry.dispose();
      face.geometry = innerFaceGeo(spec, sampleX - BAY / 2, sampleX + BAY / 2);
      streamGeos(spec);
    },
    update(s, p) {
      const on = clamp(s.qAux / 800, 0, 1);
      heater.slot.emissiveIntensity = 1.6 * on;
      panel.lamp.emissiveIntensity = 1.4 * on;
      thermostat.led.emissiveIntensity = 1.6 * on;
      drawn.heater = on;
      drawn.setpointDial = -135 + ((clamp(p.setpoint, 16, 22) - 16) / 6) * 270;
      thermostat.needle.rotation.z = -(drawn.setpointDial * Math.PI) / 180;
      drawn.carriage = clamp((s.tInnerFace - 15) / 20, 0, 1);
      recorder.carriage.position.x = (AT.desk.x0 + AT.desk.x1) / 2 - R / 2 + R * drawn.carriage;
      const pm = recorder.paper.material as THREE.MeshStandardMaterial;
      if (pm.map) pm.map.offset.x = -((s.simTime / 86400) * 2) % 1;
      (face.material as THREE.MeshStandardMaterial).color
        .setRGB(0.93, 0.9, 0.84)
        .lerp(tmp.setRGB(1, 0.8, 0.62), clamp((s.tInnerFace - 22) / 14, 0, 0.5));
      const fwd = p.forwardFlow ? clamp(s.flowLs / 30, 0, 1) : 0;
      const warm = clamp((s.tGapOut - s.tRoom) / 14, 0, 1);
      jetMat.opacity = 0.34 * fwd * (0.35 + 0.65 * warm);
      heatColor(s.tGapOut, jetMat.color);
      returnMat.opacity = 0.22 * fwd;
      heatColor(s.tGapIn, returnMat.color);
      drawn.jet = jetMat.opacity;
      drawn.night = p.night;
      lamp.bulb.emissiveIntensity = 3 * p.night;
      ((lamp.group.userData.shade as THREE.MeshStandardMaterial | undefined) ?? mats.cloth).emissiveIntensity =
        0.9 * p.night;
      ceilingShade.emissiveIntensity = 0.7 * p.night;
      roomLight.intensity = 14 * p.night;
    },
  };
}
