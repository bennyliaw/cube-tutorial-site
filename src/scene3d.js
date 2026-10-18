// three.js view of an engine cube. Frame-pure: give it a cube state and an
// optional in-progress turn {m, angle}; it rebuilds the meshes. Used by the
// case videos, the splash and the live app.
import * as THREE from '../vendor/three.module.js';
import { moveSpec } from './cube.js';

export const COLOURS = { Y: 0xffd60a, W: 0xf5f7fa, G: 0x16c172, B: 0x3a7bff, O: 0xff8a1f, R: 0xf0334b };
const AX = { x: 0, y: 1, z: 2 };

function roundedRect(w, r) {
  const s = new THREE.Shape();
  const h = w / 2;
  s.moveTo(-h + r, -h);
  s.lineTo(h - r, -h); s.quadraticCurveTo(h, -h, h, -h + r);
  s.lineTo(h, h - r); s.quadraticCurveTo(h, h, h - r, h);
  s.lineTo(-h + r, h); s.quadraticCurveTo(-h, h, -h, h - r);
  s.lineTo(-h, -h + r); s.quadraticCurveTo(-h, -h, -h + r, -h);
  return new THREE.ShapeGeometry(s, 6);
}

export function createView(canvas, { width, height, camera = [5.6, 5.0, 7.2], fov = 28, target = [0, 0.15, 0] } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(fov, width / height, 0.1, 100);
  cam.position.set(...camera);
  cam.lookAt(...target);
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x8a6cff, 1.6); rim.position.set(-6, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x4fd1ff, 0.7); fill.position.set(-4, -3, 5); scene.add(fill);

  const body = new THREE.BoxGeometry(0.97, 0.97, 0.97);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0d0f16, roughness: 0.45, metalness: 0.2 });
  const sticker = roundedRect(0.84, 0.12);
  const dim = new THREE.MeshStandardMaterial({ color: 0x2a3350, roughness: 0.6, metalness: 0.0 });
  const mats = Object.fromEntries(Object.entries(COLOURS).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.0, emissive: c, emissiveIntensity: 0.1 })]));
  const root = new THREE.Group();
  scene.add(root);

  function cubieMesh(q, keep) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(body, bodyMat));
    for (const s of q.stickers) {
      const m = new THREE.Mesh(sticker, !keep || keep(q, s) ? mats[s.c] : dim);
      const n = new THREE.Vector3(...s.n);
      m.position.copy(n.clone().multiplyScalar(0.487));
      m.lookAt(n.clone().multiplyScalar(2));
      g.add(m);
    }
    g.position.set(...q.pos);
    return g;
  }

  // turn: { m: 'R', angle: radians } rotates the cubies that move m selects.
  // keep(q, s) -> false draws that sticker grey (see caseFocus in draw.js).
  // orbit [tilt, spin]: spin about the vertical axis, then tilt about the
  // screen's horizontal axis, so a drag moves the cube the way the hand does.
  const right = new THREE.Vector3().subVectors(cam.position, new THREE.Vector3(...target)).cross(new THREE.Vector3(0, 1, 0)).normalize().negate();
  function draw(cube, { turn = null, rotation = [0, 0, 0], orbit = null, scale = 1, keep = null } = {}) {
    root.clear();
    if (orbit) root.quaternion.setFromAxisAngle(right, orbit[0]).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), orbit[1]));
    else root.rotation.set(...rotation);
    root.scale.setScalar(scale);
    const spin = new THREE.Group();
    root.add(spin);
    let sel = () => false;
    if (turn) {
      const { axis, layers, sign } = moveSpec(turn.m);
      sel = (q) => layers.includes(q.pos[AX[axis]]);
      const v = [0, 0, 0]; v[AX[axis]] = 1;
      spin.setRotationFromAxisAngle(new THREE.Vector3(...v), sign * turn.angle);
    }
    for (const q of cube) (sel(q) ? spin : root).add(cubieMesh(q, keep));
    renderer.render(scene, cam);
    return canvas;
  }
  function resize(w, h) {
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  return { draw, resize, renderer, scene, camera: cam, THREE };
}
