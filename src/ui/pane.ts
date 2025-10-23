import { Pane } from 'tweakpane';
import type { Species } from '../sim/cpu/chem/species';

export interface UIParams {
  n:number; dt:number; box:number; cutoff:number; skin:number; temperature:number;
  restitution:number; enableLJ:boolean; bondK:number; enableFormation:boolean;
  substeps:number; visualScale:number; showBonds:boolean; uiScale:number;
  spawnSpecies: Species; spawnCount:number;
}

export interface StatsData {
  fps: number;
  atomCount: number;
  bondCount: number;
  h2o: number;
  co2: number;
  nacl: number;
  zoomLevel: number;
  performanceMode: boolean;
  frameTime: number;
  temperature: number;
  totalEnergy: number;
}



export function createPane(params: UIParams, actions: { onReset:()=>void; onSpawn:()=>void; onToggleBonds:(v:boolean)=>void; onUiScale:(s:number)=>void; }) {
  const pane = new Pane({ title: 'Atomic Lab Pro' });
  
  // Simulation parameters
  (pane as any).addBinding(params,'n',{min:100,max:6000,step:50});
  (pane as any).addBinding(params,'dt',{min:0.0005,max:0.01,step:0.0005});
  (pane as any).addBinding(params,'substeps',{min:1,max:3,step:1});
  (pane as any).addBinding(params,'temperature',{min:0.1,max:3.0,step:0.1});
  (pane as any).addBinding(params,'box',{min:6,max:16,step:1});
  (pane as any).addBinding(params,'cutoff',{min:1.8,max:2.8,step:0.1});
  (pane as any).addBinding(params,'skin',{min:0.2,max:0.8,step:0.05});
  (pane as any).addBinding(params,'restitution',{min:0.5,max:1.0,step:0.05});
  (pane as any).addBinding(params,'enableLJ',{label:'LJ Forces'});

  // Visual parameters
  (pane as any).addBinding(params,'visualScale',{min:0.8,max:2.5,step:0.1});
  (pane as any).addBinding(params,'showBonds',{label:'Show Bonds'}).on('change', (e: any)=>actions.onToggleBonds(e.value));
  (pane as any).addBinding(params,'uiScale',{min:0.8,max:1.8,step:0.1}).on('change', (e: any)=>actions.onUiScale(e.value));

  // Bond parameters
  (pane as any).addBinding(params,'enableFormation',{label:'Form Bonds'});
  (pane as any).addBinding(params,'bondK',{min:2,max:40,step:1});

  // Spawn parameters
  (pane as any).addBinding(params,'spawnSpecies',{options:{H:0,O:1,C:2,Na:3,Cl:4}});
  (pane as any).addBinding(params,'spawnCount',{min:1,max:200,step:1});
  (pane as any).addButton({title:'Add'}).on('click',actions.onSpawn);

  (pane as any).addButton({title:'Reset'}).on('click',actions.onReset);
  return pane;
}

export function createStatsPane(stats: StatsData) {
  const statsPane = new Pane({ 
    title: 'System Monitor',
    expanded: true
  });
  
  // Performance Stats folder
  const perfFolder = statsPane.addFolder({ title: 'Performance', expanded: true });
  (perfFolder as any).addBinding(stats, 'fps', { readonly: true, label: 'FPS' });
  (perfFolder as any).addBinding(stats, 'frameTime', { readonly: true, label: 'Frame Time (ms)', format: (v: number) => `${v.toFixed(1)}ms` });
  (perfFolder as any).addBinding(stats, 'performanceMode', { readonly: true, label: 'Performance Mode' });
  
  // System Stats folder
  const systemFolder = statsPane.addFolder({ title: 'System Stats', expanded: true });
  (systemFolder as any).addBinding(stats, 'atomCount', { readonly: true, label: 'Atoms' });
  (systemFolder as any).addBinding(stats, 'bondCount', { readonly: true, label: 'Bonds' });
  (systemFolder as any).addBinding(stats, 'zoomLevel', { readonly: true, label: 'Zoom %', format: (v: number) => `${v.toFixed(0)}%` });
  
  // Chemistry Stats folder
  const chemFolder = statsPane.addFolder({ title: 'Molecules', expanded: true });
  (chemFolder as any).addBinding(stats, 'h2o', { readonly: true, label: 'H₂O' });
  (chemFolder as any).addBinding(stats, 'co2', { readonly: true, label: 'CO₂' });
  (chemFolder as any).addBinding(stats, 'nacl', { readonly: true, label: 'NaCl' });
  
  // Physics Stats folder
  const physicsFolder = statsPane.addFolder({ title: 'Physics', expanded: false });
  (physicsFolder as any).addBinding(stats, 'temperature', { readonly: true, label: 'Temperature', format: (v: number) => `${v.toFixed(2)}K` });
  (physicsFolder as any).addBinding(stats, 'totalEnergy', { readonly: true, label: 'Total Energy', format: (v: number) => `${v.toFixed(1)}J` });
  
  return statsPane;
}
