# HEAD-ON

A mobile-first 3D prototype of a one-thumb competitive endless runner: two players race
through independently-fair, seed-generated courses, using swipes to dodge and tactical
effects to reach into their opponent's course. Built in TypeScript + Three.js (see
`ARCHITECTURE.md` for why not Unity, given this project's execution environment).

## Run it

```
npm install
npm run dev        # local dev server, open on a phone or resize the browser to portrait
```

## Test it

```
npm test            # deterministic sim tests: fairness sweep, reaction-window audit, session sim
npm run test:e2e     # Playwright: loads the real build in Chromium, screenshots both camera modes
npm run build        # production build + typecheck
```

## Controls

Swipe left/right to change lanes, swipe up to jump, swipe down to duck, tap to fire a held
tactical effect. Arrow keys + space/enter work as a desktop/automation fallback.

## Where things are documented

- `GAME_LOOP.md` — the actual interaction model, effects, and match lifecycle.
- `ARCHITECTURE.md` — code layout, stack rationale, determinism, what isn't built yet.
- `EVALUATION.md` — automated test results against the spec's hard/experience gates.
- `BENCHMARK_FINDINGS.md` — genre research and what it did/didn't inform.
- `CONSTRAINT_LEDGER.md` — current status of every tracked design claim.
- `gauntlet/` — the full evidence trail (decisions, timeline, critique log, gaps, meta-learning)
  behind every claim in the docs above. Governed by `GAUNTLET-EXPERIMENT.md`.
