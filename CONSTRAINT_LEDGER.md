# Constraint Ledger (current snapshot)

Required top-level artifact per spec section 22. Full evidence, falsifiers, and dependency
tracking live in [`gauntlet/CONSTRAINT-LEDGER.md`](gauntlet/CONSTRAINT-LEDGER.md) — this is a
compact status summary pointing there, not a duplicate.

| ID | Claim | Status |
|---|---|---|
| CL-00 | Web/TS+Three.js stack beats Unity/C# for *this container's* build/test needs | supported |
| CL-01 | Three lanes is the strongest baseline lane count | open (default, corroborated by genre research, not A/B tested) |
| CL-02 | Gesture recognition responds inside the perceptual latency budget | supported (JS-side chain only; real device unmeasured) |
| CL-03 | Literal head-on framing becomes unreadable at higher speed/complexity | supported — by cross-player obstacle overlap, not the originally-hypothesized closing-speed mechanism |
| CL-04 | Opponent-caused hazards need stronger telegraphing than ordinary obstacles | supported (mechanically; perceptual fairness untested) |
| CL-05 | Deterministic seed-based simulation reduces sync complexity | supported |
| CL-06 | Spectating the survivor after death increases rivalry/rematch motivation | open (implemented short/skippable; untested with humans) |
| CL-07 | Mirrored linked worlds communicate competitive interaction more clearly than head-on | supported (this implementation) |
| INV-01 | Gameplay logic is a pure function of (seed, inputs, elapsed steps) | active, holds by construction + testing |
| INV-02 | No unavoidable death without a prior player decision | active, empirically confirmed across 10,000 seeds |
| H-01 | Mirrored stays readable at higher difficulty tiers than head-on | supported |
| H-02 | 3-lane procedural generation guarantees zero unavoidable-death states by construction | supported |

Statuses use the vocabulary defined in `gauntlet/CONSTRAINT-LEDGER.md`: `open` · `supported` ·
`weakened` · `falsified` · `superseded` · `unresolved`. None are `falsified` as of this
snapshot; none should be read as human-validated — see `gauntlet/GAPS.md` G-01.
