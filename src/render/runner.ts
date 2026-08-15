import * as THREE from "three";
import { JUMP_HEIGHT_M } from "../sim/constants";
import { laneX } from "./track";
import type { PlayerState } from "../sim/types";

export class RunnerView {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  private visor: THREE.Mesh;
  private baseColor: number;
  private flashUntil = 0;

  constructor(scene: THREE.Scene, color: number, layer: number) {
    this.baseColor = color;
    const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.8, 4, 10);
    const bodyMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.35 });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.95;
    this.body.layers.set(layer);
    this.group.add(this.body);

    const visorGeo = new THREE.BoxGeometry(0.5, 0.18, 0.16);
    const visorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8888ff, emissiveIntensity: 0.6 });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 1.35, 0.34);
    this.visor.layers.set(layer);
    this.group.add(this.visor);

    scene.add(this.group);
  }

  flashHit(): void {
    this.flashUntil = performance.now() + 260;
  }

  /** @param facing +1 for a runner facing +z, -1 for a runner rendered facing -z (mirrored/opponent view of head-on mode). */
  update(player: PlayerState, renderZ: number, facing: 1 | -1, nowMs: number): void {
    const laneFrom = laneX(player.lane);
    const laneTo = laneX(player.targetLane);
    const x = laneFrom + (laneTo - laneFrom) * player.laneProgress;

    let y = 0.95;
    let squash = 1;
    if (player.vertical === "airborne") {
      const t = player.verticalProgress;
      y += Math.sin(Math.PI * t) * JUMP_HEIGHT_M;
    } else if (player.vertical === "ducking") {
      const t = player.verticalProgress;
      const duckAmount = Math.sin(Math.PI * Math.min(t, 1)) * 0.4;
      squash = 1 - duckAmount * 0.5;
      y -= duckAmount * 0.35;
    }

    this.group.position.set(x, 0, renderZ);
    this.group.rotation.y = facing === 1 ? 0 : Math.PI;
    this.body.scale.set(1, squash, 1);

    // Bank into lane changes for a readable "committing" feel.
    const laneVelocitySign = Math.sign(player.targetLane - player.lane) * facing;
    const bank = player.laneProgress < 1 ? laneVelocitySign * 0.28 * Math.sin(Math.PI * player.laneProgress) : 0;
    this.group.rotation.z = bank;

    const mat = this.body.material as THREE.MeshStandardMaterial;
    if (nowMs < this.flashUntil) {
      const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.06);
      mat.emissive.setHex(0xff2222);
      mat.emissiveIntensity = 0.6 + pulse * 0.6;
    } else {
      mat.emissive.setHex(this.baseColor);
      mat.emissiveIntensity = player.activeEffects.length > 0 ? 0.7 : 0.25;
    }
    this.group.visible = player.alive || nowMs < this.flashUntil + 400;
  }
}
