import type { State } from '../types';
import { Species, SPECIES, mix } from './species';

export interface BondParams {
  k: number;       // spring constant
  breakRatio: number; // break if r > breakRatio * r0
}

export class Bonds {
  // Simple edge set "i,j" with i<j for uniqueness
  edges = new Set<string>();
  // For quick degree/valence tracking
  degree: Uint16Array;
  constructor(public n: number) {
    this.degree = new Uint16Array(n);
  }
  has(i:number, j:number) { if (i>j) [i,j]=[j,i]; return this.edges.has(`${i},${j}`); }
  add(i:number, j:number) {
    if (i>j) [i,j]=[j,i];
    if (this.edges.has(`${i},${j}`)) return false;
    this.edges.add(`${i},${j}`);
    this.degree[i]++; this.degree[j]++;
    return true;
  }
  remove(i:number, j:number) {
    if (i>j) [i,j]=[j,i];
    if (this.edges.delete(`${i},${j}`)) { this.degree[i]--; this.degree[j]--; }
  }
  forEach(fn:(i:number,j:number)=>void) {
    for (const key of this.edges) {
      const [a,b] = key.split(',').map(Number);
      fn(a,b);
    }
  }
  clear() { this.edges.clear(); this.degree.fill(0); }
}

// Decide if we can form a bond given species & valence limits
export function canFormBond(bonds: Bonds, species: Uint8Array, i: number, j: number): boolean {
  const si = species[i] as Species, sj = species[j] as Species;
  const vi = SPECIES[si].valence, vj = SPECIES[sj].valence;
  if (bonds.degree[i] >= vi) return false;
  if (bonds.degree[j] >= vj) return false;
  return true;
}

// Rest length per pair (toy): 1.0 * mixed sigma
export function restLength(si: Species, sj: Species) {
  return mix(si, sj).sigma * 1.0;
}

// Attempt formation & breaking based on distance thresholds
export function updateBonds(state: State, bonds: Bonds, species: Uint8Array, formTol=1.1, params?: Partial<BondParams>) {
  const { pos } = state;
  const n = pos.length/3;
  const k = params?.k ?? 10.0;
  const breakRatio = params?.breakRatio ?? 1.5;

  // Break stretched bonds
  const toRemove: Array<[number,number]> = [];
  bonds.forEach((i,j)=>{
    const ix=3*i, jx=3*j;
    const dx = pos[ix]-pos[jx], dy = pos[ix+1]-pos[jx+1], dz = pos[ix+2]-pos[jx+2];
    const r = Math.sqrt(dx*dx+dy*dy+dz*dz);
    const r0 = restLength(species[i] as any, species[j] as any);
    if (r > breakRatio * r0) toRemove.push([i,j]);
  });
  for (const [i,j] of toRemove) bonds.remove(i,j);

  // Formation pass is handled in force loop where we already inspect neighbors (to avoid extra loops)
}

// Apply harmonic spring forces for all bonds
export function applyBondForces(state: State, bonds: Bonds, species: Uint8Array, k=10.0) {
  const { pos, acc } = state;
  bonds.forEach((i,j)=>{
    const ix=3*i, jx=3*j;
    const dx = pos[ix]-pos[jx], dy = pos[ix+1]-pos[jx+1], dz = pos[ix+2]-pos[jx+2];
    const r2 = dx*dx+dy*dy+dz*dz;
    if (r2 < 1e-8) return;
    const r = Math.sqrt(r2);
    const r0 = restLength(species[i] as any, species[j] as any);
    const x = r - r0;
    const fmag = -k * x / r;
    const fx = fmag*dx, fy=fmag*dy, fz=fmag*dz;
    acc[ix]+=fx; acc[ix+1]+=fy; acc[ix+2]+=fz;
    acc[jx]-=fx; acc[jx+1]-=fy; acc[jx+2]-=fz;
  });
}
