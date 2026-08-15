import {
  LANE_COUNT,
  LANE_CHANGE_DURATION_S,
  JUMP_DURATION_S,
  DUCK_DURATION_S,
  AIR_STEERING_ENABLED,
} from "./constants";
import type { InputIntent, PlayerState } from "./types";

export function createPlayer(id: "p1" | "p2", isAI: boolean): PlayerState {
  const startLane = Math.floor(LANE_COUNT / 2);
  return {
    id,
    isAI,
    lane: startLane,
    targetLane: startLane,
    laneProgress: 1,
    z: 0,
    vertical: "grounded",
    verticalProgress: 1,
    alive: true,
    distance: 0,
    heldEffect: null,
    activeEffects: [],
    deathReason: null,
    deathRow: null,
    nearMissStreak: 0,
    nearMissTotal: 0,
  };
}

/** Applies a single discrete input intent to a player. Movement/jump *math* happens in
 * advancePlayerPhysics; this only records intent (start a transition, or queue nothing if
 * the requested action isn't currently legal). */
export function applyIntent(player: PlayerState, intent: InputIntent): void {
  if (!player.alive) return;

  switch (intent.kind) {
    case "lane": {
      if (!AIR_STEERING_ENABLED && player.vertical !== "grounded") return;
      // Only accept a new lane target once the previous change has committed far enough
      // to avoid double-inputs snapping the player back and forth mid-transition.
      const nextLane = player.targetLane + intent.direction;
      if (nextLane < 0 || nextLane >= LANE_COUNT) return;
      player.lane = currentLane(player);
      player.targetLane = nextLane;
      player.laneProgress = 0;
      break;
    }
    case "jump": {
      if (player.vertical !== "grounded") return;
      player.vertical = "airborne";
      player.verticalProgress = 0;
      break;
    }
    case "duck": {
      if (player.vertical !== "grounded") return;
      player.vertical = "ducking";
      player.verticalProgress = 0;
      break;
    }
    case "activate": {
      // Handled by the simulation (needs course/opponent access), not the player module.
      break;
    }
  }
}

/** Returns the lane the player is actually occupying right now (interpolated transitions
 * are treated as "still in the source lane" for collision purposes until progress >= 0.5,
 * matching what a player visually reads as "committed to the new lane"). */
export function currentLane(player: PlayerState): number {
  return player.laneProgress >= 0.5 ? player.targetLane : player.lane;
}

export function advancePlayerPhysics(player: PlayerState, dtS: number, speedMps: number): void {
  if (!player.alive) return;

  player.z += speedMps * dtS;
  player.distance = player.z;

  if (player.laneProgress < 1) {
    player.laneProgress = Math.min(1, player.laneProgress + dtS / LANE_CHANGE_DURATION_S);
    if (player.laneProgress >= 1) player.lane = player.targetLane;
  }

  if (player.vertical === "airborne") {
    player.verticalProgress = Math.min(1, player.verticalProgress + dtS / JUMP_DURATION_S);
    if (player.verticalProgress >= 1) player.vertical = "grounded";
  } else if (player.vertical === "ducking") {
    player.verticalProgress = Math.min(1, player.verticalProgress + dtS / DUCK_DURATION_S);
    if (player.verticalProgress >= 1) player.vertical = "grounded";
  }

  for (const effect of player.activeEffects) {
    effect.remainingS = Math.max(0, effect.remainingS - dtS);
  }
  player.activeEffects = player.activeEffects.filter((e) => e.remainingS > 0);
}

export function hasEffect(player: PlayerState, id: string): boolean {
  return player.activeEffects.some((e) => e.id === id);
}
