import { LANE_COUNT, JUMP_DURATION_S, DUCK_DURATION_S } from "./constants";
import { complexityTier } from "./course";
import { currentLane } from "./player";
import type { CourseRow, InputIntent, PlayerState } from "./types";
import type { Rng } from "./rng";

/**
 * AI challenger: reacts to the same generated course a human would see, with a bounded
 * "reaction budget" rather than perfect foresight, so it is beatable and reads as a
 * competitor rather than a wall. This is a deliberate INFERABLE choice (competitive
 * psychology: losing to a visibly-fallible opponent feels fairer than losing to an
 * omniscient one) — not validated with human testers in this session (see GAPS.md).
 */
const AI_REACT_BUDGET_S = 0.55;
const AI_ACTIVATE_CHANCE_PER_S = 0.35;
const AI_PICKUP_DETOUR_CHANCE = 0.5;

/**
 * CONSTRUCTION DISCOVERY (see gauntlet/WORK-LOG.md): with a react budget comfortably above
 * every action duration, a bounded-but-deterministic AI resolves essentially every row it
 * "notices" correctly — the fairness margin that INV-02 requires (every row solvable from
 * any reachable lane) also makes the game trivial for anything that reacts within its
 * budget at all. Session-simulation measured a ~86s median AI-vs-AI match against a spec
 * target of "short sessions" — clearly too long. Rather than eroding the proven-fair
 * generator, gameplay AI gets a bounded per-row miss chance modeling imperfect attention
 * (a human plays this way too — occasionally missing an obstacle it "should" have caught).
 * Deliberately NOT applied when reactBudgetS is Infinity: that path models the omniscient
 * solver the survivability sweep uses to prove structural fairness, and must stay perfect.
 */
const AI_BASE_MISTAKE_CHANCE = 0.05;
const AI_MISTAKE_CHANCE_PER_TIER = 0.02;

/** Deterministic, stable per-row pseudo-random value in [0, 1) — same row index always
 * produces the same value across ticks, without needing the AI to carry per-row memory. */
function rowMistakeRoll(rowIndex: number): number {
  const x = Math.imul(rowIndex ^ 0x9e3779b9, 2654435761) >>> 0;
  return x / 4294967296;
}

function nextUnresolvedRow(rows: CourseRow[], playerZ: number): CourseRow | null {
  for (const row of rows) {
    if (row.z > playerZ) return row;
  }
  return null;
}

function nearestSafeLane(row: CourseRow, fromLane: number): number {
  for (let radius = 0; radius < LANE_COUNT; radius++) {
    for (const lane of [fromLane - radius, fromLane + radius]) {
      if (lane < 0 || lane >= LANE_COUNT) continue;
      if (row.cells[lane]?.kind !== "rail") return lane;
    }
  }
  return fromLane;
}

/**
 * @param reactBudgetS override for how far ahead (in seconds of travel time) the AI is
 *   willing to start reacting. Gameplay AI uses the default (bounded, beatable). The
 *   survivability test harness passes Infinity to model an idealized player with perfect
 *   foresight, which turns "did this seed ever kill a competent player" into "does an
 *   unavoidable-death state exist at all" — a structural fairness check, not a skill check.
 */
export function decideAiIntents(
  player: PlayerState,
  rows: CourseRow[],
  speedMps: number,
  rng: Rng,
  reactBudgetS: number = AI_REACT_BUDGET_S,
): InputIntent[] {
  if (!player.alive) return [];
  const intents: InputIntent[] = [];

  if (player.heldEffect && rng.chance(AI_ACTIVATE_CHANCE_PER_S * (1 / 60))) {
    intents.push({ kind: "activate" });
  }

  const row = nextUnresolvedRow(rows, player.z);
  if (!row) return intents;

  const timeToRow = (row.z - player.z) / Math.max(speedMps, 0.01);
  if (timeToRow > reactBudgetS) {
    // Not yet "reacting" — but opportunistically drift toward a visible pickup if safe.
    const lane = currentLane(player);
    const pickupLane = row.cells.findIndex((c) => c.kind === "pickup");
    if (!player.heldEffect && pickupLane >= 0 && Math.abs(pickupLane - lane) === 1 && rng.chance(AI_PICKUP_DETOUR_CHANCE)) {
      intents.push({ kind: "lane", direction: pickupLane > lane ? 1 : -1 });
    }
    return intents;
  }

  // Bounded imperfection: skip reacting to this specific row entirely with a small,
  // tier-scaled chance — but only for a finite (gameplay) reaction budget. The Infinity
  // budget used by the fairness solver must never miss, or the survivability sweep would
  // misreport a tuning choice as a structural fairness violation.
  if (Number.isFinite(reactBudgetS)) {
    const mistakeChance = AI_BASE_MISTAKE_CHANCE + complexityTier(row.index) * AI_MISTAKE_CHANCE_PER_TIER;
    if (rowMistakeRoll(row.index) < mistakeChance) return intents;
  }

  const lane = currentLane(player);
  const cell = row.cells[lane];
  if (!cell) return intents;

  // A rail forces a lane change; the *destination* lane's own cell still needs its own
  // vertical action (it may itself be a hurdle/overhead), so decide the final lane first
  // and then react to whatever is actually there — reacting only to the pre-move cell
  // would silently drop the second requirement and cause an entirely avoidable crash.
  // Lane changes are safe to start as soon as we're "paying attention" to this row — an
  // early lane change just means arriving early and waiting, which is harmless.
  const destination = cell.kind === "rail" ? nearestSafeLane(row, lane) : lane;
  if (destination !== lane) {
    intents.push({ kind: "lane", direction: destination > lane ? 1 : -1 });
  }

  // Jump/duck are NOT safe to start as soon as we're "paying attention": both are
  // time-limited actions that auto-resolve back to grounded after a fixed duration
  // regardless of when they were triggered. Triggering as soon as reactBudgetS allows
  // (which, for the Infinity-budget solver, means "immediately") can land the player back
  // on the ground *before* they actually reach the row — jumping too early doesn't clear a
  // hurdle that hasn't arrived yet. Each action is only triggered once its own duration is
  // the limiting factor, i.e. once triggering now means the active window still covers the
  // moment of crossing.
  const destinationCell = row.cells[destination];
  if (destinationCell?.kind === "hurdle" && player.vertical === "grounded" && timeToRow <= JUMP_DURATION_S) {
    intents.push({ kind: "jump" });
  } else if (
    destinationCell?.kind === "overhead" &&
    player.vertical === "grounded" &&
    timeToRow <= DUCK_DURATION_S
  ) {
    intents.push({ kind: "duck" });
  }

  return intents;
}
