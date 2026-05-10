/**
 * Formula-catalog search. Designed to be tolerant of how parents
 * actually search at 2am — partial brand names, colloquial identifiers
 * ("orange can", "WIC formula"), typos in product names, and "the
 * [color] [brand]" patterns.
 *
 * Scoring (highest wins):
 *   100  exact full-name match (case-insensitive)
 *    80  brand-name word exact match
 *    60  product-name word match
 *    40  full-name contains the query as a substring
 *    30  search-tag exact match (e.g. "WIC")
 *    20  search-tag contains the query
 *    10  word in full-name starts with the query (prefix match for typing)
 *
 * Ties broken by mass-market > premium_dtc > private_label > european_import > specialty.
 * Limit defaults to 8; the dropdown should never feel like a wall of text.
 */

import {
  FORMULA_CATALOG,
  type FormulaProduct,
  type FormulaSegment,
} from "@/data/formula-catalog";

const SEGMENT_RANK: Record<FormulaSegment, number> = {
  mass_market: 7,
  premium_dtc: 6,
  private_label: 5,
  european_import: 4,
  specialty_hypoallergenic: 3,
  specialty_amino_acid: 3,
  preemie_post_discharge: 3,
  goat_milk: 4,
  a2_milk: 5,
  plant_based: 4,
  toddler: 4,
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

function scoreFormula(query: string, f: FormulaProduct): number {
  const q = normalize(query);
  if (q.length === 0) return 0;

  const fullName = normalize(f.fullName);
  const brand = normalize(f.brandName);
  const product = normalize(f.productName);
  const tags = f.searchTags.map(normalize);

  let score = 0;

  if (fullName === q) score = Math.max(score, 100);

  const qWords = tokenize(q);
  const fullWords = tokenize(fullName);
  const brandWords = tokenize(brand);
  const productWords = tokenize(product);

  for (const qw of qWords) {
    if (brandWords.includes(qw)) score += 80;
    else if (productWords.includes(qw)) score += 60;
    else if (fullWords.some((w) => w.startsWith(qw))) score += 10;
  }

  if (fullName.includes(q)) score += 40;

  for (const tag of tags) {
    if (tag === q) score += 30;
    else if (tag.includes(q)) score += 20;
  }

  // Boost: full-tag containment of the query word — handles "wic", "target", "costco"
  for (const qw of qWords) {
    if (qw.length < 3) continue;
    for (const tag of tags) {
      if (tag.includes(qw)) score += 5;
    }
  }

  return score;
}

export interface SearchResult {
  formula: FormulaProduct;
  score: number;
}

export function searchFormulas(query: string, limit = 8): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  const scored: SearchResult[] = [];
  for (const formula of FORMULA_CATALOG) {
    const score = scoreFormula(trimmed, formula);
    if (score > 0) scored.push({ formula, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const rankA = Math.max(...a.formula.segments.map((s) => SEGMENT_RANK[s] ?? 0));
    const rankB = Math.max(...b.formula.segments.map((s) => SEGMENT_RANK[s] ?? 0));
    return rankB - rankA;
  });

  return scored.slice(0, limit);
}
