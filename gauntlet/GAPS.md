# Gaps & Missing Capability Log

Record missing intelligence/capability at the moment its absence becomes consequential. Do not automatically convert gaps into permanent agents.

### G-01 — No human playtesting available in this execution environment
- **Phase:** Whole build.
- **Problem encountered:** Section 15's experience gates (5s comprehension, 15s tension onset, perceived fairness, rematch desire) and several ledger falsifiers (CL-04, CL-06, CL-07) explicitly require human judgment. This session has no human testers.
- **Missing knowledge / expertise / evidence / tool / context / evaluation capability:** Real human players; a device lab for actual mobile hardware framerate/thumb-ergonomics validation.
- **Consequence:** All "fun"/"fair"/"comprehensible" claims in this build are AI-simulated proxies (AI-vs-AI session stats, solver-driven fairness sweeps) or first-principles design reasoning, never confirmed against a human. Explicitly flagged rather than silently asserted as validated.
- **How it was eventually resolved:** Not resolved in this session — structural/statistical proxies substituted where possible (survivability sweep, reaction-window audit, session-length distribution), with the substitution's limits stated in each doc.
- **Could it have been predicted earlier?** Yes — obvious from the environment at session start, recorded proactively rather than discovered mid-build.
- **Would a specialist have prevented enough downstream cost to justify itself?** No — no specialist substitutes for an actual human tester; the honest move is flagging the gap, not inventing a fake proxy specialist.
- **Best time for that capability to enter:** Immediately after this session's prototype reaches a playable build (see below) — before any further tuning investment, since tuning without human signal risks overfitting to the AI proxy's specific blind spots (see I-02's unexplained p90≈median clustering).
- **Could an existing specialist cover it instead?** No.
- **Would a prototype/test have been cheaper than more reasoning?** N/A — the prototype exists; what's missing is the human, not more engineering.
- **Future Gauntlet implication:** A Game Gauntlet running inside an agent-only execution environment should explicitly scope its "human quality bar" claims as *pending* rather than attempt to reason its way to a false confidence level. Building the best available automated proxy (this session's approach) is still worth doing, but the meta-learning stage must not let "10,000 seeds passed" or "session length looks arcade-shaped" quietly stand in for "a human found this fun and fair."
- **Confidence:** High.

### G-02 — I-02's mistake-mechanic effect on near-miss rate is confounded, not isolated
- **Phase:** Evaluation-harness build.
- **Problem encountered:** The 86.0s→33.7s session-length comparison (D-03) is a clean before/after, but the accompanying near-miss-rate change (0.83→12.97 per session) conflates a test-harness bug fix (WL-03) with the actual mistake-mechanic change (D-003).
- **Missing knowledge / expertise / evidence / tool / context / evaluation capability:** One more ablation run: harness-fixed baseline with the mistake mechanic explicitly disabled, to isolate its near-miss-rate contribution alone.
- **Consequence:** The near-miss-rate figure in DECISIONS.md/INTERACTIONS.md is reported but not asserted as solely attributable to D-003.
- **How it was eventually resolved:** Not resolved — time-budgeted out of this session in favor of moving on to rendering/input, which were judged higher-value for the primary deliverable (the game) than a confound-isolating measurement on an already-plausible tuning choice.
- **Could it have been predicted earlier?** Only in hindsight — the confound only became visible once WL-03's harness bug and D-003's mechanic were both in the same before/after window.
- **Would a specialist have prevented enough downstream cost to justify itself?** No — this is a one-line follow-up test, not a capability gap.
- **Best time for that capability to enter:** Any future session continuing this codebase's tuning work, before further pacing changes are layered on top of an unverified baseline.
- **Could an existing specialist cover it instead?** N/A.
- **Would a prototype/test have been cheaper than more reasoning?** Yes — it's a single additional simulated run; this is explicitly a "should just run the test" gap, not a reasoning gap.
- **Future Gauntlet implication:** When a harness bug and a real tuning change are fixed in the same iteration, separate them into two measurement passes even under time pressure — cheap insurance against exactly this kind of confound.
- **Confidence:** High.

### G-03 — No native iOS/Android build attempted
- **Phase:** Whole build.
- **Problem encountered:** Spec targets iOS and Android; this container has no Xcode, no Android SDK/NDK, no code-signing tooling.
- **Missing knowledge / expertise / evidence / tool / context / evaluation capability:** Native build toolchains.
- **Consequence:** The prototype runs as a mobile-web app (verified in a real Chromium browser at a mobile portrait viewport via Playwright's device emulation) but has not been packaged, installed, or run as a native app on either platform.
- **How it was eventually resolved:** Not resolved. Architecture is Capacitor-compatible (standard web build output, no framework assumptions that would block wrapping), but wrapping was not attempted this session.
- **Could it have been predicted earlier?** Yes — same limitation acknowledged upfront for the Unity alternative in D-001.
- **Would a specialist have prevented enough downstream cost to justify itself?** No — this is a missing tool/environment, not missing expertise.
- **Best time for that capability to enter:** A follow-up session with the toolchains installed, or a human running `npx cap add ios/android` locally against this repo's `dist/` build output.
- **Could an existing specialist cover it instead?** N/A.
- **Would a prototype/test have been cheaper than more reasoning?** N/A — blocked purely by tooling absence, not by an open question.
- **Future Gauntlet implication:** Game Gauntlets should check for target-platform build tooling at session start (as this one did for Unity) and record the gap immediately rather than discovering it only at packaging time.
- **Confidence:** High.

### G-04 — JS bundle not code-split; real "fast launch" budget unmeasured
- **Phase:** Rendering build.
- **Problem encountered:** `vite build` warns the output chunk (~514KB / ~132KB gzip, dominated by Three.js) exceeds its default 500KB size-warning threshold.
- **Missing knowledge / expertise / evidence / tool / context / evaluation capability:** A real mobile network/device to measure actual cold-launch time against; no stated "fast launch" numeric budget exists anywhere in the governing prompt to test against (would be Arbitrary/Unrecoverable to invent one).
- **Consequence:** Unknown whether 132KB gzip meaningfully affects launch feel on representative hardware/networks — plausibly fine (it's a small download by modern standards) but not measured.
- **How it was eventually resolved:** Not resolved — noted rather than guessed at.
- **Could it have been predicted earlier?** Yes, in principle (Three.js's size is well known), but it only became consequential once the renderer was built, which is the earliest point it could actually be measured.
- **Would a specialist have prevented enough downstream cost to justify itself?** No — a "mobile performance specialist" could not have produced a real number without the same missing device/network access this session lacks.
- **Best time for that capability to enter:** Once a Capacitor/native wrapper exists and can be profiled on real hardware (see G-03).
- **Could an existing specialist cover it instead?** N/A.
- **Would a prototype/test have been cheaper than more reasoning?** Code-splitting the bundle and measuring before/after gzip size would be cheap and could be done now; deferred in favor of finishing core-loop breadth first, per section 19's "spend reasoning on camera/fairness/game-feel, not generic polish, until the core loop passes its quality bar."
- **Future Gauntlet implication:** Track "known-unmeasured performance claims" as a distinct category from "known-bad performance" — this is the former, not the latter.
- **Confidence:** Medium.

## Gap template

### G-000 — Gap
- **Phase:**
- **Problem encountered:**
- **Missing knowledge / expertise / evidence / tool / context / evaluation capability:**
- **Consequence:**
- **How it was eventually resolved:**
- **Could it have been predicted earlier?**
- **Would a specialist have prevented enough downstream cost to justify itself?**
- **Best time for that capability to enter:**
- **Could an existing specialist cover it instead?**
- **Would a prototype/test have been cheaper than more reasoning?**
- **Future Gauntlet implication:**
- **Confidence:**
