# Timeline

Record material events only. Use actual timestamps when available; otherwise record phase/order without inventing time.

| Time / sequence | Phase | Event | Why material | Inputs available then | Result | What became possible next |
|---|---|---|---|---|---|---|
| Seq 1 (session start, 2026-08-15) | Pre-build | Environment probe (`which node/npm/unity`, Playwright browser path check) | Directly decided D-001 (engine/stack) before any code was written | Gauntlet prompt, empty repo w/ instrumentation templates only | No Unity/Xcode/Android SDK; Node 22 + Playwright/Chromium confirmed present | Committed to TS+Three.js stack; unlocked headless testing plan |
| Seq 2 | Core sim build | First 300-seed survivability sweep run, before any rendering code existed | First real evidence check of the structural fairness proof (D-002) | Deterministic sim, no renderer, headless Vitest | Failed — surfaced two implementation bugs (WL-01, WL-02) in ~1s per run | Fixed both; re-ran clean; validated H-02 |
| Seq 3 | Evaluation harness | AI-vs-AI session simulator, first (buggy) then corrected run | Discovered a design tension (generous fairness margin ⇒ near-unbeatable deterministic AI ⇒ 86s median sessions) that pure derivation would not have surfaced before a runnable simulation existed | Working sim + AI, still pre-rendering | 86.0s median (harness-corrected); "short sessions" gate at risk | Added D-003 (tier-scaled AI mistake chance); re-measured at 33.7s median, re-confirmed 10,000-seed fairness sweep clean |
| Seq 4 | Rendering build | Built both camera modes, screenshotted at matched difficulty tiers via Playwright | Resolved CL-03/CL-07/H-01 with actual visual evidence instead of only derivable/inferable reasoning | Working renderer, both camera modes, debug fast-forward hook (after 2 of its own bugs fixed — WL-06/07/08) | Head-on degraded at the top tier (cross-player obstacle overlap, not the originally-hypothesized closing-speed foreshortening); mirrored stayed legible at every tier tested | Shipped mirrored as default (D-004); CL-03/CL-07 moved from open to supported, with the causal-mechanism nuance preserved rather than overclaimed |

## Timing findings

| Capability / action | Introduced when | Best timing indicated by evidence | Evidence | Future implication |
|---|---|---|---|---|
| Headless survivability/session simulation | Immediately after the core sim compiled, before any rendering/input/UI code | Confirmed optimal — every bug and design-tension finding in Seq 2/3 was caught in seconds of headless test time, before it could have been (much more expensively) discovered by looking at a running 3D prototype | WL-01 through WL-05 (WORK-LOG.md); each fix-and-reverify cycle took under a minute of tool time | Future Gauntlets on this game class should treat "get the deterministic sim + a fast automated evaluation harness running headlessly" as the first construction milestone, strictly before any rendering work — not merely a nice-to-have parallel track |

## Timing findings

Record evidence about when research, critique, specialists, tests, or decisions were useful or premature.

| Capability / action | Introduced when | Best timing indicated by evidence | Evidence | Future implication |
|---|---|---|---|---|
