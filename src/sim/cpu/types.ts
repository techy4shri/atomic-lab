export type Vec3 = [number, number, number];

export interface SimParams {
  n: number;
  dt: number;
  box: number; // half-size
  temperature: number;
  cutoff: number;
  skin: number;
  restitution: number;
}

export interface LJParams {
  sigma: number;
  epsilon: number;
}

export interface State {
  pos: Float32Array; // 3n
  vel: Float32Array; // 3n
  acc: Float32Array; // 3n
}
