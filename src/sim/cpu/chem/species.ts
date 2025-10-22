export enum Species { H=0, O=1, C=2, Na=3, Cl=4 }

export interface SpeciesInfo {
  name: string;
  color: number;
  radius: number;   // visual radius
  sigma: number;    // reduced units-ish for toy model
  epsilon: number;
  valence: number;
  charge: number;   // for ionic demo
}

export const SPECIES: Record<Species, SpeciesInfo> = {
  [Species.H]:  { name:'H',  color:0x9ad1ff, radius:0.22, sigma:1.0,  epsilon:0.3, valence:1, charge:0 },
  [Species.O]:  { name:'O',  color:0xff6b6b, radius:0.28, sigma:1.1,  epsilon:0.6, valence:2, charge:0 },
  [Species.C]:  { name:'C',  color:0x9ea7b8, radius:0.25, sigma:1.05, epsilon:0.5, valence:4, charge:0 },
  [Species.Na]: { name:'Na', color:0x9dd49a, radius:0.30, sigma:1.2,  epsilon:0.2, valence:1, charge:+1 },
  [Species.Cl]: { name:'Cl', color:0xc3ff8f, radius:0.30, sigma:1.2,  epsilon:0.4, valence:1, charge:-1 },
};

// Lorentz-Berthelot mixing for sigma/epsilon
export function mix(i: Species, j: Species) {
  const si = SPECIES[i], sj = SPECIES[j];
  return {
    sigma: 0.5*(si.sigma + sj.sigma),
    epsilon: Math.sqrt(si.epsilon * sj.epsilon)
  };
}
