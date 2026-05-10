import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT, type NarrationRequest } from "./prompt.js";

describe("system prompt", () => {
  it("requires JSON-object output", () => {
    expect(SYSTEM_PROMPT).toContain('JSON object: {"sentences"');
  });
  it("requires the exact pediatrician closing sentence", () => {
    expect(SYSTEM_PROMPT).toContain("Talk to your pediatrician before changing formulas.");
  });
  it("forbids invented ingredients", () => {
    expect(SYSTEM_PROMPT.toLowerCase()).toContain("do not invent");
  });
});

describe("request validation shape", () => {
  it("accepts a minimal valid payload", () => {
    const payload: NarrationRequest = {
      breakdown: {
        grade: "A",
        finalScore: 100,
        concerns: [],
        positives: [
          { display: "Organic", reason: "Certified organic" },
        ],
      },
      formula: { id: "bobbie-original", brand: "Bobbie", name: "Bobbie Original" },
    };
    expect(payload.formula.brand).toBe("Bobbie");
    expect(payload.breakdown.grade).toBe("A");
  });
});
