# Evaluation

Automated evidence, run inside this session (`npm test`, `npm run test:e2e`). Full
provenance/timeline in `gauntlet/`; this is the results summary mapped to spec section 14/21.

## Hard gates (spec section 21)

| Gate | Status | Evidence |
|---|---|---|
| Course survivability across the intended difficulty envelope | **PASS** | `tests/unit/survivability.test.ts`: 10,000/10,000 solver-driven seeds survive from base tier to MAX_SPEED_MPS/top complexity tier (~1600m traveled), zero unavoidable-death detections. Two implementation bugs found and fixed en route (`gauntlet/WORK-LOG.md` WL-01/WL-02) — the structural fairness proof was correct, the first two implementations of the agent executing it were not. |
| Input responsiveness inside a validated perceptual target | **PARTIAL** | `tests/e2e/smoke.spec.ts` measures ~1.1-1.3ms from gesture-detected timestamp to next rendered frame. This measures the JS-side chain (event → logical update → next `requestAnimationFrame`) only — it does **not** measure real touchscreen-to-glass hardware latency, browser event-dispatch overhead, or compositor/paint latency, none of which this headless container can observe. Treat the sub-2ms figure as evidence the *simulation and render pipeline* add negligible latency of their own, not as a claim about real-device end-to-end latency. |
| Target mobile frame rate stable on representative hardware | **NOT OBSERVABLE HERE** | No physical mobile device or GPU-accelerated headless renderer with representative hardware is available in this container. `renderer.info` draw-call counts are low (pooled meshes, ≤ a few dozen active obstacles + 2 runners + particles) and the architecture avoids per-frame allocation-heavy patterns, which is *derivable* evidence toward good performance, not a measurement. |
| No critic identifies a material unavoidable-death state | **PASS** (automated critic) | Telegraphed-Death Auditor pass (below) ran against the actual generator/solver, not just design intent. |
| Camera remains readable across the intended speed curve | **PASS (mirrored) / FAIL (head-on)** | See Camera Comparison below — this is itself the evaluation result, not a pre-decided assumption. |

## Course survivability sweep

`tests/unit/survivability.test.ts`. Both runners driven by the omniscient solver (infinite
reaction lookahead, `ai.ts`) rather than the gameplay AI, turning "did a competent player
die" into "does an unavoidable-death state exist at all." 10,000 seeds, ~1600m traveled per
match (covers the full speed ramp and all complexity tiers). Result: 0 failures. Runtime:
~47s for the full 10,000-seed sweep in this container.

## Reaction-window audit

`tests/unit/reaction-window.test.ts`. 200 seeds, 20,177 sampled row-crossings. Two floors
checked: a **hard physical floor** (max single-action duration, 0.50s) — 0 violations; and a
**provisional perceptual soft target** (0.65s, explicitly marked DERIVABLE/not human-measured
in `gauntlet/CONSTRAINT-LEDGER.md`) — 6 violations (0.03%), all attributable to a player's own
prior decision (e.g. self-activated speed surge tightening their own margin, see
`gauntlet/INTERACTIONS.md` I-02), not to unfair generation. Opponent-hazard injection
(`injectOpponentHazard`) is separately unit-tested to always respect its amplified 1.6x
lead-time requirement (CL-04) across a range of speeds, and to never create a second `rail`
in an already-occupied row.

## Session simulator

`tests/unit/session-simulation.test.ts`. AI-vs-AI (gameplay-budget AI, both sides), 200
seeds. Current tuning: median 33.7s, p10 7.7s, p90 35.7s, 0/200 sessions failed to resolve,
12.97 near-misses per session on average. This required one iteration (`gauntlet/DECISIONS.md`
D-003) — the first measurement (86.0s median) revealed that generous, structurally-fair
reaction margins make a purely time-based deterministic AI nearly unbeatable, which pure
derivation did not surface before a runnable simulation existed. The p90≈median clustering
(rather than a longer natural tail) is flagged as unexplained in `gauntlet/DECISIONS.md`
D-003 — noted, not silently smoothed over.

## Camera comparison (CL-03 / CL-07 / H-01)

Both "Mirrored" and "Head-On" modes were built and screenshotted via Playwright at matched
difficulty tiers — base tier (~34km/h, ~35m) and top tier (94km/h/~1450m, reached via a
solver-driven debug fast-forward, since real-time play takes ~90s+ to reach it). Screenshots
in `test-results/camera-*.png`. At the top tier, Head-On's shared lane corridor visually
overlaps both players' independently-generated obstacles, making cross-player attribution
genuinely ambiguous; Mirrored keeps both halves independently legible throughout. Mirrored
shipped as default (`gauntlet/DECISIONS.md` D-004). This evaluation itself required two
rendering bugs to be found and fixed first (a static, non-tracking head-on camera; a fast-
forward that was actually measuring a restarted low-tier match) — see `gauntlet/WORK-LOG.md`
WL-06/07/08 — a concrete instance of the build discovering things design reasoning alone did
not.

## Telegraphed-Death Auditor (spec section 10, automated form)

Rather than a separate manual audit pass, this critic's mandate — "attempt to produce
unavoidable obstacle combinations, unreadable opponent attacks, reaction windows beneath
human capability, lane-transition traps, overlapping hazards" — is exactly what the
survivability sweep and reaction-window audit above are built to catch automatically and
adversarially (10,000 seeds is a far larger adversarial sample than a manual pass could
produce by hand). No additional unavoidable-death states were found beyond the two
implementation bugs already fixed during construction.

## Not evaluated (see `gauntlet/GAPS.md`)

Human comprehension time, human-perceived fairness, human rematch desire, real touchscreen
latency, real mobile frame rate, cross-device determinism, and any A/B preference between
camera modes by an actual player. These require a human tester and/or physical device, both
absent from this execution environment. Explicitly not claimed as validated.
