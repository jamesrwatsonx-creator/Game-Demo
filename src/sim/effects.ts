import { SHIELD_DURATION_S, SPEED_SURGE_DURATION_S, SPEED_SURGE_MULTIPLIER, PHASE_DURATION_S } from "./constants";
import { injectOpponentHazard } from "./course";
import { hasEffect } from "./player";
import type { CourseRow, EffectId, PlayerState } from "./types";
import type { Rng } from "./rng";

export type EffectTarget = "self" | "opponent";

export interface EffectMeta {
  id: EffectId;
  label: string;
  target: EffectTarget;
  /** One sentence a first-time player can read as the *consequence*, not the implementation. */
  telegraph: string;
}

export const EFFECT_META: Record<EffectId, EffectMeta> = {
  shield: {
    id: "shield",
    label: "Shield",
    target: "self",
    telegraph: "Briefly immune to crashes.",
  },
  surge: {
    id: "surge",
    label: "Surge",
    target: "self",
    telegraph: "Runs faster — and gets less reaction time as the cost.",
  },
  phase: {
    id: "phase",
    label: "Phase",
    target: "self",
    telegraph: "Passes through rails and hurdles — gaps and its own footing still matter.",
  },
  barrage: {
    id: "barrage",
    label: "Barrage",
    target: "opponent",
    telegraph: "Sends a clearly-marked hazard into the opponent's lane, well ahead of them.",
  },
};

export function speedMultiplierFor(player: PlayerState): number {
  return hasEffect(player, "surge") ? SPEED_SURGE_MULTIPLIER : 1;
}

export function isInvulnerable(player: PlayerState): boolean {
  return hasEffect(player, "shield") || hasEffect(player, "phase");
}

/**
 * Activates the player's currently-held effect, if any. Self effects buff the acting
 * player; "barrage" reaches into the opponent's row stream via injectOpponentHazard, which
 * itself guarantees the same fairness invariants as ordinary generation (CL-04).
 *
 * Returns the activated effect id, or null if nothing was held / activation failed.
 */
export function activateHeldEffect(
  actor: PlayerState,
  opponent: PlayerState,
  opponentRows: CourseRow[],
  opponentSpeedMps: number,
  rng: Rng,
): EffectId | null {
  const effect = actor.heldEffect;
  if (!effect) return null;
  const meta = EFFECT_META[effect];

  if (meta.target === "self") {
    const duration =
      effect === "shield" ? SHIELD_DURATION_S : effect === "surge" ? SPEED_SURGE_DURATION_S : PHASE_DURATION_S;
    actor.activeEffects = actor.activeEffects.filter((e) => e.id !== effect);
    actor.activeEffects.push({ id: effect, remainingS: duration });
    actor.heldEffect = null;
    return effect;
  }

  // "barrage" — opponent-targeting.
  const row = injectOpponentHazard(opponentRows, opponent.z, opponentSpeedMps, rng);
  if (row === null) return null; // not enough generated course yet; caller may retry next tick
  actor.heldEffect = null;
  return effect;
}
