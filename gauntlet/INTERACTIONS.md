# Interaction & Conditional Outcome Log

Use this when something works or fails and surrounding state may explain the result. Never collapse a conditional observation into a universal rule.

## Interaction template

### I-000 — Event
- **Phase / time:**
- **Variable/intervention:**
- **Expected outcome:**
- **Observed outcome:**
- **State at observation:** game speed; difficulty; obstacle density; telegraph window; camera; input; animation; audio; opponent behavior; performance/device; other relevant conditions.
- **Potential confounders:**
- **Interaction hypothesis:**
- **Discriminating next test:**
- **Result of follow-up:**
- **Conditional learning:**
- **Confidence:**

Prefer: `X produced Y under A/B/C; Y changed when Q changed.`

---

### I-01 — Reaction budget vs. action duration determines whether "early reaction" helps or hurts
- **Phase / time:** Core simulation build, pre-rendering.
- **Variable/intervention:** How far ahead (`reactBudgetS`) an agent starts reacting to an upcoming row, compared against a jump/duck action's fixed duration.
- **Expected outcome:** Wider lookahead (Infinity, for the fairness solver) should only ever help — more foresight, more time to act.
- **Observed outcome:** Wider lookahead *broke* jump/duck specifically: triggering as soon as a row entered awareness (with Infinity budget, that's immediately) let the action's fixed duration fully elapse — back to grounded — before the player physically reached the row. Lane changes, triggered the same early way, were unaffected.
- **State at observation:** Omniscient solver (Infinity budget), 300-seed sweep, generator/collision logic as of WL-01 fix, no rendering yet.
- **Potential confounders:** None identified — reproduced identically across the 300-seed and later 10,000-seed sweep before the fix, and disappeared identically after it.
- **Interaction hypothesis:** The discriminating variable is whether the input is a *toggle* (lane target — no auto-revert) or *time-boxed* (jump/duck — auto-reverts to grounded after a fixed duration regardless of trigger time). Toggle inputs are safe to trigger as early as awareness allows; time-boxed inputs must be gated on `timeToRow <= their own duration`, independent of the agent's overall lookahead.
- **Discriminating next test:** Gated jump/duck triggering on `timeToRow <= JUMP_DURATION_S` / `DUCK_DURATION_S` respectively (ai.ts), leaving lane-change triggering unchanged.
- **Result of follow-up:** 10,000-seed sweep and 200-seed/20,177-crossing reaction-window audit both clean afterward.
- **Conditional learning:** In any lane-runner-style game with time-boxed vertical actions and free lateral movement, "how far ahead can the agent see" and "when should it press the button" are different questions and must be gated separately. Flagged as a game-domain-memory candidate (META-LEARNING.md).
- **Confidence:** High — mechanism is simple and directly reproduced/resolved by a targeted code change, not a statistical artifact.

---

### I-02 — Structural fairness margin and agent error rate trade off directly against session length
- **Phase / time:** Evaluation-harness build, after core sim was fairness-verified.
- **Variable/intervention:** (A) Reaction-window margin generous enough to satisfy INV-02 for any legal prior lane, executed by a deterministic-once-triggered reactive agent with no built-in error rate. (B) Same generator/margins, but the agent has a small, tier-scaled per-row chance of not reacting at all (D-003).
- **Expected outcome:** Fairness margin and difficulty were implicitly assumed to be independent — tightening/loosening one shouldn't obviously control the other.
- **Observed outcome:** (A) produced a median AI-vs-AI session of 86.0s — well past the "short sessions" target — because a margin wide enough to always be *solvable* left a purely time-based, always-correct-once-triggered agent almost nothing to fail at. (B) dropped the median to 33.7s without touching the generator, confirmed by re-running the 10,000-seed fairness sweep clean afterward.
- **State at observation:** Gameplay AI (bounded `reactBudgetS=0.55s`) on both sides, 200 seeds, distance-uncapped (run to crash or 3 simulated minutes).
- **Potential confounders:** The (A) baseline's first measurement (2.0s median) was discarded — it reflected a test-harness bug (p1 driven with empty intents, WL-03), not condition (A) itself; 86.0s is the harness-corrected (A) baseline. The near-miss-per-session increase from 0.83 to 12.97 reflects both the harness fix and the mistake mechanic together and is **not** cleanly attributable to (B) alone — a same-harness, mistake-mechanic-off ablation would isolate it but was not run this session (time budget). The 86.0s → 33.7s session-length delta *is* a clean before/after on the same corrected harness, so that comparison is not confounded the same way.
- **Interaction hypothesis:** "Fairness margin" (does a solution exist) and "difficulty" (does the agent reliably find it) are different axes; a game can be simultaneously perfectly fair and nearly unloseable if the only agents in play execute within the margin deterministically.
- **Discriminating next test:** The deferred harness-fixed / mistake-off ablation described above, to isolate the near-miss-count effect specifically. Also: human playtesting, since both AI configurations are still just simulated proxies for skill.
- **Result of follow-up:** Not yet run.
- **Conditional learning:** Treat "is it solvable" and "does the default agent solve it reliably" as two separate, separately-tunable properties in any procedurally-fair action game. Candidate for game-domain memory, marked provisional pending the ablation and human data.
- **Confidence:** Medium — the core session-length delta is solid, but the mechanism's finer effects (near-miss rate specifically) are confounded as noted above.