import type { State } from './types';
import type { Grid } from './neighbors';
import { forEachNeighbor } from './neighbors';
import { Species, mix } from './chem/species';
import { Bonds, canFormBond, restLength } from './chem/bonds';

// Lennard-Jones with species mixing + optional bond formation
export function accumulateForcesWithNeighbors(
  state: State,
  grid: Grid,
  species: Uint8Array,
  cutoff: number,
  bonds: Bonds,
  enableLJ: boolean,
  enableFormation: boolean,
) {
  const { pos, acc } = state;
  const n = pos.length/3;
  acc.fill(0);
  const rc2 = cutoff*cutoff;

  for (let i=0;i<n;i++) {
    const ix = 3*i;
    const xi=pos[ix], yi=pos[ix+1], zi=pos[ix+2];
    const si = species[i] as Species;
    forEachNeighbor(grid, pos, i, (j)=>{
      const jx = 3*j;
      const dx = xi-pos[jx], dy = yi-pos[jx+1], dz = zi-pos[jx+2];
      const r2 = dx*dx+dy*dy+dz*dz;
      if (r2 < 1e-8 || r2 > rc2) return;

      const sj = species[j] as Species;
      const m = mix(si, sj);
      if (enableLJ) {
        const inv_r2 = 1.0 / r2;
        const sr2 = (m.sigma*m.sigma) * inv_r2;
        const sr6 = sr2*sr2*sr2;
        const sr12 = sr6*sr6;
        const fmag = 24*m.epsilon * (2*sr12 - sr6) * inv_r2;
        const fx = fmag*dx, fy=fmag*dy, fz=fmag*dz;
        acc[ix]+=fx; acc[ix+1]+=fy; acc[ix+2]+=fz;
        acc[jx]-=fx; acc[jx+1]-=fy; acc[jx+2]-=fz;
      }

      // Bond formation check (once): within threshold & valence free
      if (enableFormation && !bonds.has(i,j)) {
        const r = Math.sqrt(r2);
        const r0 = restLength(si, sj);
        if (r < 1.1*r0 && canFormBond(bonds, species, i, j)) {
          bonds.add(i,j);
        }
      }
    });
  }
}
