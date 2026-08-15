import { describe, expect, it } from "vitest";
import { Match } from "../../src/sim/simulation";
import { decideAiIntents } from "../../src/sim/ai";
import { Rng, hashSeed } from "../../src/sim/rng";
import { MAX_SPEED_MPS } from "../../src/sim/constants";

/**
 * INV-02 / H-02: "no generated state may create an unavoidable death when the player has
 * not already made a losing decision." This is tested by driving BOTH runners with the
 * omniscient solver (decideAiIntents with an infinite reaction budget — see ai.ts) rather
 * than the deliberately-fallible gameplay AI. If a solver ever crashes, that is a structural
 * fairness bug in the generator or collision logic, not a skill issue.
 *
 * Distance target (~1600m) is chosen to comfortably exceed the point at which BOTH speed
 * (reaches MAX_SPEED_MPS at 1400m of average distance, see constants.ts) and course
 * complexity (maxes out its tier table at row ~108, i.e. well under 1600m at any generated
 * row spacing) reach their ceiling, so the sweep covers the full stated difficulty envelope
 * rather than only its easy end.
 */

const DISTANCE_TARGET_M = 1600;
const MAX_TICKS = 60 * 140; // 140s wall-clock cap per match; generous safety valve, not a tuned value

interface RunResult {
  seed: number;
  p1Alive: boolean;
  p2Alive: boolean;
  p1DeathReason: string | null;
  p2DeathReason: string | null;
  ticks: number;
  reachedDistance: boolean;
}

function runSolverMatch(seed: number): RunResult {
  const match = new Match(seed, false);
  const rngP1 = new Rng(hashSeed(`solver:${seed}:p1`));
  const rngP2 = new Rng(hashSeed(`solver:${seed}:p2`));

  let ticks = 0;
  // Skip the countdown quickly.
  while (match.state.status === "countdown" && ticks < 200) {
    match.step([], []);
    ticks++;
  }

  while (
    match.state.status === "running" &&
    ticks < MAX_TICKS &&
    (match.state.players[0].z + match.state.players[1].z) / 2 < DISTANCE_TARGET_M
  ) {
    const p1 = match.state.players[0];
    const p2 = match.state.players[1];
    const intentsP1 = decideAiIntents(p1, match.state.rows[0], match.state.speedMps, rngP1, Infinity);
    const intentsP2 = decideAiIntents(p2, match.state.rows[1], match.state.speedMps, rngP2, Infinity);
    match.step(intentsP1, intentsP2);
    ticks++;
  }

  const p1 = match.state.players[0];
  const p2 = match.state.players[1];
  return {
    seed,
    p1Alive: p1.alive,
    p2Alive: p2.alive,
    p1DeathReason: p1.deathReason,
    p2DeathReason: p2.deathReason,
    ticks,
    reachedDistance: (p1.z + p2.z) / 2 >= DISTANCE_TARGET_M,
  };
}

describe("Course survivability sweep (INV-02)", () => {
  it("solver-controlled runners never crash across 300 seeds (fast sweep)", () => {
    const failures: RunResult[] = [];
    for (let seed = 1; seed <= 300; seed++) {
      const result = runSolverMatch(seed);
      if (!result.p1Alive || !result.p2Alive) failures.push(result);
    }
    if (failures.length > 0) {
      console.error("Unavoidable-death candidates:", JSON.stringify(failures.slice(0, 5), null, 2));
    }
    expect(failures).toEqual([]);
  }, 60_000);

  it("solver-controlled runners never crash across 10,000 seeds (full sweep, spec section 14)", () => {
    const failures: RunResult[] = [];
    const N = 10_000;
    for (let seed = 1; seed <= N; seed++) {
      const result = runSolverMatch(seed);
      if (!result.p1Alive || !result.p2Alive) failures.push(result);
    }
    if (failures.length > 0) {
      console.error(
        `${failures.length}/${N} seeds produced an unavoidable-death candidate. First 5:`,
        JSON.stringify(failures.slice(0, 5), null, 2),
      );
    }
    expect(failures).toEqual([]);
  }, 300_000);

  it("sanity: matches actually reach the top speed/complexity tier within the distance target", () => {
    const result = runSolverMatch(7);
    expect(result.reachedDistance).toBe(true);
  }, 30_000);
});
