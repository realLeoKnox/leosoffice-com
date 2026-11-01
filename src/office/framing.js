import * as THREE from 'three';

// Camera poses: where the orthographic camera looks from (yaw/pitch around a target).
export const OVERVIEW = { yaw: 0.78, pitch: 0.61, target: new THREE.Vector3(0, 1.45, 0) };
export const INSIDE = { yaw: 0.74, pitch: 0.47, target: new THREE.Vector3(0.05, 1.35, -0.1) };

const probe = new THREE.OrthographicCamera();
const tmp = new THREE.Vector3();

export function placeCamera(camera, yaw, pitch, target) {
  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * 12,
    target.y + Math.sin(pitch) * 12,
    target.z + Math.cos(yaw) * Math.cos(pitch) * 12,
  );
  camera.lookAt(target);
}

// Bounds of world points in the view space of a pose, relative to its target.
export function viewBounds(points, pose) {
  placeCamera(probe, pose.yaw, pose.pitch, pose.target);
  probe.updateMatrixWorld();
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of points) {
    tmp.copy(p).applyMatrix4(probe.matrixWorldInverse);
    x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x);
    y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y);
  }
  return { x0, x1, y0, y1 };
}

// Frustum that fits `b` into a screen region given as fractions (x from left, y from top).
// `minHeight` keeps small objects from filling the screen; `align` places leftover
// vertical space (0 = content hugs the region top, 0.5 = centred).
export function frame(b, aspect, region, { minHeight = 0, align = 0.5 } = {}) {
  const rw = region.x1 - region.x0, rh = region.y1 - region.y0;
  const vh = Math.max((b.y1 - b.y0) / rh, (b.x1 - b.x0) / rw / aspect, minHeight);
  const vw = vh * aspect;
  const cx = (b.x0 + b.x1) / 2;
  const slack = rh - (b.y1 - b.y0) / vh;
  const contentTop = region.y0 + slack * align;
  const left = cx - ((region.x0 + region.x1) / 2) * vw;
  const top = b.y1 + contentTop * vh;
  return { left, right: left + vw, top, bottom: top - vh };
}

export function boxCorners(box) {
  const c = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) c.push(new THREE.Vector3(x, y, z));
  return c;
}

export const smooth = (t) => t * t * (3 - 2 * t);
export const clamp01 = (t) => Math.min(1, Math.max(0, t));
