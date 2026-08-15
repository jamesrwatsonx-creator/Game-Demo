import * as THREE from "three";
import { LANE_COUNT, LANE_WIDTH_M } from "../sim/constants";
import type { CourseRow } from "../sim/types";

const TRACK_HALF_WIDTH = (LANE_COUNT * LANE_WIDTH_M) / 2;
const VISIBLE_AHEAD_M = 70;
const VISIBLE_BEHIND_M = 6;
const CELL_DEPTH = 1.6;

export function laneX(lane: number): number {
  return (lane - (LANE_COUNT - 1) / 2) * LANE_WIDTH_M;
}

interface PooledMesh {
  mesh: THREE.Mesh;
  inUse: boolean;
}

const railMat = new THREE.MeshStandardMaterial({ color: 0xff3355, emissive: 0x440011, roughness: 0.4 });
const hurdleMat = new THREE.MeshStandardMaterial({ color: 0xffaa22, emissive: 0x442200, roughness: 0.4 });
const overheadMat = new THREE.MeshStandardMaterial({ color: 0x22aaff, emissive: 0x002244, roughness: 0.4 });
const pickupMat = new THREE.MeshStandardMaterial({ color: 0x33ffaa, emissive: 0x114433, roughness: 0.3 });
const opponentRailMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0x550055, roughness: 0.3 });

const railGeo = new THREE.BoxGeometry(LANE_WIDTH_M * 0.82, 1.6, 0.35);
const hurdleGeo = new THREE.BoxGeometry(LANE_WIDTH_M * 0.82, 0.55, 0.35);
const overheadGeo = new THREE.BoxGeometry(LANE_WIDTH_M * 0.82, 0.5, 0.35);
const pickupGeo = new THREE.OctahedronGeometry(0.42, 0);

export class TrackView {
  readonly group = new THREE.Group();
  private pool: PooledMesh[] = [];
  private laneStrips: THREE.Mesh[] = [];
  private laneDividers: THREE.Mesh[] = [];
  private groundLength = 400;

  constructor(
    scene: THREE.Scene,
    private colorTint: number,
    private layer: number,
  ) {
    scene.add(this.group);
    this.buildGround();
  }

  private buildGround(): void {
    const groundGeo = new THREE.PlaneGeometry(TRACK_HALF_WIDTH * 2 + 1, this.groundLength);
    const groundMat = new THREE.MeshStandardMaterial({ color: this.colorTint, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = this.groundLength / 2 - 20;
    ground.layers.set(this.layer);
    this.group.add(ground);
    this.laneStrips.push(ground);

    for (let i = 1; i < LANE_COUNT; i++) {
      const x = laneX(i) - LANE_WIDTH_M / 2;
      const divGeo = new THREE.PlaneGeometry(0.06, this.groundLength);
      const divMat = new THREE.MeshBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.35 });
      const div = new THREE.Mesh(divGeo, divMat);
      div.rotation.x = -Math.PI / 2;
      div.position.set(x, 0.01, this.groundLength / 2 - 20);
      div.layers.set(this.layer);
      this.group.add(div);
      this.laneDividers.push(div);
    }
  }

  private acquire(geo: THREE.BufferGeometry, mat: THREE.Material): PooledMesh {
    const free = this.pool.find((p) => !p.inUse && p.mesh.geometry === geo && p.mesh.material === mat);
    if (free) {
      free.inUse = true;
      free.mesh.visible = true;
      return free;
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = true;
    mesh.layers.set(this.layer);
    this.group.add(mesh);
    const pooled: PooledMesh = { mesh, inUse: true };
    this.pool.push(pooled);
    return pooled;
  }

  /** @param playerZ current player distance, used to cull to the visible window.
   *  @param zTransform maps a row's own-track z to a render-space z (identity for mirrored mode, wrap transform for head-on mode). */
  update(rows: CourseRow[], playerZ: number, zTransform: (z: number) => number): void {
    for (const p of this.pool) p.inUse = false;

    for (const row of rows) {
      if (row.z < playerZ - VISIBLE_BEHIND_M || row.z > playerZ + VISIBLE_AHEAD_M) continue;
      const renderZ = zTransform(row.z);
      for (let lane = 0; lane < LANE_COUNT; lane++) {
        const cell = row.cells[lane];
        if (!cell || cell.kind === "empty") continue;
        let pooled: PooledMesh;
        switch (cell.kind) {
          case "rail":
            pooled = this.acquire(railGeo, cell.opponentCaused ? opponentRailMat : railMat);
            pooled.mesh.position.set(laneX(lane), 0.8, renderZ);
            break;
          case "hurdle":
            pooled = this.acquire(hurdleGeo, hurdleMat);
            pooled.mesh.position.set(laneX(lane), 0.28, renderZ);
            break;
          case "overhead":
            pooled = this.acquire(overheadGeo, overheadMat);
            pooled.mesh.position.set(laneX(lane), 1.55, renderZ);
            break;
          case "pickup":
            pooled = this.acquire(pickupGeo, pickupMat);
            pooled.mesh.position.set(laneX(lane), 0.6 + Math.sin(row.index) * 0.05, renderZ);
            pooled.mesh.rotation.y = row.index;
            break;
          default:
            continue;
        }
      }
    }

    for (const p of this.pool) p.mesh.visible = p.inUse;

    for (const strip of this.laneStrips) strip.position.z = zTransform(playerZ) + this.groundLength / 2 - 20;
    for (const div of this.laneDividers) div.position.z = zTransform(playerZ) + this.groundLength / 2 - 20;
  }
}

export { TRACK_HALF_WIDTH, CELL_DEPTH };
