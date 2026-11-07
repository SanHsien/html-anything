import { describe, expect, it } from "vitest";
import { safeVercelProjectName } from "../vercel";

describe("safeVercelProjectName", () => {
  it("keeps the label rules: lowercase, dashes collapsed, no leading or trailing dash", () => {
    expect(safeVercelProjectName("--Hello  World!!--")).toBe("hello-world");
    expect(safeVercelProjectName("html-anything-ABC_123")).toBe("html-anything-abc-123");
  });

  it("does not end with a dash after truncating to 80 characters", () => {
    const name = safeVercelProjectName(`${"a".repeat(79)}-tail`);
    expect(name).toBe("a".repeat(79));
  });

  it("falls back to a random name when nothing usable is left", () => {
    expect(safeVercelProjectName("!!!---")).toMatch(/^html-anything-[0-9a-f]{8}$/);
  });

  it("stays fast on a long run of separators (the ReDoS shape CodeQL flagged)", () => {
    const started = Date.now();
    safeVercelProjectName(`${"-".repeat(50_000)}x${"-".repeat(50_000)}`);
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
