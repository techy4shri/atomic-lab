import * as THREE from 'three';
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    powerPreference: 'high-performance',
    alpha: true
  });
  // Enable better rendering for glow effects
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = false; // Disable for performance
  return renderer;
}
export function createScene() {
  const scene = new THREE.Scene();
  
  // Sci-fi gradient background
  const loader = new THREE.TextureLoader();
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Create animated gradient background
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, '#0a0d1a');
  gradient.addColorStop(0.5, '#051018');
  gradient.addColorStop(1, '#020408');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  const texture = new THREE.CanvasTexture(canvas);
  scene.background = texture;
  
  // Enhanced lighting for better color visibility
  const ambient = new THREE.AmbientLight(0xffffff, 0.8); // Brighter ambient light
  scene.add(ambient);
  
  // Main directional light - bright white
  const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
  light1.position.set(5, 8, 5);
  scene.add(light1);
  
  // Fill light to reduce shadows
  const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
  light2.position.set(-5, 3, -5);
  scene.add(light2);
  
  // Dramatic fog for depth
  scene.fog = new THREE.Fog(0x020408, 15, 60);
  
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
  
  // Create glowing sci-fi container
  const material = new THREE.LineBasicMaterial({ 
    color: 0x00ffff, 
    transparent: true, 
    opacity: 0.8,
    linewidth: 2,
    blending: THREE.AdditiveBlending

  });
  
  const wireframe = new THREE.LineSegments(edges, material);
  scene.add(wireframe);
  
  // Add inner glow effect
  const glowMaterial = new THREE.LineBasicMaterial({
    color: 0x88ffff,
    transparent: true,
    opacity: 0.3
  });
  
  const glowGeometry = new THREE.BoxGeometry(half*2.02, half*2.02, half*2.02);
  const glowEdges = new THREE.EdgesGeometry(glowGeometry);
  const glowWireframe = new THREE.LineSegments(glowEdges, glowMaterial);
  scene.add(glowWireframe);
}
