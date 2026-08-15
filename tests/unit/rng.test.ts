import { describe, expect, it } from "vitest";
import { Rng, hashSeed } from "../../src/sim/rng";

describe("Rng determinism (CL-05 basis)", () => {
  it("produces an identical sequence for the same seed", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("stays within [0, 1)", () => {
    const r = new Rng(999);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("hashSeed is deterministic for the same string", () => {
    expect(hashSeed("match:42:p1")).toBe(hashSeed("match:42:p1"));
    expect(hashSeed("match:42:p1")).not.toBe(hashSeed("match:42:p2"));
  });
});
