import * as THREE from 'three';
import { SPECIES, Species } from '../sim/cpu/chem/species';

export class AtomMesh {
  mesh: THREE.InstancedMesh;
  dummy = new THREE.Object3D();
  colors: Float32Array;
  constructor(public count: number, species: Uint8Array) {
    const geom = new THREE.SphereGeometry(0.25, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.4, vertexColors: true });
    this.mesh = new THREE.InstancedMesh(geom, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // per-instance color attribute
    this.colors = new Float32Array(count * 3);
    const colorAttr = new THREE.InstancedBufferAttribute(this.colors, 3);
    (this.mesh.geometry as any).setAttribute('instanceColor', colorAttr);
    this.recolor(species);
  }
  recolor(species: Uint8Array) {
    const c = new THREE.Color();
    for (let i=0;i<this.count;i++) {
      const info = SPECIES[species[i] as Species];
      c.setHex(info.color);
      this.colors[3*i+0] = c.r;
      this.colors[3*i+1] = c.g;
      this.colors[3*i+2] = c.b;
    }
    (this.mesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute).needsUpdate = true;
  }
  updateFromArray(pos: Float32Array, species: Uint8Array) {
    for (let i=0;i<this.count;i++) {
      const ix=3*i;
      const info = SPECIES[species[i] as Species];
      this.dummy.position.set(pos[ix], pos[ix+1], pos[ix+2]);
      this.dummy.scale.setScalar(info.radius/0.25); // scale relative to base radius
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
