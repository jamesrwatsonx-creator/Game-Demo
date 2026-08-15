import { Rng, hashSeed } from "./rng";
import {
  LANE_COUNT,
  MIN_ROW_SPACING_M,
  MIN_ROW_TIME_GAP_S,
  MIN_REACTION_WINDOW_S,
  OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER,
  COMPLEXITY_TIER_ROWS,
  BASE_SPEED_MPS,
  ROW_GAP_SAFETY_MARGIN,
} from "./constants";
import type { CellKind, CourseRow, RowCell, EffectId } from "./types";

/**
 * Procedural course generator. Fairness (INV-02: no unavoidable death from a neutral prior
 * state) is enforced STRUCTURALLY here, not filtered after the fact:
 *
 *   1. At most one "rail" (lane-change-only) cell per row. With N lanes, a player's
 *      reachable set from any lane l is {l-1, l, l+1} ∩ [0, N-1], which has size >= 2 for
 *      any N >= 2. Removing at most one rail lane from a set of size >= 2 always leaves
 *      >= 1 safe lane, for any starting lane. This holds independent of N (see CL-01 note
 *      below) so it survives a future lane-count change.
 *   2. "hurdle" (jump) and "overhead" (duck) cells never remove reachability — every lane
 *      is always clearable by *some* vertical action, and the player is free to choose
 *      that action regardless of which lane they end up in. They add required-action
 *      complexity, not blocked paths.
 *   3. Row spacing is chosen so the time gap between rows always exceeds every action's
 *      duration (see ROW_GAP_EXCEEDS_ACTIONS assert in constants.ts) — a player always has
 *      time to both finish resolving row i's requirement and execute row i+1's before it
 *      arrives.
 *
 * A future N-lane variant only needs to re-check point 1's algebra for that N; it already
 * holds for any N >= 2, so 4-lane is a safe, cheap experiment (CL-01 falsifier).
 */

const RAIL_WEIGHT_BY_TIER = [0.15, 0.22, 0.3, 0.36, 0.42, 0.48];
const OBSTACLE_LANES_BY_TIER = [1, 1, 2, 2, 2, 3];
const PICKUP_CHANCE = 0.14;

export function complexityTier(rowIndex: number): number {
  const tier = Math.floor(rowIndex / COMPLEXITY_TIER_ROWS);
  return Math.min(tier, RAIL_WEIGHT_BY_TIER.length - 1);
}

export function streamSeed(matchSeed: number, playerId: "p1" | "p2"): number {
  return hashSeed(`${matchSeed}:${playerId}`);
}

/**
 * Row spacing in meters, keyed to a caller-supplied reference speed (the player's actual
 * speed at chunk-generation time — see COURSE_CHUNK_ROWS comment for why this matters).
 * ROW_GAP_SAFETY_MARGIN absorbs speed drift across the chunk so later rows in a chunk don't
 * quietly end up with a tighter-than-intended reaction window by the time they're reached.
 */
export function rowSpacingForSpeed(speedMps: number): number {
  return Math.max(MIN_ROW_SPACING_M, speedMps * MIN_ROW_TIME_GAP_S * ROW_GAP_SAFETY_MARGIN);
}

const EFFECT_POOL: EffectId[] = ["shield", "surge", "phase", "barrage"];

function pickCellKind(rng: Rng, railAlreadyPlaced: boolean, tier: number): CellKind {
  const railWeight = railAlreadyPlaced ? 0 : (RAIL_WEIGHT_BY_TIER[tier] ?? 0.5);
  const r = rng.next();
  if (r < railWeight) return "rail";
  if (r < railWeight + (1 - railWeight) * 0.5) return "hurdle";
  return "overhead";
}

export function generateRow(rng: Rng, index: number, z: number): CourseRow {
  const tier = complexityTier(index);
  const cells: RowCell[] = Array.from({ length: LANE_COUNT }, () => ({ kind: "empty" as CellKind }));

  const targetObstacleLanes = Math.min(OBSTACLE_LANES_BY_TIER[tier] ?? LANE_COUNT, LANE_COUNT);
  const lanePool = Array.from({ length: LANE_COUNT }, (_, i) => i);
  // Fisher-Yates partial shuffle to pick which lanes get obstacles this row.
  for (let i = lanePool.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = lanePool[i]!;
    lanePool[i] = lanePool[j]!;
    lanePool[j] = tmp;
  }
  const chosenLanes = lanePool.slice(0, targetObstacleLanes);

  let railPlaced = false;
  for (const lane of chosenLanes) {
    const kind = pickCellKind(rng, railPlaced, tier);
    if (kind === "rail") railPlaced = true;
    const cell = cells[lane];
    if (cell) cell.kind = kind;
  }

  // Pickups only ever land in a currently-empty lane: collecting a tactical effect is a
  // reward path, never itself a risk (design decision, see GAME_LOOP.md).
  if (rng.chance(PICKUP_CHANCE)) {
    const emptyLanes = cells.map((c, i) => (c.kind === "empty" ? i : -1)).filter((i) => i >= 0);
    if (emptyLanes.length > 0) {
      const lane = rng.pick(emptyLanes);
      const cell = cells[lane];
      if (cell) {
        cell.kind = "pickup";
        cell.effect = rng.pick(EFFECT_POOL);
      }
    }
  }

  return { index, z, cells };
}

/**
 * @param referenceSpeedMps the generating player's actual current speed, supplied by the
 *   caller at the moment this chunk is requested (see simulation.ts). Using live speed
 *   rather than a static formula keeps the fairness margin accurate as speed escalates.
 */
export function generateChunk(
  rng: Rng,
  startIndex: number,
  startZ: number,
  count: number,
  referenceSpeedMps: number = BASE_SPEED_MPS,
): CourseRow[] {
  const rows: CourseRow[] = [];
  let z = startZ;
  const spacing = rowSpacingForSpeed(referenceSpeedMps);
  for (let i = 0; i < count; i++) {
    const index = startIndex + i;
    z += spacing;
    rows.push(generateRow(rng, index, z));
  }
  return rows;
}

/**
 * Injects an opponent-caused hazard into `rows` at least
 * MIN_REACTION_WINDOW_S * OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER seconds of travel time ahead
 * of the target's current position (CL-04). Never violates the one-rail-per-row invariant:
 * if the chosen row already carries a rail, the injected hazard downgrades to hurdle so
 * reachability is never at risk.
 *
 * Returns the row index actually used, or null if no eligible row exists yet (caller should
 * generate more chunk ahead and retry).
 */
export function injectOpponentHazard(
  rows: CourseRow[],
  targetCurrentZ: number,
  targetSpeedMps: number,
  rng: Rng,
): number | null {
  const leadTimeS = MIN_REACTION_WINDOW_S * OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER;
  const leadDistanceM = leadTimeS * Math.max(targetSpeedMps, BASE_SPEED_MPS);
  const minZ = targetCurrentZ + leadDistanceM;

  const candidate = rows.find((r) => r.z >= minZ);
  if (!candidate) return null;

  const emptyLanes = candidate.cells
    .map((c, i) => (c.kind === "empty" ? i : -1))
    .filter((i) => i >= 0);
  if (emptyLanes.length === 0) return null; // row already fully occupied, pick another tick

  const lane = rng.pick(emptyLanes);
  const hasRail = candidate.cells.some((c) => c.kind === "rail");
  const cell = candidate.cells[lane];
  if (!cell) return null;
  cell.kind = hasRail ? "hurdle" : "rail";
  cell.opponentCaused = true;
  return candidate.index;
}
