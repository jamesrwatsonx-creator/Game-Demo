import { describe, expect, it } from "vitest";
import { Match } from "../../src/sim/simulation";
import { decideAiIntents } from "../../src/sim/ai";
import { Rng, hashSeed } from "../../src/sim/rng";
import { injectOpponentHazard, generateChunk } from "../../src/sim/course";
import {
  JUMP_DURATION_S,
  DUCK_DURATION_S,
  LANE_CHANGE_DURATION_S,
  MIN_REACTION_WINDOW_S,
  OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER,
} from "../../src/sim/constants";

/**
 * Section 14 "Reaction Window Audit": measure the available response time for every row
 * a player crosses, across the full difficulty envelope, and flag anything below the
 * project's human-response floor.
 *
 * Two distinct floors are checked, deliberately not conflated:
 *   HARD_FLOOR   — max single action duration. Falling under this would mean a state that
 *                  is *physically* impossible to resolve regardless of player skill; this
 *                  is asserted as a hard failure (it would falsify INV-02).
 *   SOFT_TARGET  — MIN_REACTION_WINDOW_S, the provisional *perceptual comfort* floor (CL
 *                  ledger: DERIVABLE ballpark, not a measured human-testing result). Rows
 *                  under this are only ever produced by a player's own prior choice (e.g.
 *                  self-activated speed surge tightening their own margin — see effects.ts)
 *                  since ordinary generation targets this floor directly. Violations are
 *                  reported as a rate, not hard-failed, because tightening it further is a
 *                  tuning question this session cannot resolve without human testers.
 */
const HARD_FLOOR_S = Math.max(JUMP_DURATION_S, DUCK_DURATION_S, LANE_CHANGE_DURATION_S);

function collectRowGaps(seed: number, distanceTargetM: number): number[] {
  const match = new Match(seed, false);
  const rngP1 = new Rng(hashSeed(`audit:${seed}:p1`));
  const rngP2 = new Rng(hashSeed(`audit:${seed}:p2`));
  let ticks = 0;
  while (match.state.status === "countdown" && ticks < 200) {
    match.step([], []);
    ticks++;
  }

  const gaps: number[] = [];
  let lastCrossTimeP1 = match.state.timeS;

  while (match.state.status === "running" && match.state.players[0].z < distanceTargetM && ticks < 60 * 140) {
    const beforeIndex = match.state.nextRowIndex[0];
    const p1 = match.state.players[0];
    const p2 = match.state.players[1];
    const intentsP1 = decideAiIntents(p1, match.state.rows[0], match.state.speedMps, rngP1, Infinity);
    const intentsP2 = decideAiIntents(p2, match.state.rows[1], match.state.speedMps, rngP2, Infinity);
    match.step(intentsP1, intentsP2);
    ticks++;
    if (match.state.nextRowIndex[0] > beforeIndex) {
      gaps.push(match.state.timeS - lastCrossTimeP1);
      lastCrossTimeP1 = match.state.timeS;
    }
  }
  return gaps;
}

describe("Reaction window audit", () => {
  it("never produces a row-to-row gap under the hard physical floor, across 200 seeds", () => {
    const violations: { seed: number; gap: number }[] = [];
    let totalRows = 0;
    let underSoftTarget = 0;

    for (let seed = 1; seed <= 200; seed++) {
      const gaps = collectRowGaps(seed, 1600);
      for (const gap of gaps) {
        totalRows++;
        if (gap < HARD_FLOOR_S) violations.push({ seed, gap });
        if (gap < MIN_REACTION_WINDOW_S) underSoftTarget++;
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `Reaction window audit: ${totalRows} row-crossings sampled, ${underSoftTarget} (` +
        `${((underSoftTarget / totalRows) * 100).toFixed(2)}%) under the ${MIN_REACTION_WINDOW_S}s soft target, ` +
        `${violations.length} under the ${HARD_FLOOR_S.toFixed(2)}s hard floor.`,
    );

    expect(violations).toEqual([]);
  }, 60_000);
});

describe("Opponent hazard telegraph (CL-04)", () => {
  it("injected hazards always respect the amplified lead-time requirement", () => {
    const speeds = [9, 15, 20, 26];
    for (const speed of speeds) {
      const rng = new Rng(hashSeed(`inject-audit:${speed}`));
      const rows = generateChunk(rng, 0, 0, 40, speed);
      const targetZ = 0;
      const rowIndex = injectOpponentHazard(rows, targetZ, speed, rng);
      expect(rowIndex).not.toBeNull();
      const row = rows.find((r) => r.index === rowIndex)!;
      const leadTimeS = (row.z - targetZ) / speed;
      const requiredS = MIN_REACTION_WINDOW_S * OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER;
      expect(leadTimeS).toBeGreaterThanOrEqual(requiredS);
    }
  });

  it("injected hazards never create a second rail in an already-fair row", () => {
    const rng = new Rng(hashSeed("inject-audit-rail-cap"));
    const rows = generateChunk(rng, 0, 0, 40, 12);
    injectOpponentHazard(rows, 0, 12, rng);
    for (const row of rows) {
      const railCount = row.cells.filter((c) => c.kind === "rail").length;
      expect(railCount).toBeLessThanOrEqual(1);
    }
  });
});
