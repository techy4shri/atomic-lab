import { Pane } from 'tweakpane';
import type { Species } from '../sim/cpu/chem/species';
export interface UIParams {
  n:number; dt:number; box:number; cutoff:number; skin:number; temperature:number;
  restitution:number; enableLJ:boolean; bondK:number; enableFormation:boolean;
  substeps:number; visualScale:number; showBonds:boolean; uiScale:number;
  spawnSpecies: Species; spawnCount:number;
}
export function createPane(params: UIParams, actions: { onReset:()=>void; onSpawn:()=>void; onToggleBonds:(v:boolean)=>void; onUiScale:(s:number)=>void; }) {
  const pane = new Pane({ title: 'Atomic Lab Pro' });
  const sim = pane.addFolder({ title:'Simulation' });
  sim.addBinding(params,'n',{min:100,max:6000,step:50});
  sim.addBinding(params,'dt',{min:0.0005,max:0.01,step:0.0005});
  sim.addBinding(params,'substeps',{min:1,max:3,step:1});
  sim.addBinding(params,'temperature',{min:0.1,max:3.0,step:0.1});
  sim.addBinding(params,'box',{min:6,max:16,step:1});
  sim.addBinding(params,'cutoff',{min:1.8,max:2.8,step:0.1});
  sim.addBinding(params,'skin',{min:0.2,max:0.8,step:0.05});
  sim.addBinding(params,'restitution',{min:0.5,max:1.0,step:0.05});
  sim.addBinding(params,'enableLJ',{label:'LJ Forces'});

  const vis = pane.addFolder({ title:'Visual' });
  vis.addBinding(params,'visualScale',{min:0.8,max:2.5,step:0.1});
  vis.addBinding(params,'showBonds',{label:'Show Bonds'}).on('change', e=>actions.onToggleBonds(e.value));
  vis.addBinding(params,'uiScale',{min:0.8,max:1.8,step:0.1}).on('change', e=>actions.onUiScale(e.value));

  const bond = pane.addFolder({ title:'Bonds' });
  bond.addBinding(params,'enableFormation',{label:'Form Bonds'});
  bond.addBinding(params,'bondK',{min:2,max:40,step:1});

  const sp = pane.addFolder({ title:'Spawn' });
  sp.addBinding(params,'spawnSpecies',{options:{H:0,O:1,C:2,Na:3,Cl:4}});
  sp.addBinding(params,'spawnCount',{min:1,max:200,step:1});
  sp.addButton({title:'Add'}).on('click',actions.onSpawn);

  pane.addButton({title:'Reset'}).on('click',actions.onReset);
  return pane;
}
