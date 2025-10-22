import * as THREE from 'three';
import { createRenderer, createScene, createCamera, addBoxWire } from './visual/scene';
import { AtomMesh } from './visual/atoms';
import { BondLines } from './visual/bonds';
import { initState, confineToBox } from './sim/cpu/box';
import { stepPositions, stepVelocities } from './sim/cpu/verlet';
import { createGrid, buildGrid } from './sim/cpu/neighbors';
import { accumulateForcesWithNeighbors } from './sim/cpu/lj_neighbor';
import { Species, SPECIES } from './sim/cpu/chem/species';
import { Bonds, applyBondForces, updateBonds } from './sim/cpu/chem/bonds';
import { createPane, UIParams } from './ui/pane';

const canvas = document.getElementById('app') as HTMLCanvasElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const renderer = createRenderer(canvas);
const scene = createScene();
const camera = createCamera();
addBoxWire(scene, 12);

const params: UIParams = {
  n: 800,
  dt: 0.003,
  box: 12,
  temperature: 1.0,
  cutoff: 2.5,
  skin: 0.4,
  restitution: 0.9,
  enableLJ: true,
  bondK: 12.0,
  enableFormation: true,
  spawnSpecies: 0 as Species,
  spawnCount: 50,
};

let state = initState(params.n, params.box, params.temperature);
let species = new Uint8Array(params.n);
species.fill(Species.H);

// Visuals
let atoms = new AtomMesh(params.n, species);
scene.add(atoms.mesh);
const bonds = new Bonds(params.n);
const bondLines = new BondLines(10000);
scene.add(bondLines.line);

// Grid
let grid = createGrid(params.n, params.box, params.cutoff + params.skin);
buildGrid(grid, state.pos);

// UI
const pane = createPane(params, { onReset: reset, onSpawn: spawn });
function reset() {
  state = initState(params.n, params.box, params.temperature);
  species = new Uint8Array(params.n); species.fill(Species.H);
  atoms.mesh.parent?.remove(atoms.mesh);
  atoms = new AtomMesh(params.n, species);
  scene.add(atoms.mesh);
  bonds.clear();
  bondLines.updateFromBonds(bonds, state.pos);
  grid = createGrid(params.n, params.box, params.cutoff + params.skin);
  buildGrid(grid, state.pos);
}
function spawn() {
  // append new particles (reallocate state & species)
  const add = params.spawnCount;
  const oldN = params.n;
  const newN = oldN + add;
  params.n = newN;
  const newPos = new Float32Array(3*newN);
  const newVel = new Float32Array(3*newN);
  const newAcc = new Float32Array(3*newN);
  newPos.set(state.pos); newVel.set(state.vel); newAcc.set(state.acc);
  // place near center
  for (let i=oldN;i<newN;i++) {
    const ix = 3*i;
    newPos[ix+0] = (Math.random()*2-1)* (params.box*0.3);
    newPos[ix+1] = (Math.random()*2-1)* (params.box*0.3);
    newPos[ix+2] = (Math.random()*2-1)* (params.box*0.3);
    const v = Math.sqrt(params.temperature);
    newVel[ix+0] = (Math.random()*2-1)*v;
    newVel[ix+1] = (Math.random()*2-1)*v;
    newVel[ix+2] = (Math.random()*2-1)*v;
  }
  state = { pos: newPos, vel: newVel, acc: newAcc };

  const newSpecies = new Uint8Array(newN);
  newSpecies.set(species);
  for (let i=oldN;i<newN;i++) newSpecies[i] = params.spawnSpecies;
  species = newSpecies;

  // visuals
  atoms.mesh.parent?.remove(atoms.mesh);
  atoms = new AtomMesh(newN, species);
  scene.add(atoms.mesh);

  // bonds/grid resize
  const b2 = new Bonds(newN);
  bonds.forEach((i,j)=>{ if (i<newN && j<newN) b2.add(i,j); });
  (bonds as any).edges = (b2 as any).edges;
  bonds.degree = b2.degree;
  grid = createGrid(newN, params.box, params.cutoff + params.skin);
  buildGrid(grid, state.pos);
}

// Molecule counts (simple patterns)
function countMolecules() {
  // H2O: O with two H bonds
  let h2o = 0, co2=0, nacl=0;
  // adjacency map
  const adj: Map<number, number[]> = new Map();
  bonds.forEach((i,j)=>{
    (adj.get(i) ?? adj.set(i,[]).get(i)!).push(j);
    (adj.get(j) ?? adj.set(j,[]).get(j)!).push(i);
  });
  adj.forEach((nbrs, i)=>{
    const si = species[i] as Species;
    if (si === Species.O) {
      const hs = nbrs.filter(j => species[j]===Species.H);
      if (hs.length===2) h2o++;
    }
    if (si === Species.C) {
      const os = nbrs.filter(j => species[j]===Species.O);
      if (os.length===2) co2++;
    }
    if (si === Species.Na) {
      const cl = nbrs.filter(j => species[j]===Species.Cl);
      nacl += cl.length;
    }
  });
  // NaCl pairs counted from Na side; ok. hardcoded for now, gotta think of dynamic species list later
  return { h2o, co2, nacl };
}

// Minimal orbit control
let isDragging=false, lastX=0, lastY=0;
canvas.addEventListener('mousedown', (e)=>{ isDragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener('mouseup', ()=> isDragging=false);
window.addEventListener('mousemove', (e)=>{
  if (!isDragging) return;
  const dx=e.clientX-lastX, dy=e.clientY-lastY;
  lastX=e.clientX; lastY=e.clientY;
  const rot = new THREE.Euler(-dy*0.005, -dx*0.005, 0, 'YXZ');
  camera.position.applyEuler(rot);
  camera.lookAt(0,0,0);
});

// Main loop
const clock = new THREE.Clock();
let accum=0, frames=0, fps=0; let tLast=performance.now(); // this is probably why my fps is off on first run

function animate() {
  const dtReal = clock.getDelta();
  const sub = 3; // constant substepping
  for (let i=0;i<sub;i++) {
    // half step
    stepPositions(state, params.dt);
    confineToBox(state, params.box, params.restitution);

    // rebuild grid each substep (can be optimized with skin later)
    grid = createGrid(params.n, params.box, params.cutoff + params.skin);
    buildGrid(grid, state.pos);

    // LJ + optional bond formation
    accumulateForcesWithNeighbors(state, grid, species, params.cutoff, bonds, params.enableLJ, params.enableFormation);
    // Bond forces & bookkeeping
    applyBondForces(state, bonds, species, params.bondK);
    updateBonds(state, bonds, species);

    // second half
    stepVelocities(state, params.dt);
  }

  atoms.recolor(species);
  atoms.updateFromArray(state.pos, species);
  bondLines.updateFromBonds(bonds, state.pos);
  renderer.render(scene, camera);

  // HUD
  frames++; const now = performance.now();
  if (now - tLast > 500) {
    fps = Math.round(frames * 1000 / (now - tLast));
    frames = 0; tLast = now;
    const {h2o, co2, nacl} = countMolecules();
    hud.className = 'card';
    hud.innerHTML = `Atoms: ${params.n} &nbsp; FPS: ${fps}<br/>Bonds: ${Array.from((bonds as any).edges).length}<br/>H₂O: ${h2o} &nbsp; CO₂: ${co2} &nbsp; NaCl: ${nacl}`;
  }

  requestAnimationFrame(animate);
}
animate();
