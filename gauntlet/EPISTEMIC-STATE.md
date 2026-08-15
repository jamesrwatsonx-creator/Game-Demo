# Epistemic State

Maintain only material knowledge. Preserve conditions and evidence.

## Invariants

| ID | Claim | Scope | Basis | Exceptional falsifier | Status |
|---|---|---|---|---|---|
| INV-01 | Deterministic gameplay logic must stay a pure function of (seed, input sequence, elapsed fixed-steps), independent of rendering/frame rate. | Whole build | Architecture contract section 13; required for CL-05, replay, future netcode. | A gameplay mechanic that cannot be expressed this way without breaking fairness/testability. | active |
| INV-02 | No generated course/effect state may create mathematically unavoidable death when the player has not already made a losing decision. | Course/effects generator | Mathematical Pacing Theorist mandate (section 8); enforced by survivability test suite. | Any seed in the survivability suite producing an unavoidable death from a neutral prior state. | active |

## Priors

| ID | Claim | Evidence/basis | Confidence | Conditions | Falsifier | Status |
|---|---|---|---:|---|---|---|

## Hypotheses

| ID | Claim | Why it matters | Test | Expected signal | Confidence | Status |
|---|---|---|---|---|---:|---|
| H-01 | Mirrored linked-world camera stays readable at higher difficulty tiers than literal head-on. | Resolves CL-03/CL-07, the core presentation-model decision. | Build both, compare screenshots + obstacle/opponent legibility at matched difficulty tiers. | Head-on shows increasing visual clutter/foreshortening near top speed; mirrored keeps consistent chase-cam depth cues. | Medium | open |
| H-02 | A 3-lane course with seeded procedural generation can guarantee zero unavoidable-death states across the full escalation curve by construction (reachability-checked generator) rather than by post-hoc filtering. | Determines whether INV-02 is enforced structurally (cheap, always true) or statistically (expensive, only probably true). | Generator only ever leaves ≥1 reachable lane/action from any prior legal state; verified by exhaustive per-step reachability check, not just random sampling. | 10,000-seed suite: 0 unavoidable-death detections. | High | **supported** — 10,000/10,000-seed sweep clean (tests/unit/survivability.test.ts) after fixing two *implementation* bugs the structural proof itself did not prevent (WL-01, WL-02). The proof holds; it constrains the generator, not the agent executing the rescue — see D-002 "later assessment." |

## Observations

| ID | Observation | Conditions | Measurement/evidence | Related claims | Time/phase |
|---|---|---|---|---|---|
| OBS-01 | Zero unavoidable-death detections across 10,000 solver-driven seeds spanning the full speed/complexity envelope (~1600m traveled per match, reaching MAX_SPEED_MPS and the top complexity tier). | Omniscient solver (Infinity reaction budget) on both runners, seeds 1-10,000, generator + collision logic as of WL-02 fix. | tests/unit/survivability.test.ts console output, this session (`npx vitest run`). | INV-02, H-02, D-002 | Core-sim phase, pre-rendering |
| OBS-02 | 20,177 row-crossings sampled across 200 seeds: 0 under the 0.50s hard physical floor, 6 (0.03%) under the 0.65s provisional soft target. | Same solver conditions as OBS-01, distance target 1600m. | tests/unit/reaction-window.test.ts console output | CL-04, MIN_REACTION_WINDOW_S | Core-sim phase |
| OBS-03 | A purely time-based, deterministic-once-triggered reactive AI (react budget > every action duration) resolves nearly every row it notices — AI-vs-AI sessions ran a measured 86.0s median before any deliberate error-rate mechanism was added; row-time-gap being deliberately speed-invariant (D-002) means raw speed escalation alone does not tax this kind of agent at all. | Gameplay AI both sides, bounded reactBudgetS=0.55s, no mistake mechanic, 200 seeds. | tests/unit/session-simulation.test.ts console output (pre-D-003 run) | D-002, D-003, section-15 "short sessions" gate | Evaluation-harness phase |
| OBS-04 | After adding a tier-scaled per-row mistake chance to the gameplay AI only (D-003), median AI-vs-AI session dropped to 33.7s (p10 7.7s, p90 35.7s), average near-misses per session rose to 12.97, and the 10,000-seed fairness sweep remained clean — confirming the mistake mechanic did not leak into the solver path. | Same as OBS-03 plus AI_BASE_MISTAKE_CHANCE=0.05 + 0.02/tier, gated off when reactBudgetS is Infinity. | tests/unit/session-simulation.test.ts + tests/unit/survivability.test.ts console output (post-D-003 run) | D-003 | Evaluation-harness phase |

## Contradictions

| ID | Conflicting claim | Contradictory evidence | Possible hidden variable | Next discriminating test | Status |
|---|---|---|---|---|---|

## Revisions

| ID | Previous model | Evidence forcing update | Revised model | Downstream invalidations | Confidence |
|---|---|---|---|---|---:|
