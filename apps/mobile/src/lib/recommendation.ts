/**
 * Bottlewise recommendation engine.
 *
 * Given a baby profile, returns three ranked formula picks with
 * per-reason scoring + an "avoid for now" list with sourced reasoning.
 *
 * Architecture per docs/AI_DESIGN.md § Principles:
 *   - Deterministic ranking. The narrator (when wired) translates the
 *     reason breakdown into prose; it does NOT pick the matches.
 *   - Hard filters happen before scoring (eligibility). Soft scoring
 *     decides ranking within the eligible set.
 *   - Each scoring contribution captures a structured Reason so the UI
 *     can render "why we picked this" without re-deriving from scores.
 *
 * Compliance contract (PRD § 2 Tier 1):
 *   - We never claim a formula will treat a condition.
 *   - Family-history flags filter / weight; they never assert efficacy.
 *   - Reasons are framed as "matches the [X] profile you flagged" or
 *     "designed for [X]", never "will help with [X]."
 */

import {
  FORMULA_CATALOG,
  type FormulaProduct,
} from "@/data/formula-catalog";
import { scoreSummary } from "@/lib/ingredient-score";
import type { BabyProfile } from "@/state/baby-profile";

// ─── Public types ────────────────────────────────────────────────────

export interface Reason {
  /** Stable key for grouping / deduplication. */
  key: string;
  /** Short label suitable as a chip. */
  label: string;
  /** Optional one-line detail rendered below the label. */
  detail?: string;
  /** Weight contributed by this reason. Sign matters: positive boosts,
   *  negative is informational-only and won't actually be returned in
   *  scoreOne (we filter to positive contributions for display). */
  weight: number;
}

export interface Recommendation {
  formula: FormulaProduct;
  rank: 1 | 2 | 3;
  eyebrow: "Best match" | "Close runner-up" | "Worth knowing";
  score: number;
  reasons: Reason[];
  /** Per-baby narration line. Composed deterministically from the top
   *  reasons; the narrator-worker can replace this with Claude-prose
   *  in the same shape later. */
  summary: string;
}

export interface AvoidEntry {
  /** Formula reference. Note this is just a brand+name pair so we can
   *  surface synthetic "anything not hypoallergenic" entries when the
   *  avoid is about a category, not a single SKU. */
  display: string;
  brand?: string;
  formulaId?: string;
  tinAccent: string;
  reasonText: string;
}

export interface RecommendationResult {
  picks: Recommendation[];
  avoid: AvoidEntry[];
  /** True when the engine has at least one pick whose score clears the
   *  "we feel confident" floor. When false, the UI shows a softer
   *  "talk to your pediatrician — we're not confident given your
   *  constraints" framing. */
  confident: boolean;
}

export interface RecommendOptions {
  /** Override the catalog (useful for tests + restricted catalogs). */
  catalog?: FormulaProduct[];
}

// ─── Hard filters (eligibility) ───────────────────────────────────────

function hasSoyProtein(f: FormulaProduct): boolean {
  if (f.segments.includes("plant_based")) return false; // plant-blend, not soy specifically
  const ingredients = (f.ingredients ?? []).join(" ").toLowerCase();
  const tagline = f.tagline.toLowerCase();
  if (/soy[- ]?based|isomil|prosobee/i.test(tagline)) return true;
  if (/soy protein isolate|isolated soy protein/i.test(ingredients)) return true;
  return false;
}

function isIntactCowMilk(f: FormulaProduct): boolean {
  if (f.segments.includes("specialty_hypoallergenic")) return false;
  if (f.segments.includes("specialty_amino_acid")) return false;
  if (f.segments.includes("goat_milk")) return false;
  if (f.segments.includes("plant_based")) return false;
  const tagline = f.tagline.toLowerCase();
  if (/partially hydrolyzed|extensively hydrolyzed|amino acid/.test(tagline)) {
    return false;
  }
  const attrs = (f.attributes ?? []).map((a) => a.toLowerCase());
  if (attrs.some((a) => /hydrolyzed|amino/.test(a))) return false;
  return true;
}

function isEligible(f: FormulaProduct, profile: BabyProfile): boolean {
  if (f.activeRecall?.status === "ongoing") return false;

  // Age filter
  if (
    f.segments.includes("preemie_post_discharge") &&
    !profile.preemie
  ) {
    return false;
  }
  if (
    f.segments.includes("toddler") &&
    profile.babyAgeMonths < 11
  ) {
    return false;
  }

  // Family allergy filters
  if (profile.familySoyAllergy && hasSoyProtein(f)) return false;

  if (profile.familyCmpa && isIntactCowMilk(f)) return false;

  return true;
}

// ─── Soft scoring ─────────────────────────────────────────────────────

const BASE_SCORE = 50;

function scoreOne(f: FormulaProduct, profile: BabyProfile): {
  score: number;
  reasons: Reason[];
} {
  let score = BASE_SCORE;
  const reasons: Reason[] = [];
  const tagline = f.tagline.toLowerCase();
  const attrs = (f.attributes ?? []).map((a) => a.toLowerCase());
  const isPartialHydro =
    /partially hydrolyzed/.test(tagline) ||
    attrs.some((a) => /partially hydrolyzed/.test(a)) ||
    /gentle/.test(f.productName.toLowerCase());
  const isAntiReflux =
    /anti[- ]?reflux|added rice|spit[- ]?up|\bAR\b/i.test(tagline) ||
    f.id.includes("ar") ||
    attrs.some((a) => /anti[- ]?reflux/.test(a));
  const isNoPalm = attrs.includes("no palm oil") || /no palm oil/.test(tagline);
  const isOrganic = attrs.includes("organic") || /organic/.test(tagline);
  const ingredientGrade = scoreSummary(f.ingredients, f.attributes);

  // ─── Issues observed ─────────────────────────────────────────────

  if (profile.issuesObserved.includes("reflux")) {
    if (isAntiReflux) {
      score += 25;
      reasons.push({
        key: "reflux-ar",
        label: "Designed for reflux / spit-up",
        detail: "Thickened or formulated specifically for spit-up patterns",
        weight: 25,
      });
    } else if (isPartialHydro) {
      score += 12;
      reasons.push({
        key: "reflux-partial",
        label: "Partially hydrolyzed",
        detail: "Often easier to digest for babies showing reflux",
        weight: 12,
      });
    }
  }

  if (profile.issuesObserved.includes("gas") || profile.issuesObserved.includes("fussy")) {
    if (isPartialHydro) {
      score += 15;
      reasons.push({
        key: "gas-partial",
        label: "Gentler protein",
        detail: "Partial hydrolysis is associated with less gas in some infants",
        weight: 15,
      });
    }
  }

  if (profile.issuesObserved.includes("stools")) {
    if (isNoPalm) {
      score += 12;
      reasons.push({
        key: "stools-no-palm",
        label: "No palm oil",
        detail: "Palm oil is associated with harder stools in some studies",
        weight: 12,
      });
    }
  }

  // ─── Family history (already filtered for soy / CMPA hard-no) ────

  if (profile.familyEczema) {
    if (isPartialHydro) {
      score += 8;
      reasons.push({
        key: "eczema-partial",
        label: "Partially hydrolyzed protein",
        detail: "Often a gentler starting point given family eczema history",
        weight: 8,
      });
    } else if (!isIntactCowMilk(f) || f.segments.includes("goat_milk")) {
      score += 3;
      reasons.push({
        key: "eczema-alternative-protein",
        label: "Alternative protein form",
        detail: "Family eczema history is one reason parents explore alternatives to intact cow milk",
        weight: 3,
      });
    }
  }

  if (profile.familyCmpa) {
    if (f.segments.includes("specialty_hypoallergenic")) {
      score += 30;
      reasons.push({
        key: "cmpa-hypo",
        label: "Hypoallergenic — designed for CMPA",
        detail: "Extensively hydrolyzed casein meets cow-milk-protein-allergy management guidance",
        weight: 30,
      });
    } else if (f.segments.includes("specialty_amino_acid")) {
      score += 24;
      reasons.push({
        key: "cmpa-aa",
        label: "Amino-acid elemental",
        detail: "For severe or persistent CMPA when extensively-hydrolyzed isn't enough",
        weight: 24,
      });
    } else if (f.segments.includes("goat_milk")) {
      score += 8;
      reasons.push({
        key: "cmpa-goat",
        label: "Goat-milk alternative",
        detail: "Sometimes tolerated with mild cow-milk reactions — confirm with pediatrician",
        weight: 8,
      });
    }
  }

  if (profile.preemie) {
    if (f.segments.includes("preemie_post_discharge")) {
      score += 30;
      reasons.push({
        key: "preemie-fit",
        label: "Post-NICU discharge formula",
        detail: "Higher caloric density designed for babies born early",
        weight: 30,
      });
    }
  }

  // ─── Ingredient grade ───────────────────────────────────────────

  if (ingredientGrade) {
    if (ingredientGrade.grade === "A") {
      score += 15;
      reasons.push({
        key: "grade-a",
        label: "A-grade ingredient panel",
        detail: `${ingredientGrade.score}/100 on the Bottlewise ingredient score`,
        weight: 15,
      });
    } else if (ingredientGrade.grade === "B") {
      score += 8;
      reasons.push({
        key: "grade-b",
        label: "B-grade ingredient panel",
        detail: `${ingredientGrade.score}/100 on the Bottlewise ingredient score`,
        weight: 8,
      });
    } else if (ingredientGrade.grade === "D" || ingredientGrade.grade === "F") {
      score -= 5;
      // Don't render this as a "reason for picking" — it's a quiet
      // demotion that the avoid list / detail page will surface.
    }
  }

  // ─── Organic / no-palm preference (mild bonuses) ────────────────

  if (isOrganic && !profile.familyCmpa) {
    // CMPA dominates organic preference; otherwise organic is a mild plus
    score += 3;
    reasons.push({
      key: "organic",
      label: "Organic certified",
      detail: "USDA / EU organic across the supply chain",
      weight: 3,
    });
  }

  if (isNoPalm && !profile.issuesObserved.includes("stools")) {
    score += 2;
    reasons.push({
      key: "no-palm",
      label: "No palm oil",
      detail: "Fat blend without palm olein",
      weight: 2,
    });
  }

  return { score, reasons };
}

// ─── Tiebreakers ─────────────────────────────────────────────────────

function tiebreakerCostBand(f: FormulaProduct): number {
  if (f.segments.includes("private_label")) return 0;
  if (f.segments.includes("mass_market")) return 1;
  if (f.segments.includes("premium_dtc")) return 2;
  if (f.segments.includes("european_import")) return 3;
  return 4;
}

// ─── Avoid list ──────────────────────────────────────────────────────

function findAvoidEntries(
  profile: BabyProfile,
  catalog: FormulaProduct[],
  pickedIds: Set<string>,
): AvoidEntry[] {
  const entries: AvoidEntry[] = [];
  const used = new Set(pickedIds);

  if (profile.familySoyAllergy) {
    const soy = catalog.find((f) => hasSoyProtein(f) && !used.has(f.id));
    if (soy) {
      entries.push({
        display: soy.fullName,
        brand: soy.brandName,
        formulaId: soy.id,
        tinAccent: soy.tinAccent,
        reasonText:
          "Family soy allergy + soy-based protein. Avoid until cleared with your pediatrician.",
      });
      used.add(soy.id);
    }
  }

  if (
    profile.familyCmpa &&
    !entries.find((e) => e.formulaId === "alimentum")
  ) {
    // Already filtered by isEligible, but surface a category-level avoid
    const intact = catalog.find(
      (f) =>
        f.segments.includes("mass_market") &&
        isIntactCowMilk(f) &&
        !used.has(f.id),
    );
    if (intact) {
      entries.push({
        display: intact.fullName,
        brand: intact.brandName,
        formulaId: intact.id,
        tinAccent: intact.tinAccent,
        reasonText:
          "Family CMPA + intact cow-milk protein at this stage. Reconsider after 6 months with your pediatrician.",
      });
      used.add(intact.id);
    }
  }

  if (
    profile.familyEczema &&
    profile.issuesObserved.length === 0 &&
    entries.length === 0
  ) {
    const intact = catalog.find(
      (f) =>
        f.segments.includes("mass_market") &&
        isIntactCowMilk(f) &&
        !used.has(f.id),
    );
    if (intact) {
      entries.push({
        display: intact.fullName,
        brand: intact.brandName,
        formulaId: intact.id,
        tinAccent: intact.tinAccent,
        reasonText:
          "Family eczema history + intact cow-milk protein at this stage. Reconsider after 6 months.",
      });
    }
  }

  if (profile.issuesObserved.includes("allergic")) {
    entries.push({
      display: "Anything not hypoallergenic",
      tinAccent: "#ECCFC8",
      reasonText:
        "You flagged an allergic reaction. Talk to your pediatrician before introducing any non-hypoallergenic formula.",
    });
  }

  return entries.slice(0, 2);
}

// ─── Narration ───────────────────────────────────────────────────────

const EYEBROW_BY_RANK: Recommendation["eyebrow"][] = [
  "Best match",
  "Close runner-up",
  "Worth knowing",
];

function buildSummary(
  formula: FormulaProduct,
  reasons: Reason[],
  babyNameFirst: string,
): string {
  if (reasons.length === 0) {
    return `Matches the basic profile you described for ${babyNameFirst}.`;
  }
  const top = reasons
    .filter((r) => r.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  if (top.length === 0) {
    return `${formula.brandName} ${formula.productName.toLowerCase()} is in range for ${babyNameFirst}.`;
  }
  const labels = top.map((r) => r.label.toLowerCase());
  if (labels.length === 1) {
    return `Picked because: ${labels[0]}.`;
  }
  if (labels.length === 2) {
    return `Picked because: ${labels[0]} and ${labels[1]}.`;
  }
  return `Picked because: ${labels[0]}, ${labels[1]}, and ${labels[2]}.`;
}

// ─── Public API ──────────────────────────────────────────────────────

export function recommend(
  profile: BabyProfile,
  options: RecommendOptions = {},
): RecommendationResult {
  const catalog = options.catalog ?? FORMULA_CATALOG;
  const eligible = catalog.filter((f) => isEligible(f, profile));

  const scored = eligible
    .map((f) => ({ formula: f, ...scoreOne(f, profile) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const costA = tiebreakerCostBand(a.formula);
      const costB = tiebreakerCostBand(b.formula);
      if (costA !== costB) return costA - costB;
      return a.formula.brandName.localeCompare(b.formula.brandName);
    });

  const picks: Recommendation[] = scored.slice(0, 3).map((s, i) => ({
    formula: s.formula,
    rank: (i + 1) as 1 | 2 | 3,
    eyebrow: EYEBROW_BY_RANK[i] ?? "Worth knowing",
    score: s.score,
    reasons: s.reasons.sort((a, b) => b.weight - a.weight),
    summary: buildSummary(s.formula, s.reasons, profile.babyNameFirst),
  }));

  const avoid = findAvoidEntries(profile, catalog, new Set(picks.map((p) => p.formula.id)));

  // Confidence floor: top pick must have at least one weighted reason
  // beyond the base score. Otherwise we're guessing.
  const confident =
    picks.length > 0 && picks[0]!.reasons.some((r) => r.weight >= 10);

  return { picks, avoid, confident };
}
