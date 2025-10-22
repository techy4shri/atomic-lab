import * as THREE from 'three';
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // cap pixel ratio for perf
  renderer.setPixelRatio(1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Enable frustum culling for better performance
  renderer.sortObjects = false;
  return renderer;
}
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.add(new THREE.AmbientLight(0x9bbcff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9); dir.position.set(5,8,5); scene.add(dir);
  return scene;
}
export function createCamera(boxHalf:number) {
  const cam = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  cam.position.set(0, boxHalf*0.8, boxHalf*1.6);
  cam.lookAt(0, 0, 0);
  return cam;
}

export function resizeCamera(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
export function addBoxWire(scene: THREE.Scene, half=8) {
  const g = new THREE.BoxGeometry(half*2, half*2, half*2);
  const edges = new THREE.EdgesGeometry(g);
  const m = new THREE.LineBasicMaterial({ color: 0x354062, transparent: true, opacity: 0.6 });
  scene.add(new THREE.LineSegments(edges, m));
}
