import * as THREE from 'three';
import { boxAt, joined, polyShape, uvMetric } from '../common';

// Geometry helpers of the house: a polygon in the (z, y) plane extruded along x (a gable, a partition, a roof slope), a polygon in the (x, y) plane extruded along z (a wall with openings). UVs in metres.

type P = readonly [number, number];

/** A polygon given as [z, y] pairs, with holes, extruded along x from `x0` to `x1`. */
export function extrudeX(
  points: readonly P[],
  x0: number,
  x1: number,
  holes: (readonly P[])[] = [],
): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(polyShape(points, holes), { depth: Math.abs(x1 - x0), bevelEnabled: false });
  // shape (u, v) = (z, y), the extrusion along +e: a rotation about y by −90° sends (u, v, e) to (−e, v, u)
  g.rotateY(-Math.PI / 2);
  g.translate(Math.max(x0, x1), 0, 0);
  return uvMetric(g);
}

/** A polygon given as [x, y] pairs, with holes, extruded along z from `z0` to `z1`. */
export function extrudeZ(
  points: readonly P[],
  z0: number,
  z1: number,
  holes: (readonly P[])[] = [],
): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(polyShape(points, holes), { depth: Math.abs(z1 - z0), bevelEnabled: false });
  g.translate(0, 0, Math.min(z0, z1));
  return uvMetric(g);
}

/** A rectangle [x0, y0, x1, y1] as a polygon. */
export const rect = (x0: number, y0: number, x1: number, y1: number): P[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

/** A box between two corners. */
export const bx = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): THREE.BufferGeometry =>
  boxAt(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1));

export { joined };
