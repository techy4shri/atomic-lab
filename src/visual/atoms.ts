import * as THREE from 'three';
import { SPECIES, Species } from '../sim/cpu/chem/species';

export class AtomMesh {
  mesh: THREE.InstancedMesh;
  glowMesh: THREE.InstancedMesh;
  dummy = new THREE.Object3D();
  
  constructor(public count: number, species: Uint8Array) {
    console.log('=== CREATING ATOM MESH ===');
    console.log('Creating AtomMesh with species:', Array.from(species));
    
    // Main atom mesh - Enhanced material for better sci-fi look
    const geom = new THREE.SphereGeometry(0.5, 16, 12);
    const mat = new THREE.MeshPhongMaterial({ 
      vertexColors: true,
      transparent: false,
      side: THREE.FrontSide,
      shininess: 100,
      specular: 0x444444
    });
    
    console.log('Material created with vertexColors:', mat.vertexColors);
    
    this.mesh = new THREE.InstancedMesh(geom, mat, count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Outer glow mesh - Enhanced sci-fi glow effect
    const glowGeom = new THREE.SphereGeometry(0.8, 8, 6);
    const glowMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    
    this.glowMesh = new THREE.InstancedMesh(glowGeom, glowMat, count);
    this.glowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    console.log('InstancedMesh objects created');
    
    this.recolor(species);
  }
  
  recolor(species: Uint8Array) {
    console.log('=== RECOLORING WITH SPECIES COLORS ===');
    console.log('Species array:', Array.from(species));
    
    // Use actual species colors from SPECIES map
    for (let i = 0; i < this.count; i++) {
      const speciesType = species[i] as Species;
      const speciesInfo = SPECIES[speciesType];
      
      // Convert hex color to THREE.Color
      const color = new THREE.Color(speciesInfo.color);
      
      console.log(`Atom ${i}: Species ${speciesType} (${speciesInfo.name}), Color: #${speciesInfo.color.toString(16)}, RGB:`, color);
      
      // Set main atom color using species color
      this.mesh.setColorAt(i, color);
      
      // Set glow color (brighter and more intense for sci-fi effect)
      const glowColor = color.clone().multiplyScalar(1.5); // Brighter glow
      this.glowMesh.setColorAt(i, glowColor);
    }
    
    // Mark instance colors as needing update
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
    if (this.glowMesh.instanceColor) {
      this.glowMesh.instanceColor.needsUpdate = true;
    }
    
    console.log('Colors set from SPECIES map using setColorAt method');
  }
  
  updateFromArray(pos: Float32Array, species: Uint8Array, visualScale: number, vel?: Float32Array) {
    // Only recolor if species have changed (for performance)
    // this.recolor(species); // Removed frequent recoloring
    
    for (let i = 0; i < this.count; i++) {
      const ix = 3*i;
      const speciesType = species[i] as Species;
      const info = SPECIES[speciesType];
      
      // Update positions
      this.dummy.position.set(pos[ix], pos[ix+1], pos[ix+2]);
      
      // Main atom scaling based on actual species radius
      const scale = (info.radius * visualScale / 0.5);
      this.dummy.scale.setScalar(scale);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
      
      // Outer glow - larger for better sci-fi effect
      this.dummy.scale.setScalar(scale * 1.8);
      this.dummy.updateMatrix();
      this.glowMesh.setMatrixAt(i, this.dummy.matrix);
    }
    
    this.mesh.instanceMatrix.needsUpdate = true;
    this.glowMesh.instanceMatrix.needsUpdate = true;
  }
}
