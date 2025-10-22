export interface Grid {
  cellSize:number; invCell:number; dims:[number,number,number]; min:number;
  head:Int32Array; next:Int32Array; lastPos:Float32Array; threshold:number;
}
export function createGrid(n:number, box:number, cellSize:number, skin:number): Grid {
  const span=box*2; const nx=Math.max(1,Math.floor(span/cellSize)); const ny=nx, nz=nx;
  return { cellSize, invCell:1/cellSize, dims:[nx,ny,nz], min:-box,
    head:new Int32Array(nx*ny*nz).fill(-1), next:new Int32Array(n).fill(-1),
    lastPos:new Float32Array(3*n), threshold:Math.max(0.0001, skin*0.5) };
}
function cellIndex(g:Grid,x:number,y:number,z:number){ const nx=g.dims[0],ny=g.dims[1],nz=g.dims[2];
  let ix=Math.floor((x-g.min)*g.invCell), iy=Math.floor((y-g.min)*g.invCell), iz=Math.floor((z-g.min)*g.invCell);
  ix=Math.max(0,Math.min(nx-1,ix)); iy=Math.max(0,Math.min(ny-1,iy)); iz=Math.max(0,Math.min(nz-1,iz));
  return ix + iy*nx + iz*nx*ny;
}
export function buildGrid(g:Grid,pos:Float32Array){ g.head.fill(-1); const n=pos.length/3;
  for(let i=0;i<n;i++){ const ix=3*i; const c=cellIndex(g,pos[ix],pos[ix+1],pos[ix+2]);
    g.next[i]=g.head[c]; g.head[c]=i; g.lastPos[ix]=pos[ix]; g.lastPos[ix+1]=pos[ix+1]; g.lastPos[ix+2]=pos[ix+2]; } }
export function needRebuild(g:Grid,pos:Float32Array){ const n=pos.length/3,th=g.threshold;
  for(let i=0;i<n;i++){ const ix=3*i; const dx=pos[ix]-g.lastPos[ix], dy=pos[ix+1]-g.lastPos[ix+1], dz=pos[ix+2]-g.lastPos[ix+2];
    if (Math.abs(dx)>th||Math.abs(dy)>th||Math.abs(dz)>th) return true; } return false; }
export function forEachNeighbor(g:Grid,pos:Float32Array,i:number,fn:(j:number)=>void){
  const nx=g.dims[0],ny=g.dims[1],nz=g.dims[2]; const ix3=3*i;
  const x=pos[ix3],y=pos[ix3+1],z=pos[ix3+2];
  const cx=Math.floor((x-g.min)*g.invCell), cy=Math.floor((y-g.min)*g.invCell), cz=Math.floor((z-g.min)*g.invCell);
  for(let dz=-1;dz<=1;dz++) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    const x2=cx+dx,y2=cy+dy,z2=cz+dz; if(x2<0||y2<0||z2<0||x2>=nx||y2>=ny||z2>=nz) continue;
    const c=x2 + y2*nx + z2*nx*ny; let j=g.head[c]; while(j!==-1){ if(j>i) fn(j); j=g.next[j]; }
  }
}
