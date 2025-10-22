import * as THREE from 'three';
import { Bonds } from '../sim/cpu/chem/bonds';
export class BondLines {
  geom: THREE.BufferGeometry; line: THREE.LineSegments; positions: Float32Array; colors: Float32Array; max: number;
  constructor(maxBonds=6000) {
    this.max = maxBonds; 
    this.positions = new Float32Array(maxBonds*2*3);
    this.colors = new Float32Array(maxBonds*2*3);
    this.geom = new THREE.BufferGeometry();
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    
    // Sci-fi glowing bond material - more subtle
    const mat = new THREE.LineBasicMaterial({ 
      vertexColors: true,
      transparent: true, 
      opacity: 0.4, // More subtle
      blending: THREE.NormalBlending, // Less aggressive blending
      linewidth: 1
    });
    this.line = new THREE.LineSegments(this.geom, mat);
  }
  
  updateFromBonds(bonds: Bonds, pos: Float32Array) {
    let idx=0;
    const time = performance.now() * 0.001;
    
    bonds.forEach((i,j)=>{
      if ((idx+2)*3 > this.positions.length) return;
      const ia=3*i, jb=3*j;
      
      // Position
      this.positions[idx*3+0]=pos[ia];   this.positions[idx*3+1]=pos[ia+1];   this.positions[idx*3+2]=pos[ia+2];
      this.positions[(idx+1)*3+0]=pos[jb]; this.positions[(idx+1)*3+1]=pos[jb+1]; this.positions[(idx+1)*3+2]=pos[jb+2];
      
      // Subtle colored bonds based on element types
      const hue1 = (i * 0.3) % 1;
      const hue2 = (j * 0.3) % 1;
      const color1 = new THREE.Color().setHSL(hue1, 0.7, 0.5);
      const color2 = new THREE.Color().setHSL(hue2, 0.7, 0.5);
      
      this.colors[idx*3+0] = color1.r; this.colors[idx*3+1] = color1.g; this.colors[idx*3+2] = color1.b;
      this.colors[(idx+1)*3+0] = color2.r; this.colors[(idx+1)*3+1] = color2.g; this.colors[(idx+1)*3+2] = color2.b;
      
      idx += 2;
    });
    this.geom.setDrawRange(0, idx);
    (this.geom.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.geom.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }
}
