export enum Species { H=0, O=1, C=2, Na=3, Cl=4 }
export interface SpeciesInfo { name:string; color:number; radius:number; sigma:number; epsilon:number; valence:number; charge:number; }
export const SPECIES: Record<Species, SpeciesInfo> = {
  [Species.H]:  { name:'H',  color:0x00ffff, radius:0.5,  sigma:1.0,  epsilon:0.3, valence:1, charge:0 },   // Bright cyan
  [Species.O]:  { name:'O',  color:0xff0080, radius:0.6,  sigma:1.1,  epsilon:0.6, valence:2, charge:0 },   // Hot pink
  [Species.C]:  { name:'C',  color:0x8800ff, radius:0.55, sigma:1.05, epsilon:0.5, valence:4, charge:0 },   // Purple
  [Species.Na]: { name:'Na', color:0x00ff40, radius:0.65, sigma:1.2,  epsilon:0.2, valence:1, charge:+1 },  // Neon green
  [Species.Cl]: { name:'Cl', color:0xffff00, radius:0.65, sigma:1.2,  epsilon:0.4, valence:1, charge:-1 },  // Electric yellow
};
export function mix(i: Species, j: Species){ const si=SPECIES[i], sj=SPECIES[j];
  return { sigma:0.5*(si.sigma+sj.sigma), epsilon:Math.sqrt(si.epsilon*sj.epsilon) }; }
