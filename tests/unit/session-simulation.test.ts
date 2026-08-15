import { describe, expect, it } from "vitest";
import { Match } from "../../src/sim/simulation";
import { decideAiIntents } from "../../src/sim/ai";
import { Rng, hashSeed } from "../../src/sim/rng";

/**
 * Section 14 "Session Simulation": AI-vs-AI matches (both sides using the *gameplay* AI —
 * bounded reaction budget, not the omniscient solver) to check whether sessions trend too
 * short, too long, or repetitive, and whether the difficulty ramp actually produces
 * increasing pressure rather than plateauing. This exercises game *feel* properties, not
 * fairness — a short session from AI misplay is expected and fine; a session that never
 * ends, or that never varies, would indicate a pacing problem worth flagging.
 *
 * `Match` only auto-drives a player flagged `isAI` (see simulation.ts); p1 is always
 * "externally driven" by design (that's the human-input seam). For an AI-vs-AI simulation
 * both sides must be driven explicitly with the same bounded-reaction gameplay AI p2 uses
 * internally — passing empty intents for p1 was tried first and produced a median session
 * length of ~2s, which turned out to be the harness leaving p1 completely stationary (it
 * crashed into the first rail it met), not a real pacing or AI-competence finding. See
 * gauntlet/WORK-LOG.md.
 */

const MAX_TICKS = 60 * 180; // 3 simulated minutes, generous upper bound

interface SessionResult {
  seed: number;
  durationS: number;
  endedByCrash: boolean;
  p1NearMisses: number;
  p2NearMisses: number;
  finalSpeed: number;
}

function runAiVsAiMatch(seed: number): SessionResult {
  const match = new Match(seed, false);
  const rngP1 = new Rng(hashSeed(`session-ai:${seed}:p1`));
  const rngP2 = new Rng(hashSeed(`session-ai:${seed}:p2`));
  let ticks = 0;
  while (match.state.status !== "finished" && ticks < MAX_TICKS) {
    const p1 = match.state.players[0];
    const p2 = match.state.players[1];
    const intentsP1 = decideAiIntents(p1, match.state.rows[0], match.state.speedMps, rngP1);
    const intentsP2 = decideAiIntents(p2, match.state.rows[1], match.state.speedMps, rngP2);
    match.step(intentsP1, intentsP2);
    ticks++;
  }
  const p1 = match.state.players[0];
  const p2 = match.state.players[1];
  return {
    seed,
    durationS: match.state.timeS,
    endedByCrash: match.state.status === "finished",
    p1NearMisses: p1.nearMissTotal,
    p2NearMisses: p2.nearMissTotal,
    finalSpeed: match.state.speedMps,
  };
}

describe("Session simulator (AI vs AI, gameplay difficulty)", () => {
  it("produces varied, bounded, near-miss-rich sessions across 200 seeds", () => {
    const results: SessionResult[] = [];
    for (let seed = 1; seed <= 200; seed++) {
      results.push(runAiVsAiMatch(seed));
    }

    const durations = results.map((r) => r.durationS).sort((a, b) => a - b);
    const median = durations[Math.floor(durations.length / 2)]!;
    const p10 = durations[Math.floor(durations.length * 0.1)]!;
    const p90 = durations[Math.floor(durations.length * 0.9)]!;
    const neverEnded = results.filter((r) => !r.endedByCrash).length;
    const totalNearMisses = results.reduce((sum, r) => sum + r.p1NearMisses + r.p2NearMisses, 0);
    const avgNearMissesPerSession = totalNearMisses / results.length;

    // eslint-disable-next-line no-console
    console.log(
      `Session simulator: median=${median.toFixed(1)}s p10=${p10.toFixed(1)}s p90=${p90.toFixed(1)}s ` +
        `neverEnded=${neverEnded}/200 avgNearMissesPerSession=${avgNearMissesPerSession.toFixed(2)}`,
    );

    // Every match must actually resolve — an AI vs AI match that never crashes within 3
    // simulated minutes would indicate the difficulty ramp plateaus below AI-lethal levels.
    expect(neverEnded).toBe(0);

    // Sessions should be short-format (spec: "short sessions"), not degenerate-instant.
    expect(median).toBeGreaterThan(3);
    expect(median).toBeLessThan(90);

    // Near misses should be a recurring feature, not a rare fluke (spec: "near misses occur
    // regularly").
    expect(avgNearMissesPerSession).toBeGreaterThan(0.5);
  }, 60_000);
});
