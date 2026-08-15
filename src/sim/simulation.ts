import { Rng, hashSeed } from "./rng";
import { generateChunk, streamSeed } from "./course";
import { createPlayer, applyIntent, advancePlayerPhysics, currentLane } from "./player";
import { decideAiIntents } from "./ai";
import { activateHeldEffect, isInvulnerable, speedMultiplierFor } from "./effects";
import {
  BASE_SPEED_MPS,
  MAX_SPEED_MPS,
  SPEED_RAMP_PER_METER,
  COURSE_CHUNK_ROWS,
  FIXED_STEP_S,
} from "./constants";
import type { CourseRow, InputIntent, MatchEvent, MatchState, PlayerState } from "./types";

const COUNTDOWN_S = 2;
const CHUNK_REGEN_LOOKAHEAD_ROWS = 3;

export class Match {
  readonly state: MatchState;
  private rngP1: Rng;
  private rngP2: Rng;
  private rngEffects: Rng;

  constructor(seed: number, p2IsAI: boolean) {
    this.rngP1 = new Rng(streamSeed(seed, "p1"));
    this.rngP2 = new Rng(streamSeed(seed, "p2"));
    this.rngEffects = new Rng(hashSeed(`${seed}:effects`));

    const p1 = createPlayer("p1", false);
    const p2 = createPlayer("p2", p2IsAI);

    this.state = {
      seed,
      timeS: 0,
      speedMps: BASE_SPEED_MPS,
      players: [p1, p2],
      rows: [generateChunk(this.rngP1, 0, 0, COURSE_CHUNK_ROWS, BASE_SPEED_MPS), generateChunk(this.rngP2, 0, 0, COURSE_CHUNK_ROWS, BASE_SPEED_MPS)],
      nextRowIndex: [0, 0],
      status: "countdown",
      countdownS: COUNTDOWN_S,
      winner: null,
      events: [],
    };
  }

  private rngFor(playerIdx: 0 | 1): Rng {
    return playerIdx === 0 ? this.rngP1 : this.rngP2;
  }

  private ensureChunk(playerIdx: 0 | 1): void {
    const rows = this.state.rows[playerIdx];
    const player = this.state.players[playerIdx];
    const lastRow = rows[rows.length - 1];
    if (!lastRow || !player) return;
    const remainingRows = rows.filter((r) => r.z > player.z).length;
    if (remainingRows > CHUNK_REGEN_LOOKAHEAD_ROWS) return;
    const nextChunk = generateChunk(this.rngFor(playerIdx), lastRow.index + 1, lastRow.z, COURSE_CHUNK_ROWS, this.state.speedMps);
    rows.push(...nextChunk);
  }

  /** Advances the match by one fixed step. `intents` are per-player discrete inputs raised this tick (usually 0 or 1). */
  step(intentsP1: InputIntent[], intentsP2AI: InputIntent[] | null): void {
    const s = this.state;

    if (s.status === "countdown") {
      s.countdownS -= FIXED_STEP_S;
      if (s.countdownS <= 0) {
        s.countdownS = 0;
        s.status = "running";
      }
      return;
    }
    if (s.status !== "running") return;

    s.timeS += FIXED_STEP_S;

    const p1 = s.players[0];
    const p2 = s.players[1];
    const avgDistance = (p1.z + p2.z) / 2;
    s.speedMps = Math.min(MAX_SPEED_MPS, BASE_SPEED_MPS + avgDistance * SPEED_RAMP_PER_METER);

    const p2Intents = p2.isAI
      ? decideAiIntents(p2, s.rows[1], s.speedMps, this.rngP2)
      : (intentsP2AI ?? []);

    this.applyIntents(0, intentsP1);
    this.applyIntents(1, p2Intents);

    for (const idx of [0, 1] as const) {
      const player = s.players[idx];
      const speed = s.speedMps * speedMultiplierFor(player);
      advancePlayerPhysics(player, FIXED_STEP_S, speed);
      this.resolveRows(idx);
      this.ensureChunk(idx);
    }

    if (!p1.alive || !p2.alive) {
      s.status = "finished";
      if (!p1.alive && !p2.alive) s.winner = "draw";
      else s.winner = p1.alive ? "p1" : "p2";
    }
  }

  private applyIntents(idx: 0 | 1, intents: InputIntent[]): void {
    const s = this.state;
    const player = s.players[idx];
    const opponent = s.players[idx === 0 ? 1 : 0];
    const opponentRows = s.rows[idx === 0 ? 1 : 0];

    for (const intent of intents) {
      if (intent.kind === "activate") {
        const hadEffectHeld = player.heldEffect !== null;
        const activated = activateHeldEffect(player, opponent, opponentRows, s.speedMps, this.rngEffects);
        if (activated) {
          this.pushEvent({ kind: "activate", player: player.id, effect: activated, atS: s.timeS });
          if (activated === "barrage") {
            this.pushEvent({ kind: "opponent-hazard", target: opponent.id, row: -1, atS: s.timeS });
          }
        } else if (hadEffectHeld) {
          // A "barrage" activation can fail transiently (not enough course generated ahead
          // of the opponent yet — see injectOpponentHazard) and leaves the effect held for
          // a later retry. Without this, a player who tapped a live gesture would hear the
          // optimistic confirm cue (main.ts plays it on gesture detection) and see nothing
          // happen, with no way to tell their tap didn't register vs. simply not resolving
          // yet (CQ-05, gauntlet/CRITIQUE-LOG.md).
          this.pushEvent({ kind: "activate-fizzle", player: player.id, atS: s.timeS });
        }
      } else {
        applyIntent(player, intent);
      }
    }
  }

  private resolveRows(idx: 0 | 1): void {
    const s = this.state;
    const player = s.players[idx];
    const rows = s.rows[idx];
    if (!player.alive) return;

    let i = s.nextRowIndex[idx];
    while (i < rows.length) {
      const row = rows[i];
      if (!row || row.z > player.z) break;
      this.resolveRow(player, row);
      i++;
    }
    s.nextRowIndex[idx] = i;
  }

  private resolveRow(player: PlayerState, row: CourseRow): void {
    const s = this.state;
    const lane = currentLane(player);
    const cell = row.cells[lane];
    if (!cell) return;

    let hazardous = false;
    let reason = "";

    switch (cell.kind) {
      case "empty":
        break;
      case "pickup":
        if (!player.heldEffect && cell.effect) {
          player.heldEffect = cell.effect;
          this.pushEvent({ kind: "pickup", player: player.id, effect: cell.effect, atS: s.timeS });
        }
        break;
      case "rail":
        hazardous = true;
        reason = "ran into a rail";
        break;
      case "hurdle":
        if (player.vertical !== "airborne") {
          hazardous = true;
          reason = "hit a hurdle";
        }
        break;
      case "overhead":
        if (player.vertical !== "ducking") {
          hazardous = true;
          reason = "hit an overhead barrier";
        }
        break;
    }

    if (hazardous) {
      if (isInvulnerable(player)) {
        // Shield is a single-charge safety net: consume it on the save. Phase is a
        // continuous immunity window and is left running until its timer expires.
        player.activeEffects = player.activeEffects.filter((e) => e.id !== "shield");
        this.pushEvent({ kind: "near-miss", player: player.id, row: row.index, atS: s.timeS });
        player.nearMissStreak++;
        player.nearMissTotal++;
      } else {
        player.alive = false;
        player.deathReason = cell.opponentCaused ? `opponent-triggered: ${reason}` : reason;
        player.deathRow = row.index;
        this.pushEvent({ kind: "crash", player: player.id, row: row.index, reason: player.deathReason, atS: s.timeS });
      }
    } else if (cell.kind !== "empty" && cell.kind !== "pickup") {
      // Survived a hazard in your own lane (jumped/ducked/moved off it in time): near miss.
      this.pushEvent({ kind: "near-miss", player: player.id, row: row.index, atS: s.timeS });
      player.nearMissStreak++;
      player.nearMissTotal++;
    }
  }

  private pushEvent(e: MatchEvent): void {
    this.state.events.push(e);
  }
}
