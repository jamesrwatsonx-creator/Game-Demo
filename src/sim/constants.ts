/**
 * Tunable gameplay constants.
 *
 * Every value below is classified per the Gauntlet's evidence discipline so nothing here
 * is mistaken for a measured benchmark fact:
 *   OBSERVABLE  — measured in this build (Playwright/Vitest instrumentation).
 *   INFERABLE   — genre-convention-driven, not independently re-measured here.
 *   DERIVABLE   — follows from math/perception/engineering constraints stated in comments.
 *   ARBITRARY   — a taste choice with no principled derivation; cheap to change, flagged
 *                 as a follow-up experiment rather than asserted as correct.
 *
 * See gauntlet/CONSTRAINT-LEDGER.md for the claims these constants are load-bearing for.
 */

// --- Track geometry ---------------------------------------------------------

/** CL-01, INFERABLE (genre convention). Kept as a constant so a 4-lane variant is a one-line test. */
export const LANE_COUNT = 3;

/** ARBITRARY — thumb-ergonomics-plausible, not yet human-tested. */
export const LANE_WIDTH_M = 2.2;

// --- Player kinematics -------------------------------------------------------

/**
 * DERIVABLE: a lane change should *begin* inside the "instant" perceptual latency budget
 * (commonly cited ballpark ~100ms for input-to-response to read as immediate; see CL-02)
 * and *complete* quickly enough that back-to-back lane reads stay legible. 180ms total
 * travel time is a provisional engineering choice tested by the input-latency harness,
 * not a measured figure.
 */
export const LANE_CHANGE_DURATION_S = 0.18;

/** ARBITRARY, tuned so the jump arc reads clearly at BASE_SPEED without floating. */
export const JUMP_DURATION_S = 0.5;
export const JUMP_HEIGHT_M = 1.6;

/** ARBITRARY, kept short and symmetric with jump. */
export const DUCK_DURATION_S = 0.4;

/** Player can steer laterally while airborne — DERIVABLE fairness requirement: locking
 * lane input during a jump would create compound obstacles (row i needs a jump, row i+1
 * needs a lane change) that are impossible to resolve in order. See D-002. */
export const AIR_STEERING_ENABLED = true;

// --- Speed / escalation -------------------------------------------------------

/** ARBITRARY starting pace (~32 km/h), chosen to be readable at first contact (5s comprehension gate). */
export const BASE_SPEED_MPS = 9;

/** ARBITRARY escalation ceiling (~94 km/h) — spectacle target, not a physically derived limit. */
export const MAX_SPEED_MPS = 26;

/** DERIVABLE-ish: speed ramps continuously so escalation is felt, not stepped. Distance-based
 * (not time-based) so a defensively-playing runner does not outrun their own skill floor. */
export const SPEED_RAMP_PER_METER = (MAX_SPEED_MPS - BASE_SPEED_MPS) / 1400;

// --- Fairness / reaction window -----------------------------------------------

/**
 * DERIVABLE ballpark: simple/choice visual reaction time plus swipe execution time is
 * commonly discussed in the 200-600ms range; 650ms is a provisional floor that leaves
 * margin above raw reaction time for the "read + decide + execute" chain a lane-runner
 * actually demands. NOT a measured benchmark number — treated as a hypothesis the
 * Reaction Window Audit (tests/unit/reaction-window.test.ts) checks on every generated seed.
 */
export const MIN_REACTION_WINDOW_S = 0.65;

/**
 * DERIVABLE: opponent-caused hazards carry a fairness/legibility premium (CL-04) — they
 * must be even more clearly telegraphed than ordinary course obstacles because the player
 * did not choose to encounter them from a shared, predictable procedural stream. Expressed
 * as a multiplier on the reaction-window floor so it scales with whatever that floor is
 * tuned to, rather than being an independent magic number.
 */
export const OPPONENT_HAZARD_TELEGRAPH_MULTIPLIER = 1.6;

/**
 * DERIVABLE: row-to-row time gap is held at/above the time a full lane change plus a small
 * decision buffer needs, so density/complexity — not a physically impossible window — is
 * the actual escalation lever. This is the structural mechanism behind INV-02.
 */
export const MIN_ROW_TIME_GAP_S = 0.9;
export const MIN_ROW_SPACING_M = 6;

/**
 * Structural fairness guarantee (see D-002 / INV-02): the row gap is chosen to strictly
 * exceed both action durations, so any vertical action taken for row i always fully
 * resolves before row i+1 must be evaluated — no compound "still mid-jump when the duck
 * check happens" ambiguity. Enforced by an assertion in course.ts, not just documentation.
 */
export const ROW_GAP_EXCEEDS_ACTIONS =
  MIN_ROW_TIME_GAP_S > JUMP_DURATION_S && MIN_ROW_TIME_GAP_S > DUCK_DURATION_S && MIN_ROW_TIME_GAP_S > LANE_CHANGE_DURATION_S;

// --- Course generation ---------------------------------------------------------

/**
 * How many rows are generated per chunk. Kept small deliberately: row spacing is computed
 * from the player's *actual current speed* at the moment a chunk is generated (see
 * course.ts), and speed keeps ramping while that chunk is traversed. A small chunk keeps
 * the drift between "speed assumed at generation" and "speed when the row is actually
 * reached" negligible; a large chunk would let later rows in the chunk arrive faster than
 * their spacing assumed, quietly eroding the reaction-window guarantee. Verified empirically
 * by the reaction-window audit rather than assumed correct from the formula alone.
 */
export const COURSE_CHUNK_ROWS = 8;

/** Safety margin applied on top of MIN_ROW_TIME_GAP_S at generation time to absorb the
 * within-chunk speed-ramp drift described above. ARBITRARY starting value, tuned against
 * the reaction-window audit until it reports zero violations. */
export const ROW_GAP_SAFETY_MARGIN = 1.12;

/** Distance (in rows) after which pattern-complexity tier can increase. ARBITRARY pacing choice. */
export const COMPLEXITY_TIER_ROWS = 18;

/** Fixed simulation step. 60Hz gives clean determinism and matches common mobile display refresh. */
export const FIXED_STEP_S = 1 / 60;

// --- Tactical effects -----------------------------------------------------------

export const SHIELD_DURATION_S = 4;
export const SPEED_SURGE_DURATION_S = 3;
export const SPEED_SURGE_MULTIPLIER = 1.35;
export const PHASE_DURATION_S = 2.5;

/** Collision radius used for near-miss detection (lateral distance under which a pass counts as "close"). */
export const NEAR_MISS_LATERAL_M = 0.55;

// --- Presentation (render-layer only; never read by sim code) -----------------------------

/**
 * "Head-on" camera mode (CL-03/CL-07/H-01 comparison target) renders both runners' Z
 * positions wrapped into a bounded arena via modulo, purely as a rendering transform — the
 * underlying simulation stays unbounded and is never touched by this constant. Because both
 * runners advance at roughly the shared global speed, their wrap phases stay roughly
 * synchronized, producing a repeating "approach and pass near the middle" visual whose
 * *cycle frequency* rises as match speed escalates — letting the same escalating-speed
 * mechanic that drives gameplay difficulty also drive visual spectacle, and letting CL-03
 * ("does head-on framing become unreadable as closing speed increases") be evaluated
 * directly from screenshots at low vs. high speed instead of only argued abstractly.
 */
export const HEAD_ON_ARENA_LENGTH_M = 140;
