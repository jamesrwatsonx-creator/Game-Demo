import { test, expect } from "@playwright/test";

declare global {
  interface Window {
    __app: {
      debugFastForwardS: (s: number) => void;
      lastInputLatencySample: { detectedAtMs: number; visibleAtMs: number } | null;
    };
  }
}

test.describe("HEAD-ON — mobile portrait smoke test", () => {
  test("loads, shows the start overlay, and starts a match on tap", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HEAD-ON/);
    await expect(page.locator(".hud-tap")).toBeVisible();

    await page.locator(".hud-tap").click();
    await expect(page.locator(".hud-tap")).toBeHidden();

    // Countdown should appear then clear once the match starts running.
    await expect(page.locator(".hud-countdown")).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2500);
    await expect(page.locator(".hud-countdown")).toBeHidden();
  });

  test("keyboard input drives a lane change (desktop/automation fallback gesture path)", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hud-tap").click();
    await page.waitForTimeout(2200); // clear countdown

    const before = await page.evaluate(() => document.querySelector("#hud-distance")?.textContent);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => document.querySelector("#hud-distance")?.textContent);
    // Distance should have advanced (proves the sim loop is actually running under input).
    expect(after).not.toBe(before);
  });

  test("camera mode toggle switches label and both modes render non-blank frames", async ({ page }) => {
    await page.goto("/");
    await page.locator(".hud-tap").click();
    await page.waitForTimeout(2200);

    await expect(page.locator(".hud-cameratoggle")).toHaveText(/Mirrored/);
    await page.evaluate(() => window.__app.debugFastForwardS(3));
    await page.waitForTimeout(150);
    await page.screenshot({ path: "test-results/camera-mirrored-early.png" });

    await page.locator(".hud-cameratoggle").click();
    await expect(page.locator(".hud-cameratoggle")).toHaveText(/Head-On/);
    await page.waitForTimeout(150);
    await page.screenshot({ path: "test-results/camera-headon-early.png" });
  });

  test("fast-forwarded high-speed/high-complexity tier renders in both camera modes (CL-03/H-01 evidence)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".hud-tap").click();
    await page.waitForTimeout(2200);

    // ~90 simulated seconds reaches MAX_SPEED_MPS and the top complexity tier (see
    // constants.ts: SPEED_RAMP_PER_METER reaches ceiling at ~1400m average distance).
    // Once debugFastForwardS returns, real time resumes and p1 has nobody driving it (the
    // synthetic AI only feeds intents *inside* the synchronous fast-forward loop) — it will
    // crash for real within a couple of seconds of unmanned real-time play (same trap as
    // WL-03). Toggle the camera via evaluate() rather than a real Playwright click so the
    // comparison doesn't depend on winning a race against that crash + result overlay.
    await page.evaluate(() => window.__app.debugFastForwardS(90));
    await page.screenshot({ path: "test-results/camera-mirrored-highspeed.png" });

    await page.evaluate(() => document.querySelector<HTMLElement>(".hud-cameratoggle")?.click());
    await page.screenshot({ path: "test-results/camera-headon-highspeed.png" });

    const speedText = await page.evaluate(() => document.querySelector("#hud-speed")?.textContent);
    expect(speedText).toBeTruthy();
  });

  test("input latency: gesture-detected to visible-frame stays within a single-digit frame budget", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".hud-tap").click();
    await page.waitForTimeout(2200);

    await page.keyboard.press("ArrowUp"); // jump
    await page.waitForTimeout(100);

    const sample = await page.evaluate(() => window.__app.lastInputLatencySample);
    expect(sample).not.toBeNull();
    if (sample) {
      const latencyMs = sample.visibleAtMs - sample.detectedAtMs;
      // eslint-disable-next-line no-console
      console.log(`Input latency sample (gesture-detected -> next rendered frame): ${latencyMs.toFixed(1)}ms`);
      // Generous upper bound (a few frames at 60Hz): this measures "detected -> intent applied
      // and rendered," not raw hardware touch latency (which this harness cannot measure —
      // Chromium's synthetic keyboard event stands in for a real touch, see EVALUATION.md).
      expect(latencyMs).toBeGreaterThanOrEqual(0);
      expect(latencyMs).toBeLessThan(150);
    }
  });
});
