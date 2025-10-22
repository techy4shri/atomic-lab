export interface SimParams {
  n: number; dt: number; box: number; cutoff: number; skin: number;
  temperature: number; restitution: number; enableLJ: boolean;
  bondK: number; enableFormation: boolean; substeps: number;
  visualScale: number; showBonds: boolean; uiScale: number;
}
export interface State { pos: Float32Array; vel: Float32Array; acc: Float32Array; }
