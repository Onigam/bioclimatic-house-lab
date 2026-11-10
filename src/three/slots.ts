import * as THREE from 'three';

// Geometry that depends on a context (the element's spec) and is made again when it changes. A slot is one mesh and the function that makes its geometry: `apply` swaps the geometry and disposes the old one. The
// meshes stay where they are in the scene, so a part that holds them keeps them, and the registry's lists stay good.

export class Slots<C> {
  private readonly list: { mesh: THREE.Mesh; make: (c: C) => THREE.BufferGeometry }[] = [];

  add<M extends THREE.Mesh>(mesh: M, make: (c: C) => THREE.BufferGeometry): M {
    mesh.userData.dynamic = true;
    this.list.push({ mesh, make });
    return mesh;
  }

  apply(c: C): void {
    for (const s of this.list) {
      const old = s.mesh.geometry;
      s.mesh.geometry = s.make(c);
      old.dispose();
      const im = s.mesh as THREE.InstancedMesh;
      if (im.isInstancedMesh) {
        im.boundingBox = null;
        im.boundingSphere = null;
      }
    }
  }

  get size(): number {
    return this.list.length;
  }
}
