import type { State } from './types';

export function stepPositions(state: State, dt: number) {
  const { pos, vel, acc } = state;
  const n3 = pos.length;
  const half = dt * 0.5;
  for (let i=0;i<n3;i++) {
    vel[i] += acc[i] * half;
    pos[i] += vel[i] * dt;
  }
}

export function stepVelocities(state: State, dt: number) {
  const { vel, acc } = state;
  const n3 = vel.length;
  const half = dt * 0.5;
  for (let i=0;i<n3;i++) {
    vel[i] += acc[i] * half;
  }
}
