import type { State } from '../types';
import { Species, SPECIES, mix } from './species';
export class Bonds {
  edges = new Set<string>(); degree: Uint16Array;
  constructor(public n:number){ this.degree=new Uint16Array(n); }
  has(i:number,j:number){ if(i>j)[i,j]=[j,i]; 
    return this.edges.has(`${i},${j}`); 
  }
  add(i:number,j:number){ if(i>j)[i,j]=[j,i]; 
    if(this.edges.has(`${i},${j}`)) return false; 
    this.edges.add(`${i},${j}`); 
    this.degree[i]++; 
    this.degree[j]++; 
    return true; 
  }
  remove(i:number,j:number){ 
    if(i>j)[i,j]=[j,i]; 
    if(this.edges.delete(`${i},${j}`)){ 
      this.degree[i]--; this.degree[j]--; 
    } 
  }
  forEach(fn:(i:number,j:number)=>void){ 
    for(const k of this.edges){ 
      const [a,b]=k.split(',').map(Number); fn(a,b);
    } 
  }
  clear(){ this.edges.clear(); this.degree.fill(0); }
}
export function canFormBond(bonds:Bonds, species:Uint8Array, i:number,j:number){ 
  const vi=SPECIES[species[i] as Species].valence; const vj=SPECIES[species[j] as Species].valence;
  return bonds.degree[i]<vi && bonds.degree[j]<vj;
}
export function restLength(si: Species, sj: Species){ return mix(si,sj).sigma * 1.0; }
export function updateBonds(state: State, bonds:Bonds, species:Uint8Array, breakRatio=1.5){
  const { pos } = state; const rm:Array<[number,number]> = [];
  bonds.forEach((i,j)=>{ const ix=3*i,jx=3*j;
    const dx=pos[ix]-pos[jx], dy=pos[ix+1]-pos[jx+1], dz=pos[ix+2]-pos[jx+2];
    const r=Math.sqrt(dx*dx+dy*dy+dz*dz); const r0=restLength(species[i] as any, species[j] as any);
    if (r>breakRatio*r0) rm.push([i,j]);
  });
  for (const e of rm) bonds.remove(e[0], e[1]);
}
export function applyBondForces(state: State, bonds:Bonds, species:Uint8Array, k=10.0){
  const { pos, acc } = state;
  bonds.forEach((i,j)=>{ const ix=3*i, jx=3*j;
    const dx=pos[ix]-pos[jx], dy=pos[ix+1]-pos[jx+1], dz=pos[ix+2]-pos[jx+2];
    const r2=dx*dx+dy*dy+dz*dz; if(r2<1e-8) return; const r=Math.sqrt(r2);
    const r0=restLength(species[i] as any, species[j] as any); const x=r-r0;
    const fmag = -k * x / r; const fx=fmag*dx, fy=fmag*dy, fz=fmag*dz;
    acc[ix]+=fx; acc[ix+1]+=fy; acc[ix+2]+=fz; acc[jx]-=fx; acc[jx+1]-=fy; acc[jx+2]-=fz;
  });
}
