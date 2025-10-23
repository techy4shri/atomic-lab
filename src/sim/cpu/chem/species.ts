export enum Species { H=0, O=1, C=2, Na=3, Cl=4 }
export interface SpeciesInfo { name:string; color:number; radius:number; sigma:number; epsilon:number; valence:number; charge:number; }
export const SPECIES: Record<Species, SpeciesInfo> = {
  [Species.H]:  { name:'H',  color:0x000003, radius:0.5,  sigma:1.0,  epsilon:0.3, valence:1, charge:0 },   // Pure blue
  [Species.O]:  { name:'O',  color:0xff0000, radius:0.6,  sigma:1.1,  epsilon:0.6, valence:2, charge:0 },   // Pure red
  [Species.C]:  { name:'C',  color:0x00ff00, radius:0.55, sigma:1.05, epsilon:0.5, valence:4, charge:0 },   // Pure green
  [Species.Na]: { name:'Na', color:0xffff00, radius:0.65, sigma:1.2,  epsilon:0.2, valence:1, charge:+1 },  // Pure yellow
  [Species.Cl]: { name:'Cl', color:0xff00ff, radius:0.65, sigma:1.2,  epsilon:0.4, valence:1, charge:-1 },  // Pure magenta
};
export function mix(i: Species, j: Species){ const si=SPECIES[i], sj=SPECIES[j];
  return { sigma:0.5*(si.sigma+sj.sigma), epsilon:Math.sqrt(si.epsilon*sj.epsilon) }; }
