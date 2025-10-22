import * as THREE from 'three';
import { SPECIES, Species } from '../sim/cpu/chem/species';

export class AtomMesh {
  mesh: THREE.InstancedMesh;
  glowMesh: THREE.InstancedMesh;
  dummy = new THREE.Object3D();
  colors: Float32Array;
  glowColors: Float32Array;
  
  constructor(public count: number, species: Uint8Array) {
    // Main atom mesh - bright and solid
    const geom = new THREE.SphereGeometry(0.5, 12, 8);
    const mat = new THREE.MeshPhongMaterial({ 
      shininess: 100,
      transparent: false,
      vertexColors: true,
      emissive: new THREE.Color(0x000000),
      specular: new THREE.Color(0x444444)
    });
    
    this.mesh = new THREE.InstancedMesh(geom, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Subtle glow mesh (much more transparent)
    const glowGeom = new THREE.SphereGeometry(0.6, 6, 4);
    const glowMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.1, // Much more subtle
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    
    this.glowMesh = new THREE.InstancedMesh(glowGeom, glowMat, count);
    this.glowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Color attributes
    this.colors = new Float32Array(count * 3);
    this.glowColors = new Float32Array(count * 3);
    
    const colorAttr = new THREE.InstancedBufferAttribute(this.colors, 3);
    const glowColorAttr = new THREE.InstancedBufferAttribute(this.glowColors, 3);
    
    this.mesh.geometry.setAttribute('instanceColor', colorAttr);
    this.glowMesh.geometry.setAttribute('instanceColor', glowColorAttr);
    
    this.recolor(species);
  }
  
  recolor(species: Uint8Array) {
    const c = new THREE.Color();
    for (let i = 0; i < this.count; i++) {
      const info = SPECIES[species[i] as Species];
      c.setHex(info.color);
      
      // Main atom color (bright and solid)
      this.colors[3*i+0] = c.r;
      this.colors[3*i+1] = c.g; 
      this.colors[3*i+2] = c.b;
      
      // Glow color (very subtle)
      this.glowColors[3*i+0] = c.r * 0.3;
      this.glowColors[3*i+1] = c.g * 0.3;
      this.glowColors[3*i+2] = c.b * 0.3;
    }
    
    (this.mesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute).needsUpdate = true;
    (this.glowMesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute).needsUpdate = true;
  }
  
  updateFromArray(pos: Float32Array, species: Uint8Array, visualScale: number, vel?: Float32Array) {
    for (let i = 0; i < this.count; i++) {
      const ix = 3*i;
      const info = SPECIES[species[i] as Species];
      
      // Update positions
      this.dummy.position.set(pos[ix], pos[ix+1], pos[ix+2]);
      
      // Basic scaling
      const scale = (info.radius * visualScale / 0.5);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      
      // Update main mesh
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      
      // Glow mesh slightly larger but much more subtle
      this.dummy.scale.setScalar(scale * 1.1);
      this.dummy.updateMatrix();
      this.glowMesh.setMatrixAt(i, this.dummy.matrix);
      
      // Very subtle energy-based glow
      if (vel) {
        const vx = vel[ix], vy = vel[ix+1], vz = vel[ix+2];
        const energy = Math.sqrt(vx*vx + vy*vy + vz*vz);
        const intensity = Math.min(energy * 0.1, 0.2); // Much more subtle
        
        const baseColor = new THREE.Color(info.color);
        this.glowColors[3*i+0] = baseColor.r * intensity;
        this.glowColors[3*i+1] = baseColor.g * intensity;
        this.glowColors[3*i+2] = baseColor.b * intensity;
      }
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
    
    if (vel) {
      (this.glowMesh.geometry.getAttribute('instanceColor') as THREE.InstancedBufferAttribute).needsUpdate = true;
    }
  }
}
