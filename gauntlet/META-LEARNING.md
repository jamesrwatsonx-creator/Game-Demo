# Meta-Learning

Completed at this build's stopping point (see "Stopping condition" note at the end). Grounded
in the contemporaneous evidence in `TIMELINE.md`, `WORK-LOG.md`, `DECISIONS.md`,
`CRITIQUE-LOG.md`, `INTERACTIONS.md`, and `GAPS.md` — not reconstructed from memory.

## What actually mattered

- **Decision-changing research:** the environment capability probe (`which node/npm/unity`,
  Playwright browser check) at session start — directly produced D-001 and made every later
  automated-evaluation claim in this repo actually possible to generate inside this session.
- **Constraints that materially improved the result:** INV-02's structural (not statistical)
  fairness generator (D-002) — a single algebraic invariant (row-gap exceeds every action
  duration; at most one "rail" lane per row) that generalizes across lane counts and reduced
  what could have been an open-ended balancing problem to a checkable property.
- **Assumptions falsified:** none outright. CL-03 was *refined*, not falsified or confirmed
  as originally stated — the observed head-on readability failure was cross-player obstacle
  overlap, not the originally-hypothesized closing-speed foreshortening. Recording this
  distinction (D-004, CL-03 row) rather than collapsing it into "CL-03 confirmed" is itself a
  worked example of the epistemic discipline this protocol asks for.
- **Construction discoveries research could not have known:** five of them, all found only by
  running actual code — WL-01/02 (AI reaction bugs the fairness proof didn't prevent), WL-04
  (fairness margins make a deterministic AI nearly unbeatable), WL-06/07/08 (three separate
  camera/fast-forward bugs only visible in an actual screenshot). None of these were
  predictable from the governing prompt's design reasoning alone.
- **Information that proved premature or wasteful:** none identified as pure waste this
  session. The closest candidate is the late-arriving web-benchmark research (session length,
  latency thresholds, lane-count convention) — it changed *confidence*, not any actual
  implementation decision, so it could have been skipped without changing the artifact,
  though it was cheap and did upgrade CL-01/CL-02's evidence quality in the ledger.

## Specialist / agent effectiveness

This build did **not** instantiate the prompt's prescribed roster (UX Kinematics Analyst,
Mathematical Pacing Theorist, Competitive Psychology Analyst, Arcade Timing Deconstructor,
Mobile Performance/Systems Analyst, 4 named critics) as separate agents or reasoning passes.
One continuous agent covered every role's concerns inline while building — e.g. the
Mathematical Pacing Theorist's mandate ("no generated state may create unavoidable death")
was addressed directly as code (`course.ts`'s reachability proof) plus its empirical test,
not as a standalone analysis document.

- **Unique contribution:** the *concerns* the roster names are real and all got addressed
  (fairness, pacing, camera legibility, input latency, telegraph fairness) — but addressing
  them didn't require separate agents, just discipline to cover each concern inline.
- **Did it affect a consequential decision?** The one explicit critic-style pass performed at
  the end (`CRITIQUE-LOG.md` CQ-01 through CQ-06, labeled by persona) found 6 real findings,
  2 of which (CQ-05, CQ-06) were not already surfaced by the automated harness — a genuine,
  if secondary, contribution.
- **Redundancy:** high, if the roster had been instantiated as literally-separate agents —
  the harness-driven findings (CQ-01 through CQ-04) already covered most of what the
  Telegraphed-Death Auditor, Fun/Tension Critic, and Competitive Fairness Critic are asked to
  find, as a side effect of normal test-driven construction.
- **Best timing:** the critic-style pass was correctly run *last*, after a working, tested
  build existed — running it earlier would have had nothing concrete to critique yet.
- **Essential / conditional / redundant / missing:** the underlying *concerns* are essential;
  the *separate-agent* packaging is conditional at best for a solo build of this size — see
  Final Synthesis "CHANGE" below. What's genuinely missing (not a specialist-organization
  question at all) is a human — see G-01.

## Constraint intelligence

- **Surviving constraints:** INV-01, INV-02, CL-04 (mechanically), CL-05, H-02 — all
  empirically confirmed inside this session, not just asserted.
- **Falsified constraints:** none.
- **Uncertain constraints:** CL-01 (3 vs. 4 lanes — untested), CL-02 (real device latency —
  unmeasured), CL-06 (spectate-beat value — unmeasured), CL-03/CL-07/H-01 (supported by this
  implementation's evidence only, not by human preference data).
- **Construction-discovered constraints:** I-01 (toggle vs. time-boxed inputs need different
  trigger-timing rules), I-02 (fairness margin and difficulty are different, separately-tunable
  axes) — neither was anticipated by the original Constraint Ledger seed.
- **Reusable conditional priors:** see "Game-domain memory" below.

## Research sequencing

- **Research earlier:** nothing identified — the one piece of research done late (web
  benchmark search) didn't gate any decision, so its lateness cost nothing.
- **Research later:** N/A this session.
- **Do not research by default:** exact competitor telemetry/numeric benchmarks — correctly
  skipped per `BENCHMARK_FINDINGS.md`'s explicit reasoning (unverified precision from a blog
  post is not meaningfully better than an acknowledged internal estimate).
- **Build/test instead of reason — the single strongest lesson of this session:** every major
  bug and every major pacing insight came from running code, not from design reasoning on
  paper. See "Gauntlet memory" below for the generalized form of this claim.

## Critique effectiveness

- **High-value critics/findings:** the automated evaluation harness itself functioned as the
  most effective critic in this session (see Timeline "Timing findings"). The end-of-build
  close-reading pass (CQ-05, CQ-06) was a valuable, cheap supplement.
- **Noise:** none generated — no critique was raised and then rejected as unfounded this
  session (a healthy critique process should sometimes reject findings; that this one didn't
  may mean the bar for logging a finding was implicitly conservative, not that every
  hypothesis considered was correct).
- **Missed weaknesses:** likely under-covered — real device performance, real touch latency,
  and all human-facing experience gates are untested, not because critique missed them but
  because no tool in this environment could exercise them (see G-01, G-03).
- **Critique that arrived too early/late:** none identified as mistimed — the camera critique
  (CQ-04) necessarily came after a working renderer existed, which was the earliest it could.
- **Benchmark overfitting detected:** none — see "do not research by default" above; this
  build deliberately avoided importing unverified external numbers as if they were
  measurements.

## Human intervention analysis

Zero interventions this session (see `HUMAN-INTERVENTIONS.md`). Not because human judgment
wasn't needed — several stopping-condition gates are explicitly marked unresolved pending a
human (comprehension time, perceived fairness, rematch desire, presentation-mode preference,
G-01) — but because none of those gates could be exercised without an actual human tester,
so there was nothing for a human to correct or redirect *yet*. This distinguishes "no
intervention occurred" from "no intervention was needed" — the honest reading is the former.

## Memory extraction

### Project memory
Useful only for continuing this specific game — see `ARCHITECTURE.md` "What's not built" and
`GAPS.md` G-01 through G-04 for the concrete next steps (human playtesting, code-splitting,
Capacitor packaging, 4-lane experiment, compound-hazard-row stress test, the deferred
mistake-mechanic/near-miss-rate ablation from G-02).

### Game-domain memory
Potentially reusable conditional knowledge for this class of game (competitive/procedural
lane runners):

- **Claim:** in a lane runner with time-boxed vertical actions (jump/duck) and free lateral
  movement, an agent's "how far ahead do I look" and "when do I actually trigger a time-boxed
  action" must be gated separately — triggering a time-boxed action as early as general
  awareness allows can let it fully resolve *before* the hazard it was meant to cover is
  reached. **Evidence:** I-01 (`gauntlet/INTERACTIONS.md`). **Confidence:** High. **Conditions:**
  any game with fixed-duration actions that auto-revert, combined with free early-reaction on
  other input types. **Falsifier:** a design where all actions are held-duration (not
  fixed-timer) wouldn't need this distinction.
- **Claim:** a course/hazard generator that is fair "by construction" (a solution always
  exists) does not by itself produce a good difficulty curve against a deterministic,
  non-adversarial-noise-driven agent — such an agent will trend toward near-100% success
  inside its designed margins, so intentional, tunable imperfection is a *separate* axis from
  fairness, not a byproduct of it. **Evidence:** I-02, D-003. **Confidence:** Medium (single
  implementation, and the specific near-miss-rate delta is confounded per G-02 — the
  session-length delta itself is not). **Falsifier:** a game whose only opponents are humans
  (no AI proxy in the loop at all) might not need a separate imperfection mechanic, since
  human execution is naturally imperfect.
- **Claim:** rendering two independently-fair, independently-generated procedural streams
  into one *shared* literal camera space (vs. compositing two independent per-track cameras)
  risks a legibility failure at high complexity — obstacles from each stream become visually
  indistinguishable — even when both streams are individually provably fair. **Evidence:**
  CQ-04/D-004, one implementation, no human study. **Confidence:** Medium.

### Gauntlet memory
Knowledge about how to run better game-building Gauntlets:

- **Claim:** for a solo agentic build (no parallel human team), building the deterministic
  simulation plus a fast, headless, automated evaluation harness (survivability sweep,
  reaction-window audit, session simulator) *immediately* after the core sim compiles — before
  rendering, before a formal specialist/critic phase — is higher-leverage than instantiating
  the full prescribed specialist roster as separate reasoning passes first. **Evidence:**
  WL-01 through WL-08 collectively; every bug and every pacing insight in this build's
  evidence trail came from this loop. **Confidence:** Medium-High for this environment and
  agent configuration; this is a claim about what happened in one run, not a controlled
  comparison against actually running the full prescribed roster in parallel.
- **Claim:** environment capability probing (what tooling is actually installed and usable)
  belongs at the very start, before any stack commitment — it can decisively and cheaply
  resolve a "sacred" stack default. **Evidence:** D-001, resolved in the session's first few
  tool calls. **Confidence:** High.
- **Claim:** for a presentation/camera-model comparison, capturing actual screenshots at
  matched difficulty tiers surfaces failure modes that pure derivable reasoning (e.g.
  closing-speed math) did not predict correctly — the *conclusion* can still end up supported,
  but the *mechanism* can be wrong until it's actually looked at. **Evidence:** D-004, CL-03.
  **Confidence:** High for "look before concluding"; the specific mechanism found is
  implementation-specific.
- **Claim:** a dedicated end-of-build critique pass (persona-labeled, close-reading) still
  finds real, additional findings beyond what an automated harness catches, but at a lower
  rate — worth keeping as a final, cheap pass, not worth treating as the primary quality
  mechanism. **Evidence:** `CRITIQUE-LOG.md` effectiveness note (CQ-05/06 vs. CQ-01-04).
  **Confidence:** Medium.

### Do not memorize
Any specific numeric constant in `src/sim/constants.ts` (speed values, mistake-chance
percentages, exact session-length figures) — all explicitly marked provisional/arbitrary in
this build's own classification scheme and none validated against a human. These are
project-specific tuning artifacts produced by one AI-vs-AI proxy configuration, not domain
laws. The 33.7s median session figure specifically carries an acknowledged confound (G-02)
and should not be quoted as a clean result.

## Final synthesis

### KEEP
Targeted, risk-focused research over broad research; graded epistemic states (this session's
CL-03 entry — "supported, but by a different mechanism than hypothesized" — would have been
lost under a flat true/false belief model); structural-fairness-by-construction *combined
with* empirical verification (neither alone would have caught what the other did — see D-002's
"later assessment"); the Constraint Ledger's falsifier column (it made "what would change my
mind" concrete instead of rhetorical); automatic `gauntlet/` evidence logging (it did not
materially slow construction in this session).

### CHANGE
Treat the prescribed specialist/critic roster as a **checklist of concerns to cover inline**
during one continuous, disciplined build-and-test loop by default, reserving actual separate
agent instantiation for cases with genuine parallelizable work (e.g. real concurrent human
research streams, or a build large enough that context-window pressure — not role
specialization — is the binding constraint). This session's evidence is that the concerns are
real and worth tracking explicitly, but the *organizational* overhead of separate agents
found less, later, than one agent running tests continuously.

### REMOVE
Nothing from the protocol's *content*. The implied *sequencing* (extensive upfront research
and specialist analysis across sections 1-8, fully before construction in section 9) should
not be read as a hard gate — this session's highest-value evidence came from building the
deterministic sim and its test harness essentially immediately, then discovering most of what
the upfront analysis sections ask for as a side effect of making tests pass.

### ADD
An explicit, early, load-bearing instruction: **build the deterministic simulation and a fast
headless evaluation harness before rendering, before a dedicated critique phase, and before
extensive specialist deliberation.** This session did this by default engineering judgment,
not because the prompt asked for it in that order, and it was the single highest-leverage
structural choice in the whole build.

### REORDER / DELAY
Defer visual/rendering investment and human-facing polish (VFX richness, camera choice,
audio) until after the sim + harness confirm fairness and pacing are sound — done naturally
in this session (rendering came after the fairness/pacing evidence existed) and it meant the
camera comparison itself could be evidence-based (actual screenshots) rather than speculative.

### AUTOMATE
Environment capability probing at session start (stack decision); continuous `gauntlet/`
evidence logging (proved low-overhead here); running the full automated test suite before any
commit; classifying every numeric constant's evidence tier inline in code comments (this
session did this in `constants.ts` and it made later audits — including this one — much
faster to write, since the classification didn't need to be reconstructed).

### ASK THE USER
Any case where an automated comparison between two legitimate design candidates comes back
genuinely close (this session's head-on-vs-mirrored comparison was fairly decisive, so no ask
was warranted — but a closer result should go to the human per the protocol's own creative-
intent rule). Any decision that would **remove** rather than de-prioritize a protected
creative premise — this session kept literal head-on framing available as a toggle
specifically so the original creative intent (a head-on collision-course fantasy) wasn't
silently discarded in favor of the mode that tested better by default.

### MEMORIZE
The "Game-domain memory" and "Gauntlet memory" claims above, each with their stated
confidence and falsifier — not as unconditional rules.

### NEXT EXPERIMENT
Get this prototype in front of actual human testers — even a handful of informal playtests
would resolve the largest remaining cluster of unresolved gates (G-01: comprehension time,
perceived fairness, rematch desire, presentation-mode preference) that no amount of further
AI-proxy simulation in this environment can substitute for. A secondary, cheaper next
experiment: run the deferred harness-fixed/mistake-mechanic-off ablation (G-02) to cleanly
separate D-003's session-length effect from its near-miss-rate effect before trusting the
near-miss figure in any further tuning decision.

## Rebuild-from-zero test

The smallest materially better Gauntlet for rebuilding this game from the original idea,
per this session's own evidence:

1. Probe environment/tooling capability immediately (this session: a few minutes).
2. Write down only the highest-risk unknowns (this game: fairness-under-execution, camera
   legibility, session pacing, one-thumb input grammar, opponent-hazard fairness) — skip a
   full upfront specialist-roster debate.
3. Build the deterministic simulation and a headless evaluation harness (survivability sweep,
   reaction-window audit, session simulator) *before* any rendering.
4. Only once the harness is green, build rendering with every real presentation candidate,
   compare with actual screenshots at matched difficulty tiers, not abstract reasoning alone.
5. Build input, audio, and UI feel.
6. Run one close-reading, persona-labeled critique pass at the end as a cheap supplement to
   (not replacement for) the harness.
7. **Stop tuning against the AI proxy and get human playtesting before further iteration** —
   continuing to tune session-length/mistake-chance numbers past this point risks overfitting
   to the proxy's specific blind spots rather than to actual player experience.
8. Only after human signal exists, invest in native packaging and real-time networking.

## Stopping condition for this synthesis

Written at the point where: the core loop is implemented and passes every hard gate this
environment can test (10,000-seed fairness sweep, reaction-window audit, session simulator,
input-latency instrumentation, camera comparison with real screenshots); every experience
gate this environment *cannot* test is explicitly flagged as unresolved rather than assumed
(`GAPS.md` G-01); and the marginal cost of further automated tuning is judged, on this
session's own evidence (G-02's confound, the un-triaged p90≈median clustering in D-003), to
have started exceeding its marginal value without human signal to aim at. Per the governing
protocol's section 21: further optimization should continue only while expected marginal
improvement exceeds expected marginal cost — that threshold is judged crossed for this
session specifically at the human-testing boundary, not because the game is "finished."
