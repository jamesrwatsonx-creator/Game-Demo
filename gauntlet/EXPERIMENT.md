# Experiment #1 — Baseline Record

## Purpose

Use the current game build as the first empirical test of the Gauntlet methodology and generate evidence for the future Gauntlet Game Builder.

## Baseline execution prompt

The harness preserves the initiating user turn immutably (first user message of session on branch `claude/competitive-endless-runner-3d-ndw3lr`, 2026-08-15). It is the full 41-section Gauntlet governing prompt for a "one-thumb competitive head-on endless runner." Not duplicated here to keep this file navigable; treat the original session transcript as the source of truth if wording is ever in question.

## Starting user intent

Production-quality mobile-first 3D prototype: two players race **toward one another** through a shared dynamic course (head-on framing explicitly proposed, not mandated — CL-03/CL-07 test it). Swipe-based one-thumb control; lane change, jump, dodge. Players trigger obstacles or temporary tactical effects that influence the *opponent*, not just their own runner — the opponent is meant to become "a human-controlled source of uncertainty inside your obstacle stream." Continuous escalation. On crash, survivor advances immediately to next opponent/AI challenger. Explicit non-goal: "Subway Surfers multiplayer" clone — the goal is to recover *why* the genre works and build something structurally new from those principles, not imitate surface features.

Protected creative premises (do not silently optimize away without surfacing to human): (1) head-to-head framing as the emotional core, even if final camera solution is mirrored rather than literal head-on; (2) opponent actions must be legible causes of the player's obstacle stream, not hidden randomness; (3) deaths must be explainable by the player's own prior decision; (4) one-thumb precision at escalating speed.

## Starting benchmark / inspiration

Named genre classes only (no specific measured benchmark data supplied): Subway Surfers-style endless runners, hypercasual lane runners, gun runners, obstacle runners, fast competitive arcade games, Vampire Survivors-style escalating pressure, one-thumb mobile action games, short-session PvP games. No numeric benchmark timings were supplied by the human — any timing figures used during this build are Derivable/Inferable estimates, never claimed as measured benchmark fact (see CONSTRAINT-LEDGER.md).

## Starting environment

Prompt's default candidate stack: Unity LTS + C#, targeting iOS/Android portrait, Unity Input System, Unity Test Framework, Unity Profiler, Netcode for GameObjects treated as a candidate not a mandate, Addressables only if justified. Prompt explicitly permits deviation: "Prefer Unity/C# only if it survives comparison against viable alternatives... Do not treat the requested stack as sacred if another production-capable option materially improves iteration speed, deterministic simulation, mobile performance, or testing." See D-001 in DECISIONS.md for the actual stack chosen and why.

## Starting success bar

Hard gates: automated course survivability across the difficulty envelope; input responsiveness inside a validated perceptual target; stable target mobile frame rate on representative hardware; no critic-identified unavoidable-death state; camera readable across the full speed curve. Experience gates: ~5s comprehension, ~15s tension onset, one-thumb precision at high speed, explainable deaths, regular survivable near-misses, voluntary immediate rematch, chosen presentation model preferred over the rejected alternative. Continue only while marginal improvement exceeds marginal cost, then stop.

## Experimental questions

This experiment should produce evidence about:

- which research and intelligence materially changed game quality;
- which work was unnecessary, premature, or duplicated;
- what construction discovered that analysis did not;
- which critics mattered and when;
- which gaps caused expensive downstream work;
- which human interventions revealed missing intelligence versus genuine preference;
- how conditional interactions affected apparent successes/failures;
- which gameplay and Gauntlet timing variables mattered;
- what should become reusable prior knowledge versus remain game-specific;
- what the future Game Builder should automate, hide, surface, test, or ask.

## Integrity rule

Do not rewrite this baseline after observing results. Corrections and updates belong in the other experiment artifacts.