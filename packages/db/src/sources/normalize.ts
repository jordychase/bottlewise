/**
 * Raw → NormalizedFormula. Each engine's raw payload is parsed into a
 * common shape that maps onto the `formulas` + `formula_ingredients`
 * tables in DATA_MODEL.md.
 *
 * Field coverage is engine-dependent. Where a field can't be inferred,
 * we leave it undefined and let the merge layer (per DATA_SOURCING.md
 * § 4) fill from a higher-precedence source.
 */

import { load } from "cheerio";
import type {
  NormalizedFormula,
  ProteinForm,
  ProteinSource,
  RawProduct,
  FormulaStage,
} from "./types.js";

const ALLERGENS = [
  "milk",
  "soy",
  "egg",
  "wheat",
  "fish",
  "shellfish",
  "tree nut",
  "peanut",
  "sesame",
];

function inferProteinSource(text: string): ProteinSource | undefined {
  const t = text.toLowerCase();
  if (/amino acid|elemental|free amino acids/.test(t)) return "amino_acid";
  if (/goat\s*milk|goat[- ]derived/.test(t)) return "goat_milk";
  if (/almond|buckwheat|tapioca|plant[- ]based/.test(t)) return "plant_blend";
  if (
    /\bcow\b|whole milk|nonfat milk|reduced minerals whey|whey protein|casein|a2 (milk|protein|beta)|skim milk/.test(
      t,
    )
  )
    return "cow_milk";
  if (
    /\bsoy protein\b|soy isolate|isolated soy protein|isomil|prosobee|soy[- ]based/.test(
      t,
    )
  )
    return "soy";
  return undefined;
}

function inferProteinForm(text: string): ProteinForm | undefined {
  const t = text.toLowerCase();
  if (/extensively hydrolyzed|extensively hydrolysed/.test(t))
    return "extensively_hydrolyzed";
  if (/partially hydrolyzed|partially hydrolysed/.test(t))
    return "partially_hydrolyzed";
  if (/amino acid|elemental/.test(t)) return "amino_acid";
  if (/intact protein/.test(t)) return "intact";
  return undefined;
}

function inferStage(text: string): FormulaStage | undefined {
  const t = text.toLowerCase();
  if (/preemie|premature|preterm/.test(t)) return "preemie";
  if (/toddler|12\+|12 months|stage 3/.test(t)) return "toddler_12_plus";
  if (/stage 2|6-12 months|6 to 12/.test(t)) return "follow_on_eu_2";
  if (/stage 3|10\+ months/.test(t)) return "follow_on_eu_3";
  return "infant_0_12";
}

const SPECIALTY_PATTERNS: Array<[string, RegExp]> = [
  ["organic", /\borganic\b/i],
  ["non_gmo", /\bnon[- ]?gmo\b/i],
  ["a2", /\ba2 (milk|protein|beta)/i],
  ["kosher", /\bkosher\b/i],
  ["halal", /\bhalal\b/i],
  ["lactose_free", /\blactose[- ]?free\b/i],
  ["grass_fed", /\bgrass[- ]?fed\b/i],
  ["palm_oil_free", /\bpalm[- ]?oil[- ]?free|no palm oil\b/i],
];

function inferSpecialty(text: string): string[] {
  const found = new Set<string>();
  for (const [tag, pat] of SPECIALTY_PATTERNS) {
    if (pat.test(text)) found.add(tag);
  }
  return Array.from(found);
}

const INDICATION_PATTERNS: Array<[string, RegExp]> = [
  ["sensitive", /\bsensitive\b/i],
  ["gentle", /\bgentle\b/i],
  ["anti_reflux", /\banti[- ]?reflux|\bAR\b|spit[- ]?up/i],
  ["hypoallergenic", /\bhypoallergenic\b/i],
  ["preemie", /\bpreemie|premature\b/i],
  ["metabolic", /\bmetabolic|PKU\b/i],
];

function inferIndications(text: string): string[] {
  const found = new Set<string>();
  for (const [tag, pat] of INDICATION_PATTERNS) {
    if (pat.test(text)) found.add(tag);
  }
  return Array.from(found);
}

function parseIngredientsString(raw: string): NormalizedFormula["ingredients"] {
  const cleaned = raw.replace(/^ingredients?:\s*/i, "").trim();
  const parts = cleaned
    .split(/,(?![^()]*\))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((name, idx) => ({
    name,
    displayOrder: idx,
    isPotentialAllergen: ALLERGENS.some((a) =>
      new RegExp(`\\b${a}\\b`, "i").test(name),
    ),
  }));
}

function strip(html: string | undefined): string {
  if (!html) return "";
  return load(`<root>${html}</root>`)("root").text();
}

/**
 * Shopify product → NormalizedFormula. Shopify exposes `body_html` (HTML
 * description), `tags`, `product_type`, and variants with grams. We mine
 * these with patterns, since per-product custom fields aren't standard.
 */
export function normalizeShopifyProduct(raw: RawProduct): NormalizedFormula {
  const p = raw.rawPayload as Record<string, unknown>;
  const title = (p.title as string) ?? "";
  const bodyHtml = (p.body_html as string) ?? "";
  const description = strip(bodyHtml);
  const productType = (p.product_type as string) ?? "";
  const tagsRaw = p.tags as string[] | string | undefined;
  const tags = Array.isArray(tagsRaw) ? tagsRaw.join(" ") : tagsRaw ?? "";

  const haystack = [title, productType, tags, description].join(" ");

  const ingredientMatch = description.match(
    /ingredients?:\s*([^.]+(?:\.[^A-Z][^.]*)*)/i,
  );
  const ingredients = ingredientMatch
    ? parseIngredientsString(ingredientMatch[1]!)
    : undefined;

  const variants = (p.variants as Array<Record<string, unknown>> | undefined) ?? [];
  const packageSizesGrams = variants
    .map((v) => v.grams as number | undefined)
    .filter((g): g is number => typeof g === "number" && g > 0);

  const cheapestPrice = variants
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)[0];

  return {
    brandId: raw.brandId,
    externalId: raw.externalId,
    productUrl: raw.productUrl,
    productName: title,
    stage: inferStage(haystack),
    proteinSource: inferProteinSource(haystack),
    proteinForm: inferProteinForm(haystack),
    ingredients,
    specialtyDesignations: inferSpecialty(haystack),
    pediatricIndications: inferIndications(haystack),
    packageSizesGrams: packageSizesGrams.length ? packageSizesGrams : undefined,
    msrpUsdCents:
      cheapestPrice !== undefined ? Math.round(cheapestPrice * 100) : undefined,
    fetchedAt: raw.fetchedAt,
    sourceProvenance: `shopify:${raw.productUrl}`,
  };
}

/**
 * JSON-LD Product → NormalizedFormula. Schema.org Product has stable
 * fields for name/description/sku but ingredients live in description
 * or additionalProperty when present at all.
 */
export function normalizeJsonLdProduct(raw: RawProduct): NormalizedFormula {
  const p = raw.rawPayload as Record<string, unknown>;
  const name = (p.name as string) ?? "";
  const description = (p.description as string) ?? "";
  const additional = (p.additionalProperty as
    | Array<{ name?: string; value?: string }>
    | undefined) ?? [];

  const ingredientProp = additional.find((a) =>
    /ingredient/i.test(a.name ?? ""),
  );
  const ingredientText =
    ingredientProp?.value ??
    description.match(/ingredients?:\s*([^.]+\.)/i)?.[1] ??
    "";

  const haystack = [name, description].join(" ");

  return {
    brandId: raw.brandId,
    externalId: raw.externalId,
    productUrl: raw.productUrl,
    productName: name,
    stage: inferStage(haystack),
    proteinSource: inferProteinSource(haystack),
    proteinForm: inferProteinForm(haystack),
    ingredients: ingredientText ? parseIngredientsString(ingredientText) : undefined,
    specialtyDesignations: inferSpecialty(haystack),
    pediatricIndications: inferIndications(haystack),
    fetchedAt: raw.fetchedAt,
    sourceProvenance: `jsonld:${raw.productUrl}`,
  };
}

/**
 * Generic HTML scraper output → NormalizedFormula. Field availability
 * depends on per-brand selectors; missing fields are left undefined for
 * the merge layer to fill.
 */
export function normalizeHtmlProduct(raw: RawProduct): NormalizedFormula {
  const p = raw.rawPayload as Record<string, unknown>;
  const title = (p.title as string) ?? "";
  const ingredientsText = (p.ingredients as string) ?? "";
  const description = (p.description as string) ?? "";
  const haystack = [title, description, ingredientsText].join(" ");

  return {
    brandId: raw.brandId,
    externalId: raw.externalId,
    productUrl: raw.productUrl,
    productName: title,
    stage: inferStage(haystack),
    proteinSource: inferProteinSource(haystack),
    proteinForm: inferProteinForm(haystack),
    ingredients: ingredientsText
      ? parseIngredientsString(ingredientsText)
      : undefined,
    specialtyDesignations: inferSpecialty(haystack),
    pediatricIndications: inferIndications(haystack),
    fetchedAt: raw.fetchedAt,
    sourceProvenance: `html:${raw.productUrl}`,
  };
}

export function fieldCoverage(records: NormalizedFormula[]): Record<string, number> {
  if (records.length === 0) return {};
  const fields: Array<keyof NormalizedFormula> = [
    "stage",
    "proteinSource",
    "proteinForm",
    "ingredients",
    "specialtyDesignations",
    "pediatricIndications",
    "packageSizesGrams",
    "msrpUsdCents",
  ];
  const out: Record<string, number> = {};
  for (const f of fields) {
    const present = records.filter((r) => {
      const v = r[f];
      if (v === undefined || v === null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return true;
    }).length;
    out[String(f)] = present / records.length;
  }
  return out;
}
