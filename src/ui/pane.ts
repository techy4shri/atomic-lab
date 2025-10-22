import { Pane } from 'tweakpane';
import type { Species } from '../sim/cpu/chem/species';

export interface UIParams {
  n: number;
  dt: number;
  box: number;
  cutoff: number;
  skin: number;
  temperature: number;
  restitution: number;
  enableLJ: boolean;
  bondK: number;
  enableFormation: boolean;
  spawnSpecies: Species;
  spawnCount: number;
}

export function createPane(params: UIParams, actions: {
  onReset: ()=>void;
  onSpawn: ()=>void;
}) {
  const pane = new Pane({ title: 'Atomic Lab Pro' });
  const fSim = pane.addFolder({ title: 'Simulation' });
  fSim.addBinding(params, 'n', { min: 100, max: 8000, step: 50 });
  fSim.addBinding(params, 'dt', { min: 0.0005, max: 0.01, step: 0.0005 });
  fSim.addBinding(params, 'temperature', { min: 0.1, max: 3.0, step: 0.1 });
  fSim.addBinding(params, 'box', { min: 6, max: 30, step: 1 });
  fSim.addBinding(params, 'cutoff', { min: 1.5, max: 3.0, step: 0.1 });
  fSim.addBinding(params, 'skin', { min: 0.0, max: 1.0, step: 0.05 });
  fSim.addBinding(params, 'restitution', { min: 0.5, max: 1.0, step: 0.05 });
  fSim.addBinding(params, 'enableLJ', { label: 'LJ Forces' });

  const fBond = pane.addFolder({ title: 'Bonds' });
  fBond.addBinding(params, 'enableFormation', { label: 'Form Bonds' });
  fBond.addBinding(params, 'bondK', { min: 2, max: 40, step: 1 });

  const fSpawn = pane.addFolder({ title: 'Spawn' });
  fSpawn.addBinding(params, 'spawnSpecies', { options: { H:0, O:1, C:2, Na:3, Cl:4 } });
  fSpawn.addBinding(params, 'spawnCount', { min: 1, max: 200, step: 1 });
  fSpawn.addButton({ title: 'Add' }).on('click', actions.onSpawn);

  pane.addButton({ title: 'Reset' }).on('click', actions.onReset);
  return pane;
}
