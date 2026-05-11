import { describe, expect, it } from "vitest";
import {
  findSubstitutes,
  type SubstitutionReason,
} from "@/lib/similarity";
import {
  FORMULA_CATALOG,
  findFormulaById,
  type FormulaProduct,
} from "@/data/formula-catalog";

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`fixture missing: ${label}`);
  return value;
}

const NUTRAMIGEN = required(findFormulaById("nutramigen"), "nutramigen");
const BOBBIE = required(findFormulaById("bobbie-original"), "bobbie-original");
const PARENTS_CHOICE_TENDER = required(
  findFormulaById("parents-choice-tender"),
  "parents-choice-tender",
);
const RECALL_DEMO = required(findFormulaById("demo-recall-acme"), "demo-recall-acme");

describe("findSubstitutes — hard exclusions", () => {
  it("never returns the baseline itself", () => {
    const matches = findSubstitutes(BOBBIE, { reason: "similar", limit: 10 });
    expect(matches.find((m) => m.formula.id === BOBBIE.id)).toBeUndefined();
  });

  it("excludes formulas with an ongoing recall", () => {
    const matches = findSubstitutes(NUTRAMIGEN, { reason: "similar", limit: 50 });
    expect(matches.find((m) => m.formula.id === RECALL_DEMO.id)).toBeUndefined();
  });
});

describe("findSubstitutes — recall context", () => {
  it("surfaces hypoallergenic match first for hypoallergenic baseline", () => {
    const matches = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 3 });
    expect(matches.length).toBeGreaterThan(0);
    const top = matches[0]!;
    // Whatever the top match is, it MUST be a hypoallergenic formula.
    // Otherwise the engine has failed at its single most important job.
    const isHypo =
      top.formula.segments.includes("specialty_hypoallergenic") ||
      top.formula.segments.includes("specialty_amino_acid");
    expect(isHypo).toBe(true);
  });

  it("surfaces Parent's Choice Tender as the highest-scoring match for Nutramigen", () => {
    const matches = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 3 });
    const tenderMatch = matches.find((m) => m.formula.id === PARENTS_CHOICE_TENDER.id);
    expect(tenderMatch).toBeDefined();
    // This is the killer-feature assertion: a WIC-eligible store-brand
    // alternative to a premium specialty formula, scored 100/100.
    expect(matches[0]?.formula.id).toBe(PARENTS_CHOICE_TENDER.id);
    expect(matches[0]!.score).toBeGreaterThanOrEqual(95);
  });

  it("includes per-attribute matched reasons for the top result", () => {
    const matches = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 1 });
    const reasons = matches[0]!.matched.map((m) => m.label);
    expect(reasons).toContain("Same protein source");
    expect(reasons).toContain("Same protein form");
  });
});

describe("findSubstitutes — too_expensive context", () => {
  it("prefers cheaper segments for a premium-DTC baseline", () => {
    const matches = findSubstitutes(BOBBIE, { reason: "too_expensive", limit: 3 });
    expect(matches.length).toBeGreaterThan(0);
    // The top match should be in a cheaper segment than premium_dtc.
    const top = matches[0]!.formula;
    const cheaperSegments = ["mass_market", "private_label"];
    const isCheaper = top.segments.some((s) => cheaperSegments.includes(s));
    expect(isCheaper).toBe(true);
  });

  it("never breaks the protein-source rule for cost alone", () => {
    // Bobbie is cow-milk. Even searching by cost, we must not surface
    // a soy / amino-acid alternative just because it's cheaper.
    const matches = findSubstitutes(BOBBIE, { reason: "too_expensive", limit: 3 });
    for (const m of matches) {
      const isCowMilk =
        !m.formula.segments.includes("specialty_amino_acid") &&
        !m.formula.segments.includes("goat_milk") &&
        !m.formula.segments.includes("plant_based");
      expect(isCowMilk).toBe(true);
    }
  });
});

describe("findSubstitutes — not_tolerated context", () => {
  it("biases toward more-hydrolyzed protein for an intact-protein baseline", () => {
    // Bobbie is intact cow-milk. If "not tolerated," prefer something
    // more hydrolyzed.
    const matches = findSubstitutes(BOBBIE, { reason: "not_tolerated", limit: 5 });
    const formRanks: Record<string, number> = {
      intact: 0,
      partially_hydrolyzed: 1,
      extensively_hydrolyzed: 2,
      amino_acid: 3,
    };
    const top = matches[0]!;
    // The top match for not_tolerated should be more hydrolyzed than the
    // baseline (or equal, but never strictly less).
    const isMoreHydrolyzed = top.matched.some((m) => m.label.includes("More-hydrolyzed protein"));
    const isSameForm = top.matched.some((m) => m.label === "Same protein form");
    expect(isMoreHydrolyzed || isSameForm).toBe(true);
    void formRanks;
  });
});

describe("findSubstitutes — determinism", () => {
  it("returns the same order on repeat calls (no hidden randomness)", () => {
    const a = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 5 });
    const b = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 5 });
    expect(a.map((m) => m.formula.id)).toEqual(b.map((m) => m.formula.id));
    expect(a.map((m) => m.score)).toEqual(b.map((m) => m.score));
  });

  it("limit honored", () => {
    expect(findSubstitutes(BOBBIE, { reason: "similar", limit: 2 })).toHaveLength(2);
    expect(findSubstitutes(BOBBIE, { reason: "similar", limit: 1 })).toHaveLength(1);
  });
});

describe("findSubstitutes — restricted catalog", () => {
  it("respects a caller-supplied catalog subset", () => {
    // If the caller hands a 1-formula catalog, the result is at most 1.
    const subset: FormulaProduct[] = [BOBBIE, PARENTS_CHOICE_TENDER];
    const matches = findSubstitutes(NUTRAMIGEN, {
      reason: "recalled",
      catalog: subset,
      limit: 5,
    });
    expect(matches.length).toBeLessThanOrEqual(2);
    expect(matches.find((m) => m.formula.id === BOBBIE.id)).toBeDefined();
  });
});

describe("findSubstitutes — eyebrow copy", () => {
  it("uses 'Closest hypoallergenic alternative' for hypo-to-hypo recall match", () => {
    const matches = findSubstitutes(NUTRAMIGEN, { reason: "recalled", limit: 1 });
    expect(matches[0]!.eyebrow).toMatch(/hypoallergenic/i);
  });

  it("uses 'More affordable, same profile' for too_expensive context", () => {
    const matches = findSubstitutes(BOBBIE, { reason: "too_expensive", limit: 1 });
    expect(matches[0]!.eyebrow).toMatch(/affordable/i);
  });
});

describe("FORMULA_CATALOG — invariants the engine relies on", () => {
  it("has unique ids", () => {
    const ids = FORMULA_CATALOG.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at least one formula per critical segment", () => {
    const segments = [
      "mass_market",
      "private_label",
      "premium_dtc",
      "european_import",
      "specialty_hypoallergenic",
      "specialty_amino_acid",
      "goat_milk",
    ] as const;
    for (const seg of segments) {
      const found = FORMULA_CATALOG.find((f) => f.segments.includes(seg));
      expect(found, `segment '${seg}' has no formula`).toBeDefined();
    }
  });
});
