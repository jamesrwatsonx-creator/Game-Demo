# Efficiency & Resource Log

The objective is to learn where intelligence and execution created value, where it arrived too early, and where it consumed resources without consequence.

## Work classification

| ID | Phase | Work/research/tool activity | Classification | Decision/confidence affected | Downstream consequence | Better timing/approach |
|---|---|---|---|---|---|---|
| EF-01 | Pre-build | Environment probe (`which`/`ls` for Unity/Node/Playwright) | Decision-changing | D-001 (stack) | Unlocked every later automated test in this repo | Correctly timed — first action of the session |
| EF-02 | Core sim | 300-seed then 10,000-seed solver survivability sweeps (run twice each: pre- and post-fix) | Decision-changing | D-002, INV-02, H-02 | Found and confirmed the fix for two implementation bugs (WL-01/02) | Correctly timed — run immediately after the sim compiled, before rendering existed |
| EF-03 | Evaluation harness | Session-simulation runs (buggy harness, then corrected, then post-D-003) | Decision-changing (2nd/3rd runs), Waste-adjacent (1st run's 2.0s-median result, discarded once traced to a harness bug) | D-003 | The discarded first measurement cost one extra run but also surfaced a real harness bug (WL-03) before it could confound later results | Acceptable — the "waste" was small (one fast headless run) and paid for itself by catching WL-03 |
| EF-04 | Rendering | Camera screenshot comparisons (4 rounds: initial, post-camera-tracking-fix, post-fast-forward-fix, post-freeze-fix) | Decision-changing | D-004, CL-03, CL-07, H-01 | Each round found a real bug (WL-06/07/08); none were repeat-without-new-information | Correctly timed — each fix was validated by immediately re-running the same comparison |
| EF-05 | Late build | Targeted web research (input-latency HCI literature, lane-count convention, session-length data) | Confidence-changing | CL-01, CL-02 evidence quality upgraded in the ledger | No implementation change | Could have run earlier at near-zero cost difference; lateness caused no rework since it didn't gate any decision |
| EF-06 | End of build | Persona-labeled critique pass (CQ-01 through CQ-06) | Decision-changing (CQ-05 fix), Confidence-changing (CQ-01-04, CQ-06 — restating already-known findings under a critic label) | Minor code fix (activate-fizzle event) | Small, real, additional finding beyond the harness | Correctly timed last, once a complete build existed to critique |

## Observable telemetry

| Phase | Model | Calls | Input tokens | Output tokens | Tool calls | Elapsed time | Retries | Cost | Outcome |
|---|---|---:|---:|---:|---:|---|---:|---:|---|
| Whole session | not observable (harness does not expose model/token/cost telemetry to the agent) | not observable | not observable | not observable | not observable | not observable | not observable | not observable | — |

Wall-clock durations for repeatable, in-band operations *are* directly observable from tool
output (not the same as session-level telemetry, but real and worth recording): full
10,000-seed survivability sweep ≈ 47-49s per run (observed 3 times); 200-seed reaction-window
audit ≈ 1.0-1.1s; 200-seed session simulation ≈ 0.3s; full Playwright e2e suite (5 tests,
including a production build) ≈ 21-22s per run (observed 4 times). These are cheap enough in
absolute terms that re-running the full suite after every consequential change (as this
session did) was never a material time cost — worth recording as a concrete data point for
"how cheap does a headless test suite need to be to run continuously without friction," since
that cheapness is exactly what made the build/test-over-reason approach (see META-LEARNING.md)
practical here rather than merely theoretically preferable.

## Resource conclusions

- **Work that prevented expensive rebuilds:** the headless survivability/reaction-window/
  session-simulation harness, run continuously from immediately after the core sim compiled.
  Every bug it caught (WL-01, WL-02, WL-06, WL-07, WL-08) would have been far more expensive
  to find by visual inspection of a running 3D prototype, and at least WL-01/WL-02 would have
  been actively *dangerous* to ship undetected (a real unavoidable-death state).
- **Analysis that should have been delayed until a prototype existed:** none identified —
  this session did not perform extended upfront analysis before construction; it moved to
  building the sim almost immediately after the stack decision.
- **Repeated work caused by missing context/capability:** the debug fast-forward tool
  (`debugFastForwardS`) itself needed two follow-up fixes (WL-07, WL-08) after its first
  version — not because of a missing capability, but because its first implementation
  silently reused an assumption (gameplay AI pacing; real-time-driven continuation) that
  didn't hold for its actual use case. Cheap to fix each time (single-digit tool-call cost),
  but a case where slightly more careful design of the debug tool itself would have avoided
  two of these three iterations.
- **Opportunities to reduce expected total search/build cost:** none of the "confidence-
  changing only" work (EF-05, most of EF-06) was expensive enough in this session to be worth
  deprioritizing further — the actual cost driver in this build was iteration on real bugs
  (EF-01 through EF-04), which is exactly the kind of cost this protocol should not try to
  eliminate, since it's how the bugs got caught before shipping.

Classifications:
- **Decision-changing**
- **Confidence-changing**
- **Premature**
- **Waste**

## Observable telemetry

| Phase | Model | Calls | Input tokens | Output tokens | Tool calls | Elapsed time | Retries | Cost | Outcome |
|---|---|---:|---:|---:|---:|---|---:|---:|---|

Use `not observable` where the harness does not expose exact telemetry. Never invent token counts, elapsed time, or cost.

## Resource conclusions

At major milestones, note only evidence-supported conclusions about:
- work that prevented expensive rebuilds;
- analysis that should have been delayed until a prototype existed;
- repeated work caused by missing context/capability;
- opportunities to reduce expected total search/build cost.