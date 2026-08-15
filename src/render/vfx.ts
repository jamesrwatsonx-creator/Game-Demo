import * as THREE from "three";

interface Burst {
  points: THREE.Points;
  velocities: Float32Array;
  bornMs: number;
  lifeMs: number;
}

const MAX_PARTICLES = 24;

export class VfxSystem {
  private bursts: Burst[] = [];
  constructor(private scene: THREE.Scene) {}

  spawn(position: THREE.Vector3, color: number, layer: number, count = MAX_PARTICLES, lifeMs = 500): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 3.5;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 0.8 + 1.5;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color, size: 0.16, transparent: true, opacity: 1, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    points.layers.set(layer);
    this.scene.add(points);
    this.bursts.push({ points, velocities, bornMs: performance.now(), lifeMs });
  }

  update(dtS: number, nowMs: number): void {
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      if (!b) continue;
      const age = nowMs - b.bornMs;
      if (age > b.lifeMs) {
        this.scene.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
        continue;
      }
      const pos = b.points.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let p = 0; p < pos.count; p++) {
        pos.setX(p, pos.getX(p) + b.velocities[p * 3]! * dtS);
        pos.setY(p, pos.getY(p) + (b.velocities[p * 3 + 1]! - 4 * age * 0.001) * dtS);
        pos.setZ(p, pos.getZ(p) + b.velocities[p * 3 + 2]! * dtS);
      }
      pos.needsUpdate = true;
      (b.points.material as THREE.PointsMaterial).opacity = 1 - age / b.lifeMs;
    }
  }
}
