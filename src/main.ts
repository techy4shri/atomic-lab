import * as THREE from 'three';
import { createRenderer, createScene, createCamera, addBoxWire, resizeCamera } from './visual/scene';
import { AtomMesh } from './visual/atoms';
import { BondLines } from './visual/bonds';
import { initState, confineToBox } from './sim/cpu/box';
import { stepPositions, stepVelocities } from './sim/cpu/verlet';
import { createGrid, buildGrid, needRebuild } from './sim/cpu/neighbors';
import { accumulateForcesWithNeighbors } from './sim/cpu/lj_neighbor';
import { Species } from './sim/cpu/chem/species';
import { Bonds, applyBondForces, updateBonds } from './sim/cpu/chem/bonds';
import { createPane, UIParams } from './ui/pane';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const scene = createScene();
const params: UIParams = {
  n: 10, dt: 0.003, substeps: 1,
  box: 8, cutoff: 2.2, skin: 0.6,
  temperature: 1.0, restitution: 0.9, enableLJ: true,
  bondK: 12.0, enableFormation: true,
  visualScale: 1.6, showBonds: true, uiScale: 1.2,
  spawnSpecies: 0 as Species, spawnCount: 50,
};

const camera = createCamera(params.box);
const renderer = createRenderer(canvas);
addBoxWire(scene, params.box);

// Add resize handler for proper camera aspect ratio
window.addEventListener('resize', () => {
  resizeCamera(camera, renderer);
});

let state = initState(params.n, params.box, params.temperature);
let species = new Uint8Array(params.n); 

// Initialize with exactly 2 atoms of each element for demonstration
const elementTypes = [Species.H, Species.O, Species.C, Species.Na, Species.Cl];
for (let i = 0; i < params.n; i++) {
  species[i] = elementTypes[i % elementTypes.length];
}

let atoms = new AtomMesh(params.n, species);
scene.add(atoms.mesh);
scene.add(atoms.glowMesh); // Add the glow effect
const bonds = new Bonds(params.n);
const bondLines = new BondLines(6000);
scene.add(bondLines.line);

let grid = createGrid(params.n, params.box, params.cutoff + params.skin, params.skin);
buildGrid(grid, state.pos);

const pane = createPane(params, {
  onReset: reset,
  onSpawn: spawn,
  onToggleBonds: (v)=>{
    params.showBonds = v;
    if (v) scene.add(bondLines.line); else scene.remove(bondLines.line);
  },
  onUiScale: (s)=>{
    const paneDiv = document.getElementById('pane')!;
    paneDiv.style.transform = `scale(${s.toFixed(2)})`;
  }
});

function reset() {
  state = initState(params.n, params.box, params.temperature);
  species = new Uint8Array(params.n);
  
  // Re-initialize with 2 atoms of each element
  const elementTypes = [Species.H, Species.O, Species.C, Species.Na, Species.Cl];
  for (let i = 0; i < params.n; i++) {
    species[i] = elementTypes[i % elementTypes.length];
  }
  
  atoms.mesh.parent?.remove(atoms.mesh);
  atoms.glowMesh.parent?.remove(atoms.glowMesh);
  atoms = new AtomMesh(params.n, species); 
  scene.add(atoms.mesh);
  scene.add(atoms.glowMesh);
  bonds.clear();
  grid = createGrid(params.n, params.box, params.cutoff + params.skin, params.skin);
  buildGrid(grid, state.pos);
  atoms.recolor(species);
  if (params.showBonds && !scene.children.includes(bondLines.line)) scene.add(bondLines.line);
}

function spawn() {
  const add = params.spawnCount, oldN=params.n, newN=oldN+add; params.n=newN;
  const newPos=new Float32Array(3*newN), newVel=new Float32Array(3*newN), newAcc=new Float32Array(3*newN);
  newPos.set(state.pos); newVel.set(state.vel); newAcc.set(state.acc);
  const v=Math.sqrt(params.temperature);
  for (let i=oldN;i<newN;i++){ const ix=3*i;
    newPos[ix]=(Math.random()*2-1)*(params.box*0.25);
    newPos[ix+1]=(Math.random()*2-1)*(params.box*0.25);
    newPos[ix+2]=(Math.random()*2-1)*(params.box*0.25);
    newVel[ix]=(Math.random()*2-1)*v; newVel[ix+1]=(Math.random()*2-1)*v; newVel[ix+2]=(Math.random()*2-1)*v;
  }
  state={pos:newPos,vel:newVel,acc:newAcc};
  const sp2=new Uint8Array(newN); sp2.set(species); for(let i=oldN;i<newN;i++) sp2[i]=params.spawnSpecies; species=sp2;
  atoms.mesh.parent?.remove(atoms.mesh);
  atoms.glowMesh.parent?.remove(atoms.glowMesh);
  atoms = new AtomMesh(newN, species); 
  scene.add(atoms.mesh);
  scene.add(atoms.glowMesh);
  const b2 = new Bonds(newN); (bonds as any).edges.forEach((k:string)=>{ const [a,b]=k.split(',').map(Number); if(a<newN && b<newN) b2.add(a,b); });
  (bonds as any).edges = (b2 as any).edges; bonds.degree = b2.degree;
  grid = createGrid(newN, params.box, params.cutoff + params.skin, params.skin); buildGrid(grid, state.pos);
  atoms.recolor(species);
}

function countMolecules(){
  let h2o=0, co2=0, nacl=0; const adj: Map<number, number[]> = new Map();
  bonds.forEach((i,j)=>{ (adj.get(i)??adj.set(i,[]).get(i)!).push(j); (adj.get(j)??adj.set(j,[]).get(j)!).push(i); });
  adj.forEach((nbrs,i)=>{
    if (species[i]===1) { const hs=nbrs.filter(j=>species[j]===0); if(hs.length===2) h2o++; }
    if (species[i]===2) { const os=nbrs.filter(j=>species[j]===1); if(os.length===2) co2++; }
    if (species[i]===3) { const cl=nbrs.filter(j=>species[j]===4); nacl+=cl.length; }
  });
  return { h2o, co2, nacl };
}

// Enhanced camera controls with zoom
let dragging = false, lx = 0, ly = 0;
let cameraDistance = params.box * 2; // Initial camera distance
const minDistance = params.box * 0.5;
const maxDistance = params.box * 5;

function updateCameraPosition() {
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(camera.position);
  spherical.radius = cameraDistance;
  camera.position.setFromSpherical(spherical);
  camera.lookAt(0, 0, 0);
}

canvas.addEventListener('mousedown', e => { 
  dragging = true; 
  lx = e.clientX; 
  ly = e.clientY; 
});

window.addEventListener('mouseup', () => dragging = false);

window.addEventListener('mousemove', e => { 
  if (!dragging) return; 
  const dx = e.clientX - lx, dy = e.clientY - ly; 
  lx = e.clientX; 
  ly = e.clientY;
  
  const rot = new THREE.Euler(-dy * 0.005, -dx * 0.005, 0, 'YXZ'); 
  camera.position.applyEuler(rot); 
  camera.lookAt(0, 0, 0);
});

// Add zoom controls with mouse wheel
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomSpeed = 0.1;
  cameraDistance += e.deltaY * zoomSpeed * 0.01;
  cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
  updateCameraPosition();
});

// Add keyboard controls for zoom
window.addEventListener('keydown', (e) => {
  const zoomSpeed = 0.2;
  switch(e.key) {
    case '+':
    case '=':
      cameraDistance -= zoomSpeed;
      cameraDistance = Math.max(minDistance, cameraDistance);
      updateCameraPosition();
      break;
    case '-':
    case '_':
      cameraDistance += zoomSpeed;
      cameraDistance = Math.min(maxDistance, cameraDistance);
      updateCameraPosition();
      break;
  }
});

// Loop with throttles and frame rate control
let frames = 0, fps = 0, lastHUD = performance.now();
let lastFrameTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let performanceMode = false; // Toggle for extreme performance mode

function animate(currentTime: number = performance.now()) {
  // Frame rate limiting
  if (currentTime - lastFrameTime < frameInterval) {
    requestAnimationFrame(animate);
    return;
  }
  
  // Adaptive performance mode
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime > 50) performanceMode = true;
  else if (deltaTime < 25) performanceMode = false;
  
  // Adaptive substeps based on performance
  const adaptiveSubsteps = performanceMode ? 1 : (deltaTime > 33 ? 1 : params.substeps);
  
  // Skip expensive operations in performance mode
  const skipForces = performanceMode && frames % 2 === 0;
  const skipBonds = performanceMode && frames % 4 !== 0;
  
  for (let s = 0; s < adaptiveSubsteps; s++) {
    stepPositions(state, params.dt);
    confineToBox(state, params.box, params.restitution);
    if (needRebuild(grid, state.pos)) buildGrid(grid, state.pos);
    if (!skipForces) {
      accumulateForcesWithNeighbors(state, grid, species, params.cutoff, bonds, params.enableLJ, params.enableFormation);
      applyBondForces(state, bonds, species, params.bondK);
      if (!skipBonds) updateBonds(state, bonds, species);
    }
    stepVelocities(state, params.dt);
  }
  
  // Update visuals - reduce frequency in performance mode
  if (!performanceMode || frames % 2 === 0) {
    atoms.updateFromArray(state.pos, species, params.visualScale, state.vel);
  }
  
  // Update bond lines even less frequently
  if (params.showBonds && frames % (performanceMode ? 6 : 3) === 0) {
    bondLines.updateFromBonds(bonds, state.pos);
  }
  
  renderer.render(scene, camera);

  frames++; 
  const now = performance.now();
  if (now - lastHUD > 500) { 
    fps = Math.round(frames * 1000 / (now - lastHUD)); 
    frames = 0; 
    lastHUD = now;
    const { h2o, co2, nacl } = countMolecules();
    const modeText = performanceMode ? ' (Performance Mode)' : '';
    const zoomLevel = ((maxDistance - cameraDistance) / (maxDistance - minDistance) * 100).toFixed(0);
    hud.innerHTML = `Atoms: ${params.n} | FPS: ${fps}${modeText}<br/>Zoom: ${zoomLevel}% | Bonds: ${Array.from((bonds as any).edges).length}<br/>H₂O: ${h2o} | CO₂: ${co2} | NaCl: ${nacl}`;
  }
  
  lastFrameTime = currentTime;
  requestAnimationFrame(animate);
}
animate();
