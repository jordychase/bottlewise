/**
 * Bottlewise ingredient-concern database.
 *
 * Each entry encodes a known position in published nutrition / regulatory
 * literature about an ingredient. Bottlewise does NOT invent positions
 * and does NOT make medical claims. Every entry cites the source
 * category so the parent can follow up.
 *
 * Compliance contract (PRD § 2 Tier 1):
 *   - We surface a concern, we do not claim harm.
 *   - We name the source (FDA position, EU regulation, peer-reviewed
 *     research category, AAP guidance).
 *   - We never say "this ingredient is dangerous."
 *
 * Maintenance:
 *   - New entry = a new row here + a citation field.
 *   - Removing or changing a position requires a PR + the citation
 *     must support the change.
 *
 * Cross-reference: docs/PRD.md § 2 Compliance framework.
 */

export type ConcernSeverity = "watch" | "moderate" | "significant";
export type ConcernCategory =
  | "carbohydrate"
  | "fat"
  | "protein"
  | "additive"
  | "processing"
  | "contamination"
  | "gmo"
  | "missing_preferred";

export interface IngredientConcern {
  /** Lowercase canonical name. Match against ingredient list using
   *  case-insensitive substring search. */
  match: string;
  /** Display name in the UI. */
  display: string;
  category: ConcernCategory;
  severity: ConcernSeverity;
  /** Score penalty applied to the formula's base 100. */
  penalty: number;
  /** Plain-language reason, sourced. No claims of harm — only positions. */
  reason: string;
  /** Citation category. Concrete URL not required at this layer. */
  source: string;
  /** If true, only counts when this is the PRIMARY (first listed) ingredient
   *  or one of the first three. Avoids double-penalizing trace amounts. */
  primaryOnly?: boolean;
}

export interface PositiveMarker {
  match: string;
  display: string;
  bonus: number;
  reason: string;
}

export const CONCERNS: IngredientConcern[] = [
  // ─── Carbohydrate / sweetener concerns ──────────────────────────────
  {
    match: "corn syrup solids",
    display: "Corn syrup solids",
    category: "carbohydrate",
    severity: "moderate",
    penalty: 15,
    reason:
      "Some pediatric nutrition guidance prefers lactose as the primary carbohydrate when an infant tolerates it. Corn syrup solids are common in US formulas but are less preferred where lactose is an option.",
    source: "AAP committee on nutrition; EU infant formula composition rules",
    primaryOnly: true,
  },
  {
    match: "sucrose",
    display: "Sucrose",
    category: "carbohydrate",
    severity: "moderate",
    penalty: 10,
    reason:
      "Added sucrose in infant formula is restricted in the EU and discouraged for routine-use formulas in many pediatric guidelines.",
    source: "EU Commission Delegated Regulation 2016/127",
  },
  {
    match: "brown rice syrup",
    display: "Brown rice syrup",
    category: "carbohydrate",
    severity: "watch",
    penalty: 5,
    reason:
      "Some 2012-era and follow-up reports raised arsenic-content concerns in rice-derived sweeteners; routine surveillance has improved but the position remains 'watch'.",
    source: "Consumer Reports 2012; FDA action levels for inorganic arsenic",
  },

  // ─── Fat concerns ───────────────────────────────────────────────────
  {
    match: "palm oil",
    display: "Palm oil",
    category: "fat",
    severity: "moderate",
    penalty: 10,
    reason:
      "Palm oil is used to mimic the palmitic-acid content of breast milk. Some studies suggest it may reduce calcium absorption and produce harder stools compared to no-palm-oil fat blends.",
    source: "Pediatric nutrition reviews; multiple RCTs",
  },
  {
    match: "palm olein",
    display: "Palm olein",
    category: "fat",
    severity: "moderate",
    penalty: 10,
    reason:
      "Closely related to palm oil and carries the same calcium-absorption discussion.",
    source: "Pediatric nutrition reviews",
  },
  {
    match: "hexane",
    display: "Hexane-extracted DHA/ARA",
    category: "processing",
    severity: "watch",
    penalty: 5,
    reason:
      "Algal/fungal DHA + ARA are commonly extracted using hexane as a solvent. Trace residues are within regulatory limits but the practice is excluded from EU organic standards.",
    source: "EU Council Regulation 834/2007 (organic); USDA NOSB minority statements",
  },

  // ─── Additives ──────────────────────────────────────────────────────
  {
    match: "carrageenan",
    display: "Carrageenan",
    category: "additive",
    severity: "significant",
    penalty: 25,
    reason:
      "Banned in infant formula in the EU. Long-running debate over inflammatory effects in animal models; FDA permits its use in the US but consumer-pressure brands routinely exclude it.",
    source: "EU Commission Delegated Regulation 2016/127 Annex II; FDA 21 CFR 172.620",
  },
  {
    match: "soy lecithin",
    display: "Soy lecithin",
    category: "additive",
    severity: "watch",
    penalty: 2,
    reason:
      "Emulsifier; trace allergen relevant only if soy allergy is in the family history. Otherwise routine.",
    source: "FDA major allergen labeling; pediatric allergy guidance",
  },
  {
    match: "synthetic taurine",
    display: "Synthetic taurine",
    category: "additive",
    severity: "watch",
    penalty: 0,
    reason:
      "Permitted and routinely added; informational only.",
    source: "FDA 21 CFR 107",
  },

  // ─── GMO / sourcing ─────────────────────────────────────────────────
  {
    match: "corn maltodextrin",
    display: "Corn maltodextrin (non-organic)",
    category: "gmo",
    severity: "watch",
    penalty: 3,
    reason:
      "If the formula is not certified organic and corn-derived ingredients are present, the corn is most likely GMO. The position on GMO infant nutrition varies; EU labels it, US does not require disclosure.",
    source: "USDA Organic standards; EU labeling rules",
  },
];

export const POSITIVE_MARKERS: PositiveMarker[] = [
  {
    match: "organic",
    display: "USDA / EU Organic certified",
    bonus: 8,
    reason: "Certified organic across the supply chain; GMO + synthetic-pesticide exclusion.",
  },
  {
    match: "lactose",
    display: "Lactose as primary carbohydrate",
    bonus: 6,
    reason: "Matches the carbohydrate profile of breast milk. Preferred by most pediatric guidance when tolerated.",
  },
  {
    match: "whole milk",
    display: "Whole-milk fat blend",
    bonus: 4,
    reason: "Uses milk fat rather than vegetable oils to supply fatty acids; closer to breast-milk composition for that fat fraction.",
  },
  {
    match: "no palm oil",
    display: "No palm oil",
    bonus: 5,
    reason: "Avoids palm-oil-related calcium-absorption discussion.",
  },
  {
    match: "a2",
    display: "A2-only β-casein",
    bonus: 3,
    reason: "Some research suggests A2-only milk may be gentler on digestion for some infants compared with A1+A2 blends.",
  },
  {
    match: "hmo",
    display: "Human milk oligosaccharides (HMOs)",
    bonus: 4,
    reason: "Functional carbohydrates that mirror a class of compounds in breast milk; supports gut microbiota composition.",
  },
  {
    match: "mfgm",
    display: "Milk fat globule membrane (MFGM)",
    bonus: 3,
    reason: "Bioactive fraction normally found in whole milk; supports cognitive and immune development per recent RCTs.",
  },
  {
    match: "lactoferrin",
    display: "Lactoferrin",
    bonus: 3,
    reason: "Iron-binding protein found in colostrum; supports immune function.",
  },
];

/**
 * Concerns that should fire based on what's MISSING. E.g., a non-organic
 * cow-milk formula doesn't get penalized for the absence of organic, but
 * we surface "Not organic" as informational context, not a score penalty.
 */
export interface AbsenceNote {
  match: string;
  display: string;
  display_when_present: string;
  display_when_absent: string;
}
