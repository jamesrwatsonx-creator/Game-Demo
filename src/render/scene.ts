import * as THREE from "three";

export interface SceneRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  cameraHeadOn: THREE.PerspectiveCamera;
  cameraP1: THREE.PerspectiveCamera;
  cameraP2: THREE.PerspectiveCamera;
  resize(): void;
}

const BG_COLOR = 0x050510;
const FOG_COLOR = 0x0a0a20;

export function createSceneRig(container: HTMLElement): SceneRig {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(BG_COLOR, 1);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(FOG_COLOR, 20, 120);

  const ambient = new THREE.AmbientLight(0x8888ff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(6, 14, 8);
  scene.add(sun);
  const rim = new THREE.PointLight(0x00e5ff, 1.2, 40);
  rim.position.set(0, 6, 0);
  scene.add(rim);

  const cameraHeadOn = new THREE.PerspectiveCamera(62, 1, 0.1, 300);
  const cameraP1 = new THREE.PerspectiveCamera(68, 1, 0.1, 300);
  const cameraP2 = new THREE.PerspectiveCamera(68, 1, 0.1, 300);

  function resize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    for (const cam of [cameraHeadOn, cameraP1, cameraP2]) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }

  window.addEventListener("resize", resize);
  resize();

  return { renderer, scene, cameraHeadOn, cameraP1, cameraP2, resize };
}
