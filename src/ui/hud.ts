import { EFFECT_META } from "../sim/effects";
import type { CameraMode, EffectId } from "../sim/types";

const STYLE = `
.hud-root { position:fixed; inset:0; pointer-events:none; font-family:'Segoe UI',system-ui,sans-serif; color:#eaf2ff; z-index:10; }
.hud-top { position:absolute; top:max(10px, env(safe-area-inset-top)); left:0; right:0; display:flex; justify-content:space-between; padding:0 14px; font-size:13px; letter-spacing:0.04em; text-transform:uppercase; opacity:0.85; }
.hud-speed { font-variant-numeric:tabular-nums; }
.hud-effect { position:absolute; bottom:max(18px, env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%); width:64px; height:64px; border-radius:50%; border:2px solid rgba(255,255,255,0.35); display:flex; align-items:center; justify-content:center; font-size:11px; text-align:center; background:rgba(10,10,30,0.55); backdrop-filter:blur(4px); transition:transform 120ms ease, border-color 120ms ease; }
.hud-effect.armed { border-color:#33ffaa; box-shadow:0 0 18px rgba(51,255,170,0.5); transform:translateX(-50%) scale(1.08); }
.hud-cameratoggle { position:absolute; top:max(10px, env(safe-area-inset-top)); right:14px; pointer-events:auto; font-size:11px; padding:6px 10px; border-radius:14px; background:rgba(10,10,30,0.6); border:1px solid rgba(255,255,255,0.25); }
.hud-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; background:rgba(3,3,12,0.72); pointer-events:auto; text-align:center; padding:24px; }
.hud-overlay h1 { font-size:28px; margin:0; letter-spacing:0.08em; }
.hud-overlay p { margin:0; opacity:0.75; font-size:14px; max-width:280px; }
.hud-tap { font-size:16px; font-weight:700; letter-spacing:0.06em; padding:16px 34px; border-radius:999px; background:linear-gradient(135deg,#33ffaa,#22aaff); color:#04101a; box-shadow:0 8px 30px rgba(34,170,255,0.35); }
.hud-banner { position:absolute; top:38%; left:50%; transform:translate(-50%,-50%); font-size:15px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.9; text-align:center; }
.hud-countdown { position:absolute; top:44%; left:50%; transform:translate(-50%,-50%); font-size:64px; font-weight:800; text-shadow:0 0 30px rgba(51,255,170,0.6); }
`;

export class Hud {
  readonly root: HTMLDivElement;
  private topBar: HTMLDivElement;
  private effectBadge: HTMLDivElement;
  private cameraToggle: HTMLDivElement;
  private overlay: HTMLDivElement;
  private banner: HTMLDivElement;
  private countdownEl: HTMLDivElement;

  constructor(container: HTMLElement, onCameraToggle: () => void, onOverlayTap: () => void) {
    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    this.root = document.createElement("div");
    this.root.className = "hud-root";
    container.appendChild(this.root);

    this.topBar = document.createElement("div");
    this.topBar.className = "hud-top";
    this.topBar.innerHTML = `<span class="hud-speed" id="hud-speed">0 km/h</span><span id="hud-distance">0 m</span>`;
    this.root.appendChild(this.topBar);

    this.effectBadge = document.createElement("div");
    this.effectBadge.className = "hud-effect";
    this.effectBadge.textContent = "—";
    this.root.appendChild(this.effectBadge);

    this.cameraToggle = document.createElement("div");
    this.cameraToggle.className = "hud-cameratoggle";
    this.cameraToggle.textContent = "Camera: Mirrored";
    this.cameraToggle.style.pointerEvents = "auto";
    this.cameraToggle.addEventListener("click", onCameraToggle);
    this.root.appendChild(this.cameraToggle);

    this.banner = document.createElement("div");
    this.banner.className = "hud-banner";
    this.banner.style.display = "none";
    this.root.appendChild(this.banner);

    this.countdownEl = document.createElement("div");
    this.countdownEl.className = "hud-countdown";
    this.countdownEl.style.display = "none";
    this.root.appendChild(this.countdownEl);

    this.overlay = document.createElement("div");
    this.overlay.className = "hud-overlay";
    this.overlay.innerHTML = `<h1>HEAD-ON</h1><p>Swipe to change lanes. Swipe up to jump, down to duck. Tap to fire a tactical effect. First to crash loses.</p><div class="hud-tap">TAP TO RACE</div>`;
    this.overlay.addEventListener("click", onOverlayTap);
    this.root.appendChild(this.overlay);
  }

  setSpeedKmh(v: number): void {
    const el = this.topBar.querySelector("#hud-speed");
    if (el) el.textContent = `${Math.round(v)} km/h`;
  }

  setDistance(m: number): void {
    const el = this.topBar.querySelector("#hud-distance");
    if (el) el.textContent = `${Math.round(m)} m`;
  }

  setHeldEffect(effect: EffectId | null): void {
    if (!effect) {
      this.effectBadge.textContent = "—";
      this.effectBadge.classList.remove("armed");
      return;
    }
    this.effectBadge.textContent = EFFECT_META[effect].label.toUpperCase();
    this.effectBadge.classList.add("armed");
  }

  setCameraModeLabel(mode: CameraMode): void {
    this.cameraToggle.textContent = mode === "head-on" ? "Camera: Head-On" : "Camera: Mirrored";
  }

  showCountdown(n: number | null): void {
    if (n === null) {
      this.countdownEl.style.display = "none";
      return;
    }
    this.countdownEl.style.display = "block";
    this.countdownEl.textContent = n > 0 ? String(n) : "GO";
  }

  showBanner(text: string | null): void {
    if (!text) {
      this.banner.style.display = "none";
      return;
    }
    this.banner.style.display = "block";
    this.banner.textContent = text;
  }

  showStartOverlay(show: boolean): void {
    this.overlay.style.display = show ? "flex" : "none";
  }

  showResultOverlay(show: boolean, title: string, reason: string, cta: string): void {
    if (!show) {
      this.overlay.style.display = "none";
      return;
    }
    this.overlay.innerHTML = `<h1>${title}</h1><p>${reason}</p><div class="hud-tap">${cta}</div>`;
    this.overlay.style.display = "flex";
  }
}
