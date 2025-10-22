// Uniform grid / cell list neighbor search
export interface Grid {
  cellSize: number;
  invCell: number;
  dims: [number, number, number];
  min: number; // -box
  head: Int32Array; // head index per cell
  next: Int32Array; // next index per particle
}

export function createGrid(n: number, box: number, cellSize: number): Grid {
  const span = box*2;
  const nx = Math.max(1, Math.floor(span / cellSize));
  const ny = nx, nz = nx; // cubic
  const cells = nx*ny*nz;
  return {
    cellSize,
    invCell: 1/cellSize,
    dims: [nx, ny, nz],
    min: -box,
    head: new Int32Array(cells).fill(-1),
    next: new Int32Array(n).fill(-1),
  };
}

function cellIndex(g: Grid, x: number, y: number, z: number): number {
  const nx = g.dims[0], ny = g.dims[1], nz = g.dims[2];
  let ix = Math.floor((x - g.min) * g.invCell);
  let iy = Math.floor((y - g.min) * g.invCell);
  let iz = Math.floor((z - g.min) * g.invCell);
  ix = Math.max(0, Math.min(nx-1, ix));
  iy = Math.max(0, Math.min(ny-1, iy));
  iz = Math.max(0, Math.min(nz-1, iz));
  return ix + iy*nx + iz*nx*ny;
}

export function buildGrid(g: Grid, pos: Float32Array) {
  g.head.fill(-1);
  const n = pos.length/3;
  for (let i=0;i<n;i++) {
    const ix = 3*i;
    const c = cellIndex(g, pos[ix], pos[ix+1], pos[ix+2]);
    g.next[i] = g.head[c];
    g.head[c] = i;
  }
}

export function forEachNeighbor(g: Grid, pos: Float32Array, i: number, fn: (j:number)=>void) {
  const nx = g.dims[0], ny = g.dims[1], nz = g.dims[2];
  const ix3 = 3*i;
  const x = pos[ix3], y = pos[ix3+1], z = pos[ix3+2];
  const cx = Math.floor((x - g.min) * g.invCell);
  const cy = Math.floor((y - g.min) * g.invCell);
  const cz = Math.floor((z - g.min) * g.invCell);
  for (let dz=-1; dz<=1; dz++) {
    for (let dy=-1; dy<=1; dy++) {
      for (let dx=-1; dx<=1; dx++) {
        const x2 = cx+dx, y2 = cy+dy, z2 = cz+dz;
        if (x2<0||y2<0||z2<0||x2>=nx||y2>=ny||z2>=nz) continue;
        const c = x2 + y2*nx + z2*nx*ny;
        let j = g.head[c];
        while (j !== -1) {
          if (j>i) fn(j); // ensure pair once
          j = g.next[j];
        }
      }
    }
  }
}
