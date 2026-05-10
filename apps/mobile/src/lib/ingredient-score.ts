/**
 * Bottlewise ingredient-score engine.
 *
 * Deterministic from inputs: same ingredient list + same baby profile
 * produces the same score across runs. The LLM-narration layer (planned)
 * reads the score breakdown and translates it into prose — it does NOT
 * invent reasons or change the grade. See docs/AI_DESIGN.md § Principles.
 *
 * Architecture:
 *   ingredient list  ───┐
 *                       ├──→ scoreFormula() ──→ deterministic breakdown ──┐
 *   baby profile     ───┤                                                  │
 *                       └─────────────────────────────────────────────────►├──→ UI
 *                                                                          │
 *   future: Claude narration prompt reads breakdown → personalized prose ──┘
 */

import {
  CONCERNS,
  POSITIVE_MARKERS,
  type ConcernSeverity,
  type IngredientConcern,
  type PositiveMarker,
} from "@/data/ingredient-concerns";

export type LetterGrade = "A" | "B" | "C" | "D" | "F";

export interface ConcernHit {
  concern: IngredientConcern;
  matchedIngredient: string;
  positionInList: number;
}

export interface PositiveHit {
  marker: PositiveMarker;
  matchedIngredient: string;
}

export interface ScoreInput {
  ingredients: string[];
  /** Positive attributes flagged at the formula level (e.g. "organic",
   *  "a2", "hmo") that come from product metadata rather than the
   *  ingredient list itself. */
  attributes?: string[];
  babyProfile?: {
    familySoyAllergy?: boolean;
    familyEczema?: boolean;
    preemie?: boolean;
  };
}

export interface ScoreBreakdown {
  base: number;
  rawScore: number;
  finalScore: number;
  grade: LetterGrade;
  concerns: ConcernHit[];
  positives: PositiveHit[];
  /** Personalized notes based on baby profile + matched concerns/positives.
   *  This is the seam where the Claude narration layer plugs in. */
  personalNotes: string[];
  verdict: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function findConcerns(ingredients: string[]): ConcernHit[] {
  const hits: ConcernHit[] = [];
  ingredients.forEach((ing, idx) => {
    const ingNorm = normalize(ing);
    for (const concern of CONCERNS) {
      if (!ingNorm.includes(normalize(concern.match))) continue;
      if (concern.primaryOnly && idx >= 3) continue;
      hits.push({ concern, matchedIngredient: ing, positionInList: idx });
    }
  });
  return hits;
}

function findPositives(
  ingredients: string[],
  attributes: string[],
): PositiveHit[] {
  const haystack = [
    ...ingredients.map(normalize),
    ...attributes.map(normalize),
  ];
  const hits: PositiveHit[] = [];
  for (const marker of POSITIVE_MARKERS) {
    const matched = haystack.find((h) => h.includes(normalize(marker.match)));
    if (matched) hits.push({ marker, matchedIngredient: matched });
  }
  return hits;
}

function scoreToGrade(score: number): LetterGrade {
  if (score >= 90) return "A";
  if (score >= 78) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

function buildVerdict(grade: LetterGrade, concerns: ConcernHit[]): string {
  const significantCount = concerns.filter((c) => c.concern.severity === "significant").length;
  const moderateCount = concerns.filter((c) => c.concern.severity === "moderate").length;

  if (grade === "A") {
    return "Cleaner-than-average panel for an infant formula. Few or no flagged ingredients.";
  }
  if (grade === "B") {
    return moderateCount > 0
      ? "Solid panel with one or two ingredients worth knowing about."
      : "Solid panel overall.";
  }
  if (grade === "C") {
    return "Standard US formula panel — common ingredients with some tradeoffs to consider.";
  }
  if (grade === "D") {
    return significantCount > 0
      ? `${significantCount} ingredient${significantCount === 1 ? "" : "s"} flagged as 'significant' by published guidance. Consider alternatives if available.`
      : "Several flagged ingredients on this panel. Consider alternatives if available.";
  }
  return "Multiple significant flags on this panel. Strongly consider alternatives and talk to your pediatrician.";
}

function buildPersonalNotes(
  concerns: ConcernHit[],
  positives: PositiveHit[],
  profile?: ScoreInput["babyProfile"],
): string[] {
  const notes: string[] = [];
  if (!profile) return notes;

  if (profile.familySoyAllergy) {
    const soy = concerns.find((c) => c.concern.match.includes("soy"));
    if (soy) {
      notes.push(
        `You flagged a family soy allergy — this formula contains ${soy.concern.display.toLowerCase()}. Worth confirming with your pediatrician before introducing.`,
      );
    }
  }

  if (profile.familyEczema) {
    const intactProtein = concerns.find((c) =>
      ["palm oil", "palm olein"].includes(c.concern.match),
    );
    if (intactProtein) {
      // No medical claim, just acknowledgement that the family history
      // is part of context.
      notes.push(
        "You flagged family eczema. The formula's protein form is the more important factor here; the fat blend is secondary.",
      );
    }
  }

  if (profile.preemie) {
    notes.push(
      "Your baby was born early. Post-NICU-discharge formulas (NeoSure, EnfaCare) are designed for higher caloric density; the standard ingredient score doesn't account for that.",
    );
  }

  return notes;
}

export function scoreFormula(input: ScoreInput): ScoreBreakdown {
  const base = 100;
  const concerns = findConcerns(input.ingredients);
  const positives = findPositives(input.ingredients, input.attributes ?? []);

  const penaltyTotal = concerns.reduce((sum, c) => sum + c.concern.penalty, 0);
  const bonusTotal = positives.reduce((sum, p) => sum + p.marker.bonus, 0);

  const rawScore = base - penaltyTotal + bonusTotal;
  const finalScore = Math.max(0, Math.min(100, rawScore));
  const grade = scoreToGrade(finalScore);
  const verdict = buildVerdict(grade, concerns);
  const personalNotes = buildPersonalNotes(concerns, positives, input.babyProfile);

  return {
    base,
    rawScore,
    finalScore,
    grade,
    concerns,
    positives,
    personalNotes,
    verdict,
  };
}

/**
 * Compact grade summary for use on cards. Returns null when there's no
 * ingredient data to score against — the UI shows "Analysis pending"
 * rather than a fake grade.
 */
export function scoreSummary(
  ingredients: string[] | undefined,
  attributes: string[] = [],
): { grade: LetterGrade; score: number } | null {
  if (!ingredients || ingredients.length === 0) return null;
  const breakdown = scoreFormula({ ingredients, attributes });
  return { grade: breakdown.grade, score: breakdown.finalScore };
}

export const SEVERITY_TONES: Record<
  ConcernSeverity,
  "warn" | "danger" | "info"
> = {
  watch: "info",
  moderate: "warn",
  significant: "danger",
};
