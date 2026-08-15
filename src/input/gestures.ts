import type { InputIntent } from "../sim/types";

/**
 * One-thumb gesture grammar (spec section 7 "INPUT SCHEMA"):
 *   swipe left/right → lane change
 *   swipe up          → jump
 *   swipe down        → duck
 *   tap                → activate held tactical effect
 *
 * Four gestures, all executable by a single thumb without repositioning the hand — the
 * "how few gestures can create meaningful tactical depth" target from section 7. Emits the
 * raw detection timestamp alongside each intent so latency can be measured end-to-end
 * (input-detected → logical update → first visible frame) without threading DOM timing
 * through the simulation layer.
 */

const SWIPE_MIN_DISTANCE_PX = 24;
const TAP_MAX_DISTANCE_PX = 18;
const TAP_MAX_DURATION_MS = 250;

export type IntentListener = (intent: InputIntent, detectedAtMs: number) => void;

export class GestureRecognizer {
  private startX = 0;
  private startY = 0;
  private startMs = 0;
  private tracking = false;
  private activePointerId: number | null = null;

  constructor(
    private el: HTMLElement,
    private onIntent: IntentListener,
  ) {
    el.addEventListener("pointerdown", this.onDown, { passive: true });
    el.addEventListener("pointerup", this.onUp, { passive: true });
    el.addEventListener("pointercancel", this.onCancel, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
  }

  dispose(): void {
    this.el.removeEventListener("pointerdown", this.onDown);
    this.el.removeEventListener("pointerup", this.onUp);
    this.el.removeEventListener("pointercancel", this.onCancel);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private onDown = (e: PointerEvent): void => {
    this.tracking = true;
    this.activePointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.startMs = performance.now();
  };

  private onCancel = (): void => {
    this.tracking = false;
    this.activePointerId = null;
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.tracking || e.pointerId !== this.activePointerId) return;
    this.tracking = false;
    this.activePointerId = null;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;
    const dist = Math.hypot(dx, dy);
    const durationMs = performance.now() - this.startMs;
    const detectedAtMs = performance.now();

    if (dist < TAP_MAX_DISTANCE_PX && durationMs < TAP_MAX_DURATION_MS) {
      this.onIntent({ kind: "activate" }, detectedAtMs);
      return;
    }
    if (dist < SWIPE_MIN_DISTANCE_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.onIntent({ kind: "lane", direction: dx > 0 ? 1 : -1 }, detectedAtMs);
    } else {
      this.onIntent(dy < 0 ? { kind: "jump" } : { kind: "duck" }, detectedAtMs);
    }
  };

  /** Desktop/automation fallback — also used by Playwright latency instrumentation, which
   * can dispatch a KeyboardEvent far more reliably headlessly than a synthetic touch
   * sequence across pointer capture quirks. */
  private onKeyDown = (e: KeyboardEvent): void => {
    const now = performance.now();
    switch (e.key) {
      case "ArrowLeft":
        this.onIntent({ kind: "lane", direction: -1 }, now);
        break;
      case "ArrowRight":
        this.onIntent({ kind: "lane", direction: 1 }, now);
        break;
      case "ArrowUp":
      case " ":
        this.onIntent({ kind: "jump" }, now);
        break;
      case "ArrowDown":
        this.onIntent({ kind: "duck" }, now);
        break;
      case "Enter":
        this.onIntent({ kind: "activate" }, now);
        break;
    }
  };
}
