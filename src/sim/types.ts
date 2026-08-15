export type LaneIndex = number; // 0..LANE_COUNT-1

export type CellKind =
  | "empty"
  | "rail" // hard barrier: lane-change only, never jumpable/duckable
  | "hurdle" // must jump; jump or lane-change both clear it
  | "overhead" // must duck; duck or lane-change both clear it
  | "pickup"; // tactical-effect pickup, collect by running through, never harmful

export type EffectId = "shield" | "surge" | "phase" | "barrage";

export interface RowCell {
  kind: CellKind;
  /** Set only on "pickup" cells. */
  effect?: EffectId;
  /** True if this cell was injected by the opponent rather than the base generator. */
  opponentCaused?: boolean;
}

export interface CourseRow {
  /** Row index, monotonically increasing from match start. */
  index: number;
  /** Distance along the track (meters) at which this row sits. */
  z: number;
  cells: RowCell[]; // length === LANE_COUNT
}

export type InputIntent =
  | { kind: "lane"; direction: -1 | 1 }
  | { kind: "jump" }
  | { kind: "duck" }
  | { kind: "activate" };

export interface ActiveEffect {
  id: EffectId;
  remainingS: number;
}

export type VerticalState = "grounded" | "airborne" | "ducking";

export interface PlayerState {
  id: "p1" | "p2";
  isAI: boolean;
  lane: LaneIndex;
  targetLane: LaneIndex;
  laneProgress: number; // 0..1, 1 = fully arrived at targetLane
  z: number; // distance traveled along own track
  vertical: VerticalState;
  verticalProgress: number; // 0..1 through jump/duck
  alive: boolean;
  distance: number; // score proxy
  heldEffect: EffectId | null;
  activeEffects: ActiveEffect[];
  deathReason: string | null;
  deathRow: number | null;
  nearMissStreak: number;
  nearMissTotal: number;
}

export type CameraMode = "head-on" | "mirrored";

export interface MatchConfig {
  seed: number;
  cameraMode: CameraMode;
}

export interface MatchState {
  seed: number;
  timeS: number;
  speedMps: number;
  players: [PlayerState, PlayerState];
  /** Independent generated course streams, one per player (their own "lane" of the shared match). */
  rows: [CourseRow[], CourseRow[]];
  nextRowIndex: [number, number];
  status: "countdown" | "running" | "finished";
  countdownS: number;
  winner: "p1" | "p2" | "draw" | null;
  events: MatchEvent[];
}

export type MatchEvent =
  | { kind: "crash"; player: "p1" | "p2"; row: number; reason: string; atS: number }
  | { kind: "near-miss"; player: "p1" | "p2"; row: number; atS: number }
  | { kind: "pickup"; player: "p1" | "p2"; effect: EffectId; atS: number }
  | { kind: "activate"; player: "p1" | "p2"; effect: EffectId; atS: number }
  | { kind: "opponent-hazard"; target: "p1" | "p2"; row: number; atS: number }
  | { kind: "activate-fizzle"; player: "p1" | "p2"; atS: number };
