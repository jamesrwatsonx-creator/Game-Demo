import { createSceneRig } from "./render/scene";
import { TrackView, laneX } from "./render/track";
import { RunnerView } from "./render/runner";
import { VfxSystem } from "./render/vfx";
import { updateChaseCamera, updateHeadOnCamera, headOnRenderZ, wrapZ } from "./render/camera";
import { GestureRecognizer } from "./input/gestures";
import { Hud } from "./ui/hud";
import { AudioCues } from "./audio/cues";
import { Match } from "./sim/simulation";
import { decideAiIntents } from "./sim/ai";
import { hashSeed, Rng } from "./sim/rng";
import { FIXED_STEP_S } from "./sim/constants";
import type { CameraMode, InputIntent, MatchEvent } from "./sim/types";

type Phase = "idle" | "countdown" | "running" | "won-transition" | "lost-result";

const P1_COLOR = 0x33ffaa;
const P2_COLOR = 0xff5577;
const WON_TRANSITION_S = 1.4;

class App {
  // Declared (not initialized) here — assigned explicitly in the constructor body, in
  // dependency order. Class-field initializers run *before* TypeScript parameter-property
  // assignment (`constructor(private container: HTMLElement)` assigns `this.container`
  // inside the constructor body, which executes after field initializers), so anything
  // built from `this.container` as a field initializer would see it as `undefined`.
  private rig!: ReturnType<typeof createSceneRig>;
  private trackP1!: TrackView;
  private trackP2!: TrackView;
  private runnerP1!: RunnerView;
  private runnerP2!: RunnerView;
  private vfx!: VfxSystem;
  private hud!: Hud;
  private audio!: AudioCues;
  private gestures!: GestureRecognizer;

  private match: Match | null = null;
  private pendingP1: InputIntent[] = [];
  private phase: Phase = "idle";
  private cameraMode: CameraMode = "mirrored";
  private accumulatorS = 0;
  private lastFrameMs = 0;
  private seedCounter = Math.floor(Math.random() * 1e9);
  private transitionS = 0;
  private lastCountdownShown: number | null = null;

  /** Instrumentation hook (read by tests/e2e latency spec): last gesture-detected timestamp
   * and the frame timestamp at which its effect first became visible. */
  lastInputLatencySample: { detectedAtMs: number; visibleAtMs: number } | null = null;
  private pendingLatencyDetectedAt: number | null = null;

  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    this.rig = createSceneRig(this.container);
    this.trackP1 = new TrackView(this.rig.scene, 0x0c0c1c, 1);
    this.trackP2 = new TrackView(this.rig.scene, 0x150c14, 2);
    this.runnerP1 = new RunnerView(this.rig.scene, P1_COLOR, 1);
    this.runnerP2 = new RunnerView(this.rig.scene, P2_COLOR, 2);
    this.vfx = new VfxSystem(this.rig.scene);
    this.hud = new Hud(this.container, () => this.toggleCamera(), () => this.onOverlayTap());
    this.audio = new AudioCues();
    this.gestures = new GestureRecognizer(this.container, (intent, atMs) => this.onIntent(intent, atMs));

    this.rig.cameraHeadOn.layers.enable(1);
    this.rig.cameraHeadOn.layers.enable(2);
    this.rig.cameraP1.layers.disable(0);
    this.rig.cameraP1.layers.enable(1);
    this.rig.cameraP2.layers.disable(0);
    this.rig.cameraP2.layers.enable(2);

    requestAnimationFrame(this.frame);
  }

  private toggleCamera(): void {
    this.cameraMode = this.cameraMode === "mirrored" ? "head-on" : "mirrored";
    this.hud.setCameraModeLabel(this.cameraMode);
  }

  private onOverlayTap(): void {
    this.audio.unlock();
    if (this.phase === "idle") {
      this.hud.showStartOverlay(false);
      this.startNewMatch();
    } else if (this.phase === "lost-result") {
      this.startNewMatch();
    }
  }

  private onIntent(intent: InputIntent, detectedAtMs: number): void {
    this.audio.unlock();
    if (this.phase !== "running") return;
    this.pendingP1.push(intent);
    this.pendingLatencyDetectedAt = detectedAtMs;
    switch (intent.kind) {
      case "lane":
        this.audio.laneChange();
        break;
      case "jump":
        this.audio.jump();
        break;
      case "duck":
        this.audio.duck();
        break;
      case "activate":
        this.audio.activate();
        break;
    }
  }

  private startNewMatch(): void {
    this.debugPaused = false;
    this.seedCounter = hashSeed(`${this.seedCounter}:${performance.now()}`);
    this.match = new Match(this.seedCounter, true);
    this.pendingP1 = [];
    this.phase = "countdown";
    this.hud.showBanner(null);
    this.hud.showResultOverlay(false, "", "", "");
  }

  private frame = (nowMs: number): void => {
    if (this.lastFrameMs === 0) this.lastFrameMs = nowMs;
    const dtMs = Math.min(nowMs - this.lastFrameMs, 100);
    this.lastFrameMs = nowMs;
    this.accumulatorS += dtMs / 1000;

    while (this.accumulatorS >= FIXED_STEP_S) {
      this.stepSim();
      this.accumulatorS -= FIXED_STEP_S;
    }

    this.render(nowMs);
    requestAnimationFrame(this.frame);
  };

  private debugPaused = false;

  private stepSim(): void {
    if (this.debugPaused) return;
    const m = this.match;
    if (!m) return;

    if (this.phase === "countdown") {
      m.step([], null);
      const secondsLeft = Math.ceil(m.state.countdownS);
      if (secondsLeft !== this.lastCountdownShown) {
        this.lastCountdownShown = secondsLeft;
        this.hud.showCountdown(secondsLeft > 0 ? secondsLeft : 0);
        if (secondsLeft > 0) this.audio.countdownTick();
      }
      if (m.state.status === "running") {
        this.hud.showCountdown(null);
        this.audio.countdownGo();
        this.phase = "running";
      }
      return;
    }

    if (this.phase === "running") {
      const beforeEvents = m.state.events.length;
      const intents = this.pendingP1;
      this.pendingP1 = [];
      m.step(intents, null);
      for (let i = beforeEvents; i < m.state.events.length; i++) {
        const e = m.state.events[i];
        if (e) this.handleEvent(e);
      }
      if (this.pendingLatencyDetectedAt !== null) {
        this.lastInputLatencySample = { detectedAtMs: this.pendingLatencyDetectedAt, visibleAtMs: performance.now() };
        this.pendingLatencyDetectedAt = null;
      }

      if (m.state.status === "finished") {
        const p1 = m.state.players[0];
        if (p1.alive) {
          this.phase = "won-transition";
          this.transitionS = WON_TRANSITION_S;
          this.hud.showBanner("OPPONENT DOWN — NEXT CHALLENGER");
        } else {
          this.phase = "lost-result";
          const reason = p1.deathReason ?? "crashed";
          this.hud.showResultOverlay(true, "CRASHED", `You ${reason}. Tap to rematch.`, "REMATCH");
        }
      }
      return;
    }

    if (this.phase === "won-transition") {
      this.transitionS -= FIXED_STEP_S;
      if (this.transitionS <= 0) {
        this.hud.showBanner(null);
        this.startNewMatch();
      }
    }
  }

  private handleEvent(e: MatchEvent): void {
    switch (e.kind) {
      case "crash": {
        const isP1 = e.player === "p1";
        (isP1 ? this.runnerP1 : this.runnerP2).flashHit();
        const runnerGroupPos = (isP1 ? this.runnerP1 : this.runnerP2).group.position;
        this.vfx.spawn(runnerGroupPos, isP1 ? P1_COLOR : P2_COLOR, isP1 ? 1 : 2, 30, 650);
        this.audio.crash();
        break;
      }
      case "near-miss":
        this.audio.nearMiss();
        break;
      case "pickup":
        this.audio.pickup();
        break;
      case "opponent-hazard":
        this.audio.opponentHazardWarning();
        break;
      case "activate":
        break;
      case "activate-fizzle":
        this.audio.activateFizzle();
        break;
    }
  }

  /** Test/QA hook: advance the simulation synchronously without waiting on real frame time,
   * for screenshotting later difficulty tiers without a multi-minute real-time wait. Drives
   * BOTH players with the omniscient solver (Infinity reaction budget — see ai.ts), not the
   * fallible gameplay AI: an early version used the gameplay AI, which crashes and restarts
   * within a ~33s median session (D-003), so 90 simulated seconds mostly produced a *freshly
   * restarted* low-speed/low-tier match rather than the intended top-tier snapshot — caught
   * by checking the actual on-screen speed/distance reading against what the math predicted,
   * not by assuming the fast-forward worked. Not used by the normal game loop. Exposed on
   * `window.__app` for Playwright. See gauntlet/WORK-LOG.md. */
  debugFastForwardS(seconds: number): void {
    this.debugPaused = false;
    // p2IsAI must be false here (unlike normal play) so this method can drive *both*
    // players with the Infinity-budget solver directly via match.step(), bypassing Match's
    // internal fallible-AI auto-drive for p2 — otherwise p2 keeps its normal ~33s median
    // session length and crashes long before reaching the top speed/complexity tier.
    this.match = new Match(hashSeed(`debug-ff:${performance.now()}`), false);
    this.phase = "running";
    this.hud.showBanner(null);
    this.hud.showResultOverlay(false, "", "", "");
    this.hud.showCountdown(null);

    const debugRngP1 = new Rng(hashSeed(`debug-ff:${performance.now()}:p1`));
    const debugRngP2 = new Rng(hashSeed(`debug-ff:${performance.now()}:p2`));
    const steps = Math.round(seconds / FIXED_STEP_S);
    for (let i = 0; i < steps; i++) {
      const m = this.match;
      if (m.state.status === "running") {
        const p1 = m.state.players[0];
        const p2 = m.state.players[1];
        const intentsP1 = decideAiIntents(p1, m.state.rows[0], m.state.speedMps, debugRngP1, Infinity);
        const intentsP2 = decideAiIntents(p2, m.state.rows[1], m.state.speedMps, debugRngP2, Infinity);
        m.step(intentsP1, intentsP2);
      } else {
        m.step([], []);
      }
    }
    // Freeze here: once real time resumes, an undriven player at high speed crashes within
    // roughly one row-gap (well under a second — see gauntlet/WORK-LOG.md), which was
    // silently corrupting later screenshots/inspection taken a beat after this call
    // returned. Pausing turns this into a stable freeze-frame instead.
    this.debugPaused = true;
  }

  private render(nowMs: number): void {
    const dtS = FIXED_STEP_S;
    this.vfx.update(dtS, nowMs);
    this.rig.resize();

    const m = this.match;
    if (m) {
      const p1 = m.state.players[0];
      const p2 = m.state.players[1];
      this.hud.setHeldEffect(p1.heldEffect);
      this.hud.setDistance(p1.distance);
      this.hud.setSpeedKmh(m.state.speedMps * 3.6);

      if (this.cameraMode === "mirrored") {
        this.trackP1.update(m.state.rows[0], p1.z, (z) => z);
        this.trackP2.update(m.state.rows[1], p2.z, (z) => z);
        this.runnerP1.update(p1, p1.z, 1, nowMs);
        this.runnerP2.update(p2, p2.z, 1, nowMs);
      } else {
        this.trackP1.update(m.state.rows[0], p1.z, (z) => wrapZ(z));
        this.trackP2.update(m.state.rows[1], p2.z, (z) => headOnRenderZ(z, true));
        this.runnerP1.update(p1, wrapZ(p1.z), 1, nowMs);
        this.runnerP2.update(p2, headOnRenderZ(p2.z, true), -1, nowMs);
      }
    }

    this.renderCameras(
      m
        ? {
            lane1: laneX(m.state.players[0].lane),
            lane2: laneX(m.state.players[1].lane),
            speed: m.state.speedMps,
            headOnRenderZp1: wrapZ(m.state.players[0].z),
            headOnRenderZp2: headOnRenderZ(m.state.players[1].z, true),
          }
        : null,
    );
  }

  private renderCameras(
    info: { lane1: number; lane2: number; speed: number; headOnRenderZp1: number; headOnRenderZp2: number } | null,
  ): void {
    const { renderer, scene } = this.rig;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.clear();

    if (!info) return;

    if (this.cameraMode === "head-on") {
      this.rig.cameraHeadOn.aspect = w / h;
      this.rig.cameraHeadOn.updateProjectionMatrix();
      updateHeadOnCamera(this.rig.cameraHeadOn, info.headOnRenderZp1, info.headOnRenderZp2);
      renderer.render(scene, this.rig.cameraHeadOn);
      return;
    }

    renderer.setScissorTest(true);
    const halfH = Math.floor(h / 2);

    // Top half: opponent's own view (own track, own progress) — the "linked world" you can see.
    this.rig.cameraP2.aspect = w / halfH;
    this.rig.cameraP2.updateProjectionMatrix();
    updateChaseCamera(this.rig.cameraP2, this.match!.state.players[1].z, info.lane2, info.speed);
    renderer.setViewport(0, halfH, w, halfH);
    renderer.setScissor(0, halfH, w, halfH);
    renderer.render(scene, this.rig.cameraP2);

    // Bottom half: your own view (larger share of the frame, since it's what you play).
    this.rig.cameraP1.aspect = w / halfH;
    this.rig.cameraP1.updateProjectionMatrix();
    updateChaseCamera(this.rig.cameraP1, this.match!.state.players[0].z, info.lane1, info.speed);
    renderer.setViewport(0, 0, w, halfH);
    renderer.setScissor(0, 0, w, halfH);
    renderer.render(scene, this.rig.cameraP1);

    renderer.setScissorTest(false);
  }
}

const container = document.getElementById("app");
if (!container) throw new Error("missing #app container");
const app = new App(container);
(window as unknown as { __app: App }).__app = app;
