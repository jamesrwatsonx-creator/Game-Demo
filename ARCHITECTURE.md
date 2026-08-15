# Architecture

Companion to `gauntlet/DECISIONS.md` (full provenance) — this is the current-state map.

## Stack

TypeScript + Three.js (WebGL) + Vite, not Unity/C#. See `gauntlet/DECISIONS.md` D-001 for
the full rationale; short version: this execution container has no Unity Editor, Android
SDK, or Xcode, but does have Node and a real Chromium browser, so the web stack is the one
that is actually buildable, runnable, and testable *inside this session* — which is what the
prompt's own override clause (iteration speed / determinism / mobile perf / testing) asks to
be judged against. Package.json pulls in exactly two runtime-relevant dependencies: `three`
(rendering) and nothing else — no physics engine, no state-management library, no UI
framework. Dev dependencies are Vite, Vitest, and Playwright.

## Layering

```
src/
  sim/       deterministic gameplay simulation — pure functions + one stateful Match class.
             No DOM, no THREE, no wall-clock. Fully unit-testable headlessly.
  render/    Three.js scene, cameras, track/runner meshes, particle VFX.
             Reads sim state; never mutates it.
  input/     touch/keyboard gesture recognition -> InputIntent. No sim knowledge beyond the
             InputIntent type.
  audio/     procedural WebAudio cues. No asset files.
  ui/        plain-DOM HUD/overlay. No framework.
  main.ts    wires the above into a fixed-step accumulator game loop.
```

This mirrors the "Architecture Contract" (input / deterministic gameplay state / networking
state / visual interpolation / rendering / effects, each separate) fairly directly, with
networking state omitted because no networking exists yet (see "What's not built" below) —
the seam is already where it would go (`Match.step(intentsP1, intentsP2)` takes explicit
per-tick input for both sides, which is exactly what a lockstep netcode layer would feed).

## Determinism (CL-05)

`Match` advances in fixed `1/60s` steps (`FIXED_STEP_S`). All randomness goes through a
seeded `Rng` (mulberry32) — no `Math.random`, no `Date.now()`, no wall-clock dependence
anywhere in `src/sim/`. Course generation for each player uses its own RNG stream, derived
deterministically from the match seed (`streamSeed(seed, "p1"|"p2")`), so `p1` and `p2` get
related-but-independent courses from one shared seed. Verified empirically across 10,000+
seeds (`tests/unit/survivability.test.ts`, `tests/unit/reaction-window.test.ts`) — same seed
always produces the same trace.

## Fairness (INV-02)

Enforced *structurally* by the course generator, not by post-hoc filtering — see the
docstring in `src/sim/course.ts` for the full reachability argument, and `gauntlet/DECISIONS.md`
D-002 for how construction found two implementation bugs the structural proof itself did not
prevent. Empirically confirmed: 10,000/10,000 solver-driven seeds survive the full
speed/complexity envelope with zero unavoidable-death detections.

## Rendering / camera (CL-03, CL-07, D-004)

Two presentation modes were built and compared with actual screenshots at matched difficulty
tiers (not just reasoned about) — see `gauntlet/DECISIONS.md` D-004 and `test-results/camera-*.png`.
**Mirrored** (portrait split-screen, each half an independent chase camera on one player's own
track) is the default; **Head-On** (both tracks rendered into one shared, bounded, wrapped
lane corridor) is retained as a togglable secondary mode but degrades at the top difficulty
tier due to cross-player obstacle overlap. Both modes use Three.js `Layers` (layer 1 = p1's
geometry, layer 2 = p2's) so the same scene graph serves both without duplicating meshes.

## Performance choices

- Obstacle/pickup meshes are object-pooled per `TrackView` (`acquire()`/visibility toggling),
  not created/destroyed per frame.
- No physics engine — lane position and jump/duck arcs are explicit interpolated math
  (`player.ts`), not rigid-body simulation, matching the "use explicit movement mathematics"
  guidance for this kind of deterministic lane-runner motion.
- No asset loading — geometry is procedural THREE primitives, audio is procedural WebAudio
  oscillators. Zero network requests for game assets; total JS bundle is ~514KB
  (~132KB gzip), dominated by Three.js itself. Not yet code-split (`vite build` warns on
  chunk size) — noted as a deferred optimization in `gauntlet/GAPS.md`, not yet measured
  against an actual "fast launch" budget because no real device is available in this session.

## What's not built (explicit scope cut, see `gauntlet/DECISIONS.md` D-001/EXPERIMENT.md)

- **Real-time multiplayer networking.** The prompt explicitly allows this: "The first
  prototype does not require production multiplayer if AI simulation can validate the
  interaction model faster." `Match.step()`'s explicit dual-intent signature is the seam a
  lockstep/rollback netcode layer would plug into without restructuring the simulation.
- **Native iOS/Android builds.** No Xcode/Android SDK in this container (same limitation the
  prompt already accepts for a Unity build in this environment). A Capacitor/PWA wrapper path
  is the natural next step but was not attempted this session — see `gauntlet/GAPS.md`.
- **Human playtesting** of any kind (see `gauntlet/GAPS.md` G-01) — every "fun"/"fair"/
  "comprehensible" claim in this repo is either a structural guarantee, an AI-simulated
  proxy, or first-principles reasoning, explicitly not a human-confirmed result.
