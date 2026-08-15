# Gauntlet Game Build — Experiment Protocol

## Purpose

Build the game defined by the execution prompt to the highest practical quality while preserving a lightweight, contemporaneous evidence trail about how the Gauntlet performs.

The game is the primary product. Instrumentation is secondary. Do not let documentation materially slow construction, replace prototyping, or bias the build toward producing a cleaner experiment.

## Baseline integrity

Treat the supplied game Gauntlet prompt as the baseline execution specification. Do not silently rewrite its methodology to compensate for weaknesses discovered during the run. Execute it normally using best judgment, record material weaknesses as evidence, and continue building.

Never expose private chain-of-thought. Record only decision provenance, observable evidence, tests, outcomes, contradictions, and concise rationale.

## Automatic logging

Maintain the files under `gauntlet/` automatically. The human should not need to manually maintain them.

Log only material events, including:

- a consequential architecture or design decision;
- a hypothesis that is tested, supported, weakened, or falsified;
- research that changes a decision or materially changes confidence;
- a prototype or implementation that unexpectedly succeeds or fails;
- a critic finding that changes downstream work;
- a contradiction between a strong prior and observed behavior;
- a substantial dead end, rebuild, or invalidated branch;
- missing expertise, evidence, tooling, context, or evaluation capability;
- a meaningful human intervention that redirects, corrects, rescues, constrains, or challenges the work;
- a material resource/time inefficiency;
- an interaction where a variable works under one state and fails under another.

Do not log routine edits, obvious implementation steps, or repetitive status updates.

## Epistemic discipline

Do not use a single undifferentiated bucket called “beliefs.” Classify knowledge as:

- **Invariant** — treated as structurally true for this problem unless extraordinary contradictory evidence appears.
- **Prior** — strongly supported but conditional knowledge used as a starting point.
- **Hypothesis** — an open claim being tested in this game.
- **Observation** — what was actually observed or measured.
- **Contradiction** — evidence that conflicts with an invariant, prior, hypothesis, or expected outcome.
- **Revision** — an explicit update to the current model after evidence.

Never promote a local observation into a universal rule without evidence. Never record an outcome without the conditions under which it occurred.

## Conditional interactions

When something works or fails, ask whether surrounding variables contributed. Preserve the state around the event: game speed, obstacle density, telegraphing, camera, controls, audiovisual cues, opponent behavior, device/performance conditions, difficulty, and other materially relevant variables.

Prefer statements of the form:

> X produced Y under conditions A/B/C, and changed when Q changed.

Avoid unsupported statements such as:

> X works.

## Human interventions

When the user materially changes the trajectory, automatically record the intervention in `gauntlet/HUMAN-INTERVENTIONS.md`.

Capture:

- phase;
- concise description of the human input;
- prior system state;
- effect on the plan or artifact;
- intervention class;
- likely underlying failure or preference boundary;
- downstream invalidations or changes;
- possible implication for a future Game Gauntlet.

Classify interventions when possible as: creative-intent correction, missing knowledge, missing critic, bad abstraction, premature commitment, evaluation failure, tool limitation, memory/context failure, coordination failure, or human preference.

## Timing

Record both gameplay timing and Gauntlet timing when material.

Gameplay timing includes input latency, telegraph windows, restart latency, animation duration, escalation rate, reward timing, opponent cadence, match duration, time-to-comprehension, and time-to-tension.

Gauntlet timing includes when research occurred, when specialists or critics became useful, when architecture was committed, when the first playable existed, when assumptions were tested, and when critique arrived.

The objective is to learn not only what intelligence is useful, but **when it becomes useful**.

## Efficiency

Classify substantial research/work as:

- **Decision-changing** — materially changed a consequential decision.
- **Confidence-changing** — materially increased/decreased confidence without changing the decision.
- **Premature** — potentially useful, but performed before evidence or construction made it actionable.
- **Waste** — did not materially affect a decision, confidence, implementation, evaluation, or reusable constraint.

Record exact token, model, tool, elapsed-time, retry, or cost telemetry only when the execution environment exposes it. Never invent precision. If unavailable, state `not observable` rather than estimating as fact.

## Agent/specialist inference

Do not conclude that every missing capability requires a permanent agent. For each gap ask:

1. Could a specialist have prevented expensive downstream work?
2. At what phase would that specialist have had sufficient evidence to be useful?
3. Would prototyping/testing have been cheaper or more reliable than additional reasoning?
4. Is the capability reusable across this game class or specific to this event?
5. Could an existing specialist have covered it with better instructions?

Agent count is not a quality metric.

## Research and theory

Treat psychological, neurological, behavioral, game-design, developer-pattern, market, visual-perception, competition, retention, and other theory as candidate intelligence—not doctrine.

Distinguish established evidence from extrapolation. Critique causal claims, survivorship bias, transferability, confounding variables, and whether a benchmark property is a cause of success or merely correlated with it.

## Creative intent

Optimization must move toward the creator’s intended game, not optimize the idea into a different game without explicit human choice. Record protected creative intent when it becomes clear. Surface consequential preference decisions to the human; infer or test technical/researchable questions when practical.

## End-of-run requirement

When the build reaches its stopping condition, complete `gauntlet/META-LEARNING.md` using evidence from the entire run. Separate what should be kept, changed, removed, added, automated, delayed, asked of the user, and remembered conditionally.

The goal is not to praise the game or the Gauntlet. The goal is to produce evidence for a materially better future Gauntlet Game Builder.