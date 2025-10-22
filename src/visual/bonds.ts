import * as THREE from 'three';
import { Bonds } from '../sim/cpu/chem/bonds';
export class BondLines {
  geom: THREE.BufferGeometry; line: THREE.LineSegments; positions: Float32Array; max: number;
  constructor(maxBonds=6000) {
    this.max = maxBonds; this.positions = new Float32Array(maxBonds*2*3);
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0x6ee7ff, transparent:true, opacity:0.6 });
    this.line = new THREE.LineSegments(this.geom, mat);
  }
  updateFromBonds(bonds: Bonds, pos: Float32Array) {
    let idx=0;
    bonds.forEach((i,j)=>{
      if ((idx+2)*3 > this.positions.length) return;
      const ia=3*i, jb=3*j;
      this.positions[idx*3+0]=pos[ia];   this.positions[idx*3+1]=pos[ia+1];   this.positions[idx*3+2]=pos[ia+2];
      this.positions[(idx+1)*3+0]=pos[jb]; this.positions[(idx+1)*3+1]=pos[jb+1]; this.positions[(idx+1)*3+2]=pos[jb+2];
      idx += 2;
    });
    this.geom.setDrawRange(0, idx);
    (this.geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }
}
