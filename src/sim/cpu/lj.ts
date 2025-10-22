import type { State, SimParams } from './types';

// Simple O(N^2) Lennard-Jones forces with cutoff. Adequate for ~500-1000 atoms.
// Use GPU or neighbor lists later for larger N.
export function accumulateLJForces(state: State, p: SimParams) {
  if (!p.useLJ) {
    state.acc.fill(0);
    return;
  }
  const { pos, acc } = state;
  const { n, cutoff, epsilon, sigma } = p;
  acc.fill(0);
  const rc2 = cutoff * cutoff;
  const s2 = sigma * sigma;

  for (let i = 0; i < n; i++) {
    const ix = 3*i;
    const xi = pos[ix], yi = pos[ix+1], zi = pos[ix+2];
    for (let j = i + 1; j < n; j++) {
      const jx = 3*j;
      const dx = xi - pos[jx];
      const dy = yi - pos[jx+1];
      const dz = zi - pos[jx+2];
      const r2 = dx*dx + dy*dy + dz*dz;
      if (r2 < rc2 && r2 > 1e-8) {
        // LJ force magnitude: 24*epsilon * (2*(sigma/r)^12 - (sigma/r)^6) / r^2 * r_vec
        const inv_r2 = 1.0 / r2;
        const sr2 = s2 * inv_r2;
        const sr6 = sr2 * sr2 * sr2;
        const sr12 = sr6 * sr6;
        const fmag = 24 * epsilon * (2*sr12 - sr6) * inv_r2;
        const fx = fmag * dx;
        const fy = fmag * dy;
        const fz = fmag * dz;
        acc[ix]   += fx; acc[ix+1] += fy; acc[ix+2] += fz;
        acc[jx]   -= fx; acc[jx+1] -= fy; acc[jx+2] -= fz;
      }
    }
  }
}
