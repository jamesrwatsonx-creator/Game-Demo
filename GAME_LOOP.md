# Game Loop

## Core interaction model (spec section 11)

```
RUN → READ COURSE → DODGE / CLAIM TACTICAL EFFECT → ALTER OPPONENT'S COURSE →
READ OPPONENT RESPONSE → COUNTER → SPEED INCREASE → NEAR MISS → CRASH OR SURVIVE →
IMMEDIATE NEXT MATCH
```

Implemented as described, with the "opponent's course" alteration going through the same
fairness machinery as ordinary generation (`injectOpponentHazard`, CL-04) — the design
insight from this build is that this makes "is an opponent attack fair" reduce to the exact
same reachability proof as ordinary course fairness, rather than needing a separate one.

## One-thumb input schema (4 gestures — spec section 7)

| Gesture | Action |
|---|---|
| Swipe left/right | Change lane |
| Swipe up | Jump (clears a `hurdle`) |
| Swipe down | Duck (clears an `overhead`) |
| Tap | Activate held tactical effect |

Keyboard fallback (arrows/space/enter) exists for desktop dev and Playwright automation, not
as a shipped control scheme.

## Tactical effects (spec section 11)

Picked up by running through a `pickup` cell (always placed in an otherwise-empty lane — a
pickup is never itself a risk, see `course.ts`). Only one effect can be held at a time; tap
to activate.

| Effect | Target | Effect |
|---|---|---|
| Shield | Self | Single-charge: negates the *next* crash within 4s, then expires |
| Surge | Self | +35% speed for 3s — a deliberate self-inflicted tightening of your own reaction margin; the risk is real but is a *consequence of your own decision*, not an unfair trap (see `gauntlet/INTERACTIONS.md` I-02 for the fairness reasoning) |
| Phase | Self | Full immunity to rail/hurdle/overhead for 2.5s (continuous, multi-hit) |
| Barrage | Opponent | Injects a hazard into the opponent's upcoming course, at ≥1.6x the ordinary reaction-time floor ahead of them (CL-04) |

Effects considered and deliberately **not** built this session (spec section 11's "do not
keep an effect merely because it sounds interesting" instruction): lane pressure, ghost
(distinct from phase — judged redundant), forced-jump telegraph (subsumed by barrage being
able to place a hurdle), temporary lane closure (a rail already does this), obstacle
mutation. Four effects were judged sufficient to demonstrate decision → readable consequence
→ counterplay without diluting comprehension.

## Escalation

Speed ramps continuously with shared average distance traveled (`BASE_SPEED_MPS` →
`MAX_SPEED_MPS`, reached at ~1400m). Course complexity ramps in discrete tiers every
`COMPLEXITY_TIER_ROWS` rows (obstacle density, rail frequency). Row *time*-spacing is held
constant (speed-adjusted) rather than shrinking with speed — see `gauntlet/DECISIONS.md` D-002
— so escalation is expressed as pattern complexity, not as a shrinking, eventually-impossible
reaction window.

## Match lifecycle

`idle` (tap-to-start, one tap, no menus) → `countdown` (2s) → `running` → on crash:
survivor's opponent crashed while the human is alive → `won-transition` (short skippable
"OPPONENT DOWN — NEXT CHALLENGER" banner, ~1.4s, auto-continues into a fresh AI-vs-human
match — the "survivor advances immediately" requirement) — or the human crashed →
`lost-result` (explicit death reason shown, e.g. "You hit a hurdle" — the "player can explain
why they died" fairness gate — one-tap REMATCH). No ads, no forced waits, no additional
screens at any point in this loop.

## AI challenger

Reads the same generated course a human would see and reacts within a bounded time budget
(beatable by design — see `gauntlet/DECISIONS.md`/`ai.ts` docstring on why an omniscient
opponent was judged to feel less fair). Has a small, tier-scaled, deterministic per-row
chance of missing its reaction entirely (D-003) — without this, the AI's execution is
essentially perfect within its budget (see `gauntlet/INTERACTIONS.md` I-02), which produced
sessions far longer than the "short sessions" target before the mechanic was added.
