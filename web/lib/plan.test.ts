import { describe, it, expect } from "vitest";
import { isPro, LIMITS } from "./plan";
import { Plan } from "@prisma/client";

describe("isPro", () => {
  it("should return true for PRO plan", () => {
    expect(isPro(Plan.PRO)).toBe(true);
  });

  it("should return false for FREE plan", () => {
    expect(isPro(Plan.FREE)).toBe(false);
  });
});

describe("LIMITS", () => {
  it("should have FREE_MAX_APPLICATIONS set to 200", () => {
    expect(LIMITS.FREE_MAX_APPLICATIONS).toBe(200);
  });
});
