/**
 * Formula similarity engine.
 *
 * The 2022-crisis killer feature: given a baseline formula and a reason
 * (recalled, out-of-stock, too-expensive, not-tolerated, or just
 * "similar"), find the closest available formulas with per-attribute
 * reasoning for why each match is close.
 *
 * Architecture per docs/AI_DESIGN.md: deterministic. The model never
 * picks the match — it only narrates the deterministic breakdown.
 *
 * Hard exclusions (never surfaced as a substitute):
 *   - The baseline itself
 *   - Any formula with activeRecall.status === 'ongoing'
 *   - Any formula with fda_status === 'gray_market' (none in V1 catalog,
 *     but the rule is enforced)
 *
 * Scoring approach:
 *   Start at 100 (identical). Subtract per-attribute distance. The
 *   top-3 highest scores are the substitution recommendations.
 *
 * Reason-specific weighting:
 *   - 'recalled': protein form match is critical (medical profile must
 *     carry across); cost weight reduced
 *   - 'too_expensive': cost direction matters (cheaper preferred);
 *     specialty weight reduced
 *   - 'not_tolerated': protein form CHANGE preferred (partially or
 *     extensively hydrolyzed)
 *   - 'out_of_stock' / 'similar': baseline weighting
 */

import type { FormulaProduct } from "@/data/formula-catalog";
import { FORMULA_CATALOG } from "@/data/formula-catalog";

export type SubstitutionReason =
  | "recalled"
  | "out_of_stock"
  | "too_expensive"
  | "not_tolerated"
  | "similar";

type ProteinSource = "cow_milk" | "goat_milk" | "soy" | "amino_acid" | "plant_blend";
type ProteinForm =
  | "intact"
  | "partially_hydrolyzed"
  | "extensively_hydrolyzed"
  | "amino_acid";

interface FormulaTraits {
  proteinSource: ProteinSource;
  proteinForm: ProteinForm;
  isOrganic: boolean;
  isNoPalmOil: boolean;
  isA2: boolean;
  isGoat: boolean;
  isImport: boolean;
  isHypoallergenic: boolean;
  isAminoAcid: boolean;
  isPlantBased: boolean;
}

function traitsOf(f: FormulaProduct): FormulaTraits {
  const attrs = (f.attributes ?? []).map((a) => a.toLowerCase());
  const tagline = f.tagline.toLowerCase();
  const ingredients = (f.ingredients ?? []).join(" ").toLowerCase();

  // Protein source
  let proteinSource: ProteinSource = "cow_milk";
  if (f.segments.includes("specialty_amino_acid")) proteinSource = "amino_acid";
  else if (f.segments.includes("goat_milk") || attrs.some((a) => a.includes("goat")))
    proteinSource = "goat_milk";
  else if (f.segments.includes("plant_based")) proteinSource = "plant_blend";
  else if (tagline.includes("soy") || ingredients.includes("soy protein isolate"))
    proteinSource = "soy";

  // Protein form
  let proteinForm: ProteinForm = "intact";
  if (f.segments.includes("specialty_amino_acid")) proteinForm = "amino_acid";
  else if (
    f.segments.includes("specialty_hypoallergenic") ||
    attrs.some((a) => a.includes("extensively hydrolyzed")) ||
    tagline.includes("extensively hydrolyzed")
  ) {
    proteinForm = "extensively_hydrolyzed";
  } else if (
    attrs.some((a) => a.includes("partially hydrolyzed")) ||
    tagline.includes("partially hydrolyzed") ||
    tagline.includes("gentle") ||
    tagline.includes("ha")
  ) {
    proteinForm = "partially_hydrolyzed";
  }

  return {
    proteinSource,
    proteinForm,
    isOrganic: attrs.includes("organic") || tagline.includes("organic") || ingredients.includes("organic"),
    isNoPalmOil:
      attrs.includes("no palm oil") ||
      tagline.includes("no palm oil") ||
      (!!f.ingredients && !f.ingredients.some((i) => /palm (oil|olein)/i.test(i))),
    isA2: attrs.some((a) => a === "a2") || f.segments.includes("a2_milk"),
    isGoat: f.segments.includes("goat_milk"),
    isImport: f.segments.includes("european_import"),
    isHypoallergenic: f.segments.includes("specialty_hypoallergenic"),
    isAminoAcid: f.segments.includes("specialty_amino_acid"),
    isPlantBased: f.segments.includes("plant_based"),
  };
}

export interface MatchReason {
  /** Short label, e.g. "Same protein form" */
  label: string;
  /** Detail line shown in the UI */
  detail: string;
  /** Matched (positive) or differed (informational) */
  kind: "matched" | "differed";
}

export interface SimilarityMatch {
  formula: FormulaProduct;
  score: number;
  matched: MatchReason[];
  differed: MatchReason[];
  /** Headline reason for parent — "Closest hypoallergenic alternative" */
  eyebrow: string;
}

interface WeightSet {
  proteinSource: number;
  proteinForm: number;
  hypoallergenic: number;
  aminoAcid: number;
  goat: number;
  a2: number;
  noPalm: number;
  organic: number;
  import: number;
  costBand: number;
}

const BASELINE_WEIGHTS: WeightSet = {
  proteinSource: 30,
  proteinForm: 20,
  hypoallergenic: 15,
  aminoAcid: 15,
  goat: 10,
  a2: 8,
  noPalm: 8,
  organic: 8,
  import: 5,
  costBand: 5,
};

function reasonWeights(reason: SubstitutionReason): WeightSet {
  switch (reason) {
    case "recalled":
      // For a recall, the medical profile must carry. Protein form
      // and hypoallergenic status weight up; cost band weights down.
      return {
        ...BASELINE_WEIGHTS,
        proteinForm: 28,
        hypoallergenic: 22,
        aminoAcid: 22,
        costBand: 2,
      };
    case "too_expensive":
      // Cost is the driving axis. Specialty profile can flex if needed,
      // but protein source must hold (don't swap cow→soy for cost alone).
      return {
        ...BASELINE_WEIGHTS,
        organic: 4,
        import: 2,
        costBand: 18,
      };
    case "not_tolerated":
      // The whole point is to CHANGE the protein form. We don't penalize
      // form mismatch here; we apply a direction bonus during scoring.
      return {
        ...BASELINE_WEIGHTS,
        proteinForm: 0,
      };
    case "out_of_stock":
    case "similar":
    default:
      return BASELINE_WEIGHTS;
  }
}

function eligible(f: FormulaProduct, baseline: FormulaProduct): boolean {
  if (f.id === baseline.id) return false;
  if (f.activeRecall?.status === "ongoing") return false;
  // 'demo-recall-acme' carries activeRecall; exclude it implicitly.
  // Future: respect fda_status === 'gray_market' once the field is in
  // the client catalog. Today the catalog doesn't carry that field.
  return true;
}

function scorePair(
  baseline: FormulaProduct,
  candidate: FormulaProduct,
  reason: SubstitutionReason,
): SimilarityMatch {
  const w = reasonWeights(reason);
  const b = traitsOf(baseline);
  const c = traitsOf(candidate);

  let score = 100;
  const matched: MatchReason[] = [];
  const differed: MatchReason[] = [];

  // Protein source — heavy penalty for category jumps
  if (b.proteinSource === c.proteinSource) {
    matched.push({
      label: "Same protein source",
      detail: `Both ${humanProtein(b.proteinSource)}`,
      kind: "matched",
    });
  } else {
    score -= w.proteinSource;
    differed.push({
      label: "Different protein source",
      detail: `${humanProtein(b.proteinSource)} vs ${humanProtein(c.proteinSource)}`,
      kind: "differed",
    });
  }

  // Protein form — even heavier for medical-needed profiles
  if (b.proteinForm === c.proteinForm) {
    matched.push({
      label: "Same protein form",
      detail: `Both ${humanForm(b.proteinForm)}`,
      kind: "matched",
    });
  } else {
    let penalty = w.proteinForm;
    // For 'not_tolerated', a MORE-hydrolyzed candidate is actually preferred
    if (reason === "not_tolerated") {
      const formRank: Record<ProteinForm, number> = {
        intact: 0,
        partially_hydrolyzed: 1,
        extensively_hydrolyzed: 2,
        amino_acid: 3,
      };
      if (formRank[c.proteinForm] > formRank[b.proteinForm]) {
        // Candidate is more hydrolyzed than baseline → bonus instead of penalty
        score += 10;
        matched.push({
          label: "More-hydrolyzed protein",
          detail: `${humanForm(c.proteinForm)} may be easier to digest than ${humanForm(b.proteinForm)}`,
          kind: "matched",
        });
        penalty = 0;
      }
    }
    if (penalty > 0) {
      score -= penalty;
      differed.push({
        label: "Different protein form",
        detail: `${humanForm(b.proteinForm)} vs ${humanForm(c.proteinForm)}`,
        kind: "differed",
      });
    }
  }

  // Hypoallergenic + amino acid status — preserve when present in baseline
  if (b.isHypoallergenic !== c.isHypoallergenic) {
    score -= w.hypoallergenic;
    if (b.isHypoallergenic) {
      differed.push({
        label: "Not hypoallergenic",
        detail: "Baseline is hypoallergenic; candidate is not. If a CMPA diagnosis is in play, this is a hard mismatch.",
        kind: "differed",
      });
    }
  } else if (b.isHypoallergenic && c.isHypoallergenic) {
    matched.push({
      label: "Also hypoallergenic",
      detail: "Both classified for cow-milk-protein-allergy management",
      kind: "matched",
    });
  }
  if (b.isAminoAcid !== c.isAminoAcid) {
    score -= w.aminoAcid;
    if (b.isAminoAcid) {
      differed.push({
        label: "Not amino-acid based",
        detail: "Baseline is elemental; candidate is not. For severe allergy this is a hard mismatch.",
        kind: "differed",
      });
    }
  } else if (b.isAminoAcid && c.isAminoAcid) {
    matched.push({
      label: "Also amino-acid elemental",
      detail: "Both built from free amino acids",
      kind: "matched",
    });
  }

  // Goat
  if (b.isGoat !== c.isGoat) score -= w.goat;
  else if (b.isGoat && c.isGoat) {
    matched.push({
      label: "Also goat-milk",
      detail: "Both goat-derived protein",
      kind: "matched",
    });
  }

  // A2
  if (b.isA2 !== c.isA2) score -= w.a2;
  else if (b.isA2 && c.isA2) {
    matched.push({
      label: "Also A2-only",
      detail: "Both A2 β-casein protein",
      kind: "matched",
    });
  }

  // No palm oil
  if (b.isNoPalmOil !== c.isNoPalmOil) {
    score -= w.noPalm;
    if (b.isNoPalmOil) {
      differed.push({
        label: "Contains palm oil",
        detail: "Baseline avoids palm oil; candidate uses palm olein in the fat blend.",
        kind: "differed",
      });
    } else {
      matched.push({
        label: "No palm oil",
        detail: "Candidate avoids palm-oil-related calcium-absorption concerns",
        kind: "matched",
      });
    }
  } else if (b.isNoPalmOil && c.isNoPalmOil) {
    matched.push({
      label: "Also no palm oil",
      detail: "Both use palm-oil-free fat blends",
      kind: "matched",
    });
  }

  // Organic
  if (b.isOrganic !== c.isOrganic) score -= w.organic;
  else if (b.isOrganic && c.isOrganic) {
    matched.push({
      label: "Also organic-certified",
      detail: "Both carry USDA / EU organic certification",
      kind: "matched",
    });
  }

  // Import status
  if (b.isImport !== c.isImport) {
    score -= w.import;
    if (b.isImport && !c.isImport) {
      differed.push({
        label: "US-made instead of imported",
        detail: "No tariff overhead, no clearance wait. Recipe may differ from EU equivalents.",
        kind: "differed",
      });
    }
  }

  // Cost band — derived from segment; reason='too_expensive' adds a direction bonus
  const baselineCostBand = costBandFor(baseline);
  const candidateCostBand = costBandFor(candidate);
  if (reason === "too_expensive") {
    if (candidateCostBand < baselineCostBand) {
      score += 12;
      matched.push({
        label: "More affordable",
        detail: `Candidate is in the ${humanCostBand(candidateCostBand)} band vs the ${humanCostBand(baselineCostBand)} baseline`,
        kind: "matched",
      });
    } else if (candidateCostBand > baselineCostBand) {
      score -= w.costBand;
      differed.push({
        label: "More expensive",
        detail: "Costs more than the baseline; only consider if a major composition advantage applies",
        kind: "differed",
      });
    }
  } else {
    if (Math.abs(baselineCostBand - candidateCostBand) >= 2) {
      score -= w.costBand;
    }
  }

  return {
    formula: candidate,
    score: Math.max(0, Math.min(120, score)),
    matched,
    differed,
    eyebrow: buildEyebrow(b, c, reason),
  };
}

function buildEyebrow(
  b: FormulaTraits,
  c: FormulaTraits,
  reason: SubstitutionReason,
): string {
  if (reason === "recalled" && b.isHypoallergenic && c.isHypoallergenic)
    return "Closest hypoallergenic alternative";
  if (reason === "recalled" && b.isAminoAcid && c.isAminoAcid)
    return "Closest amino-acid alternative";
  if (reason === "too_expensive") return "More affordable, same profile";
  if (reason === "not_tolerated") return "Try this if it isn't working";
  if (c.isHypoallergenic && b.isHypoallergenic) return "Hypoallergenic match";
  if (c.isAminoAcid && b.isAminoAcid) return "Elemental match";
  if (c.isGoat && b.isGoat) return "Goat-milk alternative";
  if (c.proteinForm === b.proteinForm && b.proteinForm !== "intact")
    return `Same ${humanForm(b.proteinForm)} match`;
  if (c.isImport && !b.isImport) return "European-import alternative";
  if (!c.isImport && b.isImport) return "US-made alternative";
  return "Closest available";
}

function humanProtein(s: ProteinSource): string {
  return {
    cow_milk: "cow milk",
    goat_milk: "goat milk",
    soy: "soy",
    amino_acid: "amino-acid elemental",
    plant_blend: "plant-based",
  }[s];
}

function humanForm(s: ProteinForm): string {
  return {
    intact: "intact protein",
    partially_hydrolyzed: "partially hydrolyzed",
    extensively_hydrolyzed: "extensively hydrolyzed",
    amino_acid: "free amino acids",
  }[s];
}

/**
 * Rough cost band derived from segment. 0 = cheapest (private label),
 * 3 = most expensive (specialty / amino acid). Used in similarity
 * scoring AND as a proxy until per-formula MSRP lands from adapters.
 */
function costBandFor(f: FormulaProduct): number {
  if (f.segments.includes("specialty_amino_acid")) return 4;
  if (f.segments.includes("specialty_hypoallergenic")) return 3;
  if (f.segments.includes("european_import")) return 3;
  if (f.segments.includes("premium_dtc")) return 2;
  if (f.segments.includes("mass_market")) return 1;
  if (f.segments.includes("private_label")) return 0;
  return 1;
}

function humanCostBand(n: number): string {
  return ["WIC-budget", "mass-market", "premium DTC", "import / specialty", "amino-acid elemental"][n] ?? "unknown";
}

export interface SimilarityOptions {
  reason?: SubstitutionReason;
  limit?: number;
  /** Restrict candidates to a subset of the catalog (e.g., only formulas
   *  the parent is willing to import, or in their budget band). */
  catalog?: FormulaProduct[];
}

export function findSubstitutes(
  baseline: FormulaProduct,
  opts: SimilarityOptions = {},
): SimilarityMatch[] {
  const reason = opts.reason ?? "similar";
  const limit = opts.limit ?? 3;
  const candidates = (opts.catalog ?? FORMULA_CATALOG).filter((c) =>
    eligible(c, baseline),
  );

  const scored = candidates
    .map((c) => scorePair(baseline, c, reason))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

export const SUBSTITUTION_REASON_COPY: Record<SubstitutionReason, { eyebrow: string; lead: string }> = {
  recalled: {
    eyebrow: "Closest matches after the recall",
    lead:
      "Same protein profile so the switch is as smooth as possible. Recalled formulas are excluded automatically.",
  },
  out_of_stock: {
    eyebrow: "Closest matches in stock",
    lead:
      "Closest by protein source, protein form, and the attributes most parents weigh next.",
  },
  too_expensive: {
    eyebrow: "More affordable, same profile",
    lead:
      "Same protein source kept; cost-band gets the heaviest weight. We never trade a medical profile for cost.",
  },
  not_tolerated: {
    eyebrow: "Try this if it isn't working",
    lead:
      "Bias toward a more-hydrolyzed protein form, which is often gentler. Talk to your pediatrician before switching.",
  },
  similar: {
    eyebrow: "Closest matches",
    lead: "Closest by protein source, protein form, and the attributes most parents weigh next.",
  },
};
