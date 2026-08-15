import * as THREE from "three";
import { HEAD_ON_ARENA_LENGTH_M } from "../sim/constants";
import type { CameraMode } from "../sim/types";

/** Purely a rendering transform (see constants.ts doc on HEAD_ON_ARENA_LENGTH_M) — wraps an
 * unbounded sim distance into a bounded arena so two independently-simulated runners can be
 * placed in one shared world space and read as approaching one another. */
export function wrapZ(z: number): number {
  const m = z % HEAD_ON_ARENA_LENGTH_M;
  return m < 0 ? m + HEAD_ON_ARENA_LENGTH_M : m;
}

export function headOnRenderZ(ownZ: number, mirrored: boolean): number {
  const w = wrapZ(ownZ);
  return mirrored ? HEAD_ON_ARENA_LENGTH_M - w : w;
}

/** Chase camera trailing a single runner — used both for each half of the mirrored
 * split-screen and, per-player, as the fallback single view. Ordinary third-person
 * perspective, deliberately unremarkable: CL-03's concern is specifically about the *head-on*
 * framing, so the comparison needs one arm that is a known-readable baseline. */
export function updateChaseCamera(cam: THREE.PerspectiveCamera, renderZ: number, laneX: number, speedMps: number): void {
  const speedTilt = Math.min(speedMps / 30, 1);
  cam.position.set(laneX * 0.4, 4.4 + speedTilt * 0.4, renderZ - 7.5 - speedTilt * 1.5);
  cam.lookAt(laneX * 0.6, 1.1, renderZ + 9);
}

/**
 * Elevated 3/4 camera framing the shared head-on arena. Tracks the midpoint of both
 * runners' *current rendered* (wrapped) Z positions rather than a fixed arena point —
 * an earlier version used a static look-at target and was caught by inspecting actual
 * screenshots (not just reasoning about the transform math): players drift out of a fixed
 * frame as their wrap phase advances, since wrapZ/headOnRenderZ deliberately don't
 * synchronize the two runners to the same phase. See gauntlet/WORK-LOG.md.
 */
export function updateHeadOnCamera(cam: THREE.PerspectiveCamera, renderZp1: number, renderZp2: number): void {
  const mid = (renderZp1 + renderZp2) / 2;
  cam.position.set(0, 15, mid - 22);
  cam.lookAt(0, 0, mid);
}

export function cameraModeLabel(mode: CameraMode): string {
  return mode === "head-on" ? "Head-On (shared arena)" : "Mirrored (linked worlds)";
}
