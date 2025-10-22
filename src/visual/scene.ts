import * as THREE from 'three';

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  resize(renderer);
  window.addEventListener('resize', () => resize(renderer));
  return renderer;
}
function resize(renderer: THREE.WebGLRenderer) {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w,h);
}
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  const amb = new THREE.AmbientLight(0x88aaff, 0.6);
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(5,8,5);
  scene.add(amb, dir);
  scene.fog = new THREE.Fog(0x05060a, 30, 80);
  return scene;
}
export function createCamera() {
  const cam = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 200);
  cam.position.set(0, 12, 22);
  return cam;
}
export function addBoxWire(scene: THREE.Scene, half=10) {
  const g = new THREE.BoxGeometry(half*2, half*2, half*2);
  const edges = new THREE.EdgesGeometry(g);
  const m = new THREE.LineBasicMaterial({ color: 0x2a3350, transparent: true, opacity: 0.6 });
  scene.add(new THREE.LineSegments(edges, m));
}
