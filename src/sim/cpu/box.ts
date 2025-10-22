import type { State } from './types';
export function initState(n: number, box: number, temp: number): State {
  const pos = new Float32Array(3*n);
  const vel = new Float32Array(3*n);
  const acc = new Float32Array(3*n);
  for (let i=0;i<n;i++) {
    const ix=3*i;
    pos[ix+0]=(Math.random()*2-1)*(box*0.65);
    pos[ix+1]=(Math.random()*2-1)*(box*0.65);
    pos[ix+2]=(Math.random()*2-1)*(box*0.65);
    const v=Math.sqrt(temp);
    vel[ix+0]=(Math.random()*2-1)*v;
    vel[ix+1]=(Math.random()*2-1)*v;
    vel[ix+2]=(Math.random()*2-1)*v;
  }
  acc.fill(0);
  return { pos, vel, acc };
}
export function confineToBox(state: State, box: number, restitution: number) {
  const { pos, vel } = state; const n=pos.length/3;
  for (let i=0;i<n;i++) { const ix=3*i;
    for (let k=0;k<3;k++) {
      if (pos[ix+k] < -box) { pos[ix+k]=-box; vel[ix+k]=-vel[ix+k]*restitution; }
      if (pos[ix+k] >  box) { pos[ix+k]= box; vel[ix+k]=-vel[ix+k]*restitution; }
    }
  }
}
