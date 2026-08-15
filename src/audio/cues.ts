/**
 * Procedural WebAudio cues — no audio asset files (keeps bundle tiny, launch fast, zero
 * loading stall, and sidesteps any asset-licensing questions for a prototype). Every cue is
 * a short oscillator envelope. AudioContext is created lazily on first user gesture (iOS/
 * Android both require this — starting one at module load would silently fail to produce
 * sound on mobile Safari/Chrome until a touch event unlocks it).
 */
export class AudioCues {
  private ctx: AudioContext | null = null;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Call from the first pointerdown/keydown so the context unlocks before it's needed. */
  unlock(): void {
    this.ensureCtx();
  }

  private tone(freq: number, durationS: number, type: OscillatorType, gainPeak: number, glideTo?: number): void {
    const ctx = this.ensureCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + durationS);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainPeak, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationS);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationS + 0.02);
  }

  laneChange(): void {
    this.tone(520, 0.08, "square", 0.05, 640);
  }
  jump(): void {
    this.tone(300, 0.14, "triangle", 0.06, 620);
  }
  duck(): void {
    this.tone(260, 0.12, "triangle", 0.06, 160);
  }
  nearMiss(): void {
    this.tone(880, 0.1, "sine", 0.08, 1200);
  }
  pickup(): void {
    this.tone(660, 0.16, "sine", 0.08, 990);
  }
  activate(): void {
    this.tone(440, 0.2, "sawtooth", 0.07, 220);
  }
  activateFizzle(): void {
    this.tone(200, 0.1, "square", 0.04, 110);
  }
  opponentHazardWarning(): void {
    this.tone(180, 0.3, "sawtooth", 0.09, 140);
  }
  crash(): void {
    this.tone(120, 0.35, "sawtooth", 0.12, 40);
  }
  countdownTick(): void {
    this.tone(500, 0.09, "square", 0.05);
  }
  countdownGo(): void {
    this.tone(760, 0.2, "square", 0.09, 1100);
  }
}
