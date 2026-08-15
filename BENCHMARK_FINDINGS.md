# Benchmark Findings

Spec section 2 calls for benchmark intelligence on named genre classes (Subway Surfers-style
runners, hypercasual lane runners, gun runners, short-session PvP) with explicit instruction:
"Where exact timing or measurements are observable, measure them. Where they are not
directly observable, mark them as inference... Never invent benchmark precision."

This session did not install or play the benchmark games directly (no mobile device, no game
binaries in this container) — findings below come from a small, targeted round of web
research (section 5's "Targeted Gauntlet": concentrate only on the highest-risk unknowns),
cross-checked against what this build's own construction and automated testing produced.
Every claim here is classified; nothing is asserted as a precisely-measured benchmark figure
this session actually captured with a stopwatch.

## Lane count and swipe grammar (CL-01)

**INFERABLE, corroborated.** Subway Surfers' three-lane, swipe-left/right/up/down/roll
control scheme is well-documented as the genre-defining design, credited by secondary
sources with making the game readable "even at high speeds because the lane structure makes
it easy to anticipate obstacles." Temple Run's contrasting tilt/turn-based design is
described as feeling comparatively "unpredictable." This is consistent with — not proof of —
this build's own CL-01 choice (3 lanes, swipe grammar) and with D-002's finding that fairness
requires bounded lane-change reach, which gets algebraically easier to guarantee with fewer
lanes. Genre convention pointing the same direction as this build's independent derivation is
evidence the derivation isn't obviously wrong, not confirmation it's optimal — a 4-lane
variant remains an open, cheap follow-up test (CL-01 falsifier).

**Sources:** [Games Like Subway Surfers](https://www.blog.udonis.co/top-games/games-like-subway-surfers), [Endless Runners comparison: Subway Surfers vs Temple Run](https://subwaysurferapkzone.com/endless-runners-comparison/)

## Input latency perceptual threshold (CL-02)

**DERIVABLE, cited.** The commonly-referenced "~100ms feels instantaneous" rule of thumb is
real and widely cited in HCI literature, but is a coarse rule, not a single precise constant
— more granular research cited in this session's search finds tap-latency below ~24ms
imperceptible and a just-noticeable-difference around ~64ms for touch events specifically,
with note that "latencies below 100ms were seldom considered in guidelines so far even though
smaller latencies have been shown... to impact user performance negatively." Practical
implication for this build: targeting sub-frame (well under 16.7ms at 60Hz) JS-side latency
is a reasonable engineering target *within* the cited range, not an arbitrary guess — and
this session's own Playwright instrumentation measured the JS-side chain at ~1.1-1.3ms,
comfortably inside every cited threshold. Real device touch-to-glass latency remains
unmeasured (no physical device in this container).

**Sources:** [User Perception of Touch Screen Latency](https://www.researchgate.net/publication/221100500_User_Perception_of_Touch_Screen_Latency), [Are 100ms Fast Enough?](https://www.researchgate.net/publication/317801603_Are_100_ms_Fast_Enough_Characterizing_Latency_Perception_Thresholds_in_Mouse-Based_Interaction)

## Session length / short-session design target

**INFERABLE, triangulated.** Industry data cites hypercasual *app* session lengths in roughly
a 2m39s-6m42s range (these figures vary by source/period and clearly measure a whole app
session — i.e. multiple rounds/rematches back to back — not a single round). This build's own
measured *single-match* AI-vs-AI session length (33.7s median, after D-003's tuning pass) is
a different unit — a "round," not a "session." Multiplying out: ~5-12 rounds at that length
would land inside the cited app-session range, which is a plausible, *consistent* triangulation
rather than independent proof — both figures could be wrong in the same direction, or the
comparison could be confounded by this build's AI-vs-AI proxy not matching real human play
patterns (see `gauntlet/GAPS.md` G-01). Recorded as weak supporting evidence, not as
validation.

**Sources:** [Market Research on User Acquisition for Hyper-Casual Games](https://www.blog.udonis.co/mobile-marketing/mobile-games/market-research-hyper-casual-games), [Mobile Game Session Length](https://www.blog.udonis.co/mobile-marketing/mobile-games/session-length)

## What was deliberately not researched further

Per section 5's Targeted Gauntlet instruction ("research continues only while additional
information could materially change one of these decisions"): exact obstacle spacing/
telegraph-distance figures from specific benchmark titles, exact jump-arc timing curves, and
exact difficulty-ramp curves were not pursued, because (a) this build's own reaction-window
and survivability harnesses can measure and enforce fairness directly and more rigorously
than reverse-engineering another game's numbers would, and (b) the prompt explicitly warns
against inventing precision that isn't actually measurable — copying an unverified number
found in a blog post would not be meaningfully different from inventing one. Where this
build needed a concrete number (row time-gap, jump duration, mistake chance, etc.), it is
recorded in `src/sim/constants.ts` with its actual classification and, where applicable, the
test that empirically validated it — not attributed to an unverified external source.

## Camera/presentation model comparison

This is genuinely novel territory for this game's specific mechanic (two independently-fair
procedural streams rendered as one competitive experience) — no direct benchmark exists for
"literal head-on vs. mirrored linked worlds" in this genre, since standard endless runners are
single-player. This was resolved by construction and screenshot comparison instead of
external research — see `EVALUATION.md` and `gauntlet/DECISIONS.md` D-004.
