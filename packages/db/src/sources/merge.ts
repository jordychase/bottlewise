/**
 * Merge layer.
 *
 * Two phases:
 *   1. writeSourceRecords(result) — adapter output → source_records +
 *      source_runs telemetry. Append-only; one row per fetched product.
 *   2. mergeCanonical(brandRegistryId?) — reads recent source_records,
 *      groups by (brand_registry_id, external_id), applies per-field
 *      precedence rules from DATA_SOURCING.md § 4, upserts canonical
 *      formulas + formula_ingredients with provenance attribution,
 *      and logs every conflict to source_conflicts.
 *
 * The pure precedence functions (`pickByPrecedence`, `buildCanonical`)
 * are exported for unit testing without a database round-trip.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdapterResult,
  NormalizedFormula,
  SourceTier,
} from "./types.js";

const TIER_RANK: Record<SourceTier, number> = {
  authoritative: 100,
  manual: 80,
  brand_dtc: 60,
  community: 40,
  retailer: 20,
};

/**
 * Per-field precedence override. When omitted, all tiers compete by
 * `TIER_RANK` and the highest wins (with most-recent observation as
 * tiebreaker). When present, only the listed tiers are eligible to
 * write that field — sources outside the list are ignored entirely.
 */
const FIELD_PRECEDENCE: Partial<Record<keyof NormalizedFormula, SourceTier[]>> = {
  // Clinical claims must come from the brand directly. The community
  // tier (OpenFoodFacts user submissions) cannot speak to indications.
  pediatricIndications: ["brand_dtc", "manual"],
  // Specialty designations: brand DTC, then certifier (manual overlay
  // for USDA Organic / EU Organic verification), then community fill.
  specialtyDesignations: ["brand_dtc", "manual", "community"],
  // Composition: brand DTC always wins; community is fill-only.
  ingredients: ["brand_dtc", "community", "retailer"],
  proteinSource: ["brand_dtc", "community"],
  proteinForm: ["brand_dtc", "community"],
  fatBlend: ["brand_dtc", "community"],
  carbSources: ["brand_dtc", "community"],
  // Pricing comes from retailer adapters; brand DTC is fallback (MSRP).
  msrpUsdCents: ["retailer", "brand_dtc"],
  packageSizesGrams: ["brand_dtc", "retailer", "community"],
};

export function tierOf(adapterId: string): SourceTier {
  if (adapterId.startsWith("fda") || adapterId.startsWith("openfda")) {
    return "authoritative";
  }
  if (
    adapterId.startsWith("off:") ||
    adapterId.startsWith("openfoodfacts") ||
    adapterId.startsWith("usda:")
  ) {
    return "community";
  }
  if (
    adapterId.startsWith("shopify:") ||
    adapterId.startsWith("jsonld:") ||
    adapterId.startsWith("html:")
  ) {
    return "brand_dtc";
  }
  if (adapterId.startsWith("retailer:") || adapterId.startsWith("amazon") ||
      adapterId.startsWith("walmart") || adapterId.startsWith("target")) {
    return "retailer";
  }
  return "manual";
}

export interface FieldCandidate<T> {
  adapterId: string;
  observedAt: string;
  value: T | undefined;
}

export interface PickResult<T> {
  value: T | undefined;
  source: string | undefined;
  /** Other candidates that were considered but lost — written to
   *  source_conflicts as the audit trail. */
  conflicts: Array<{ source: string; value: T }>;
}

export function pickByPrecedence<T>(
  candidates: FieldCandidate<T>[],
  fieldName: keyof NormalizedFormula,
): PickResult<T> {
  const allowedTiers = FIELD_PRECEDENCE[fieldName];

  const eligible = candidates
    .filter((c) => c.value !== undefined && c.value !== null)
    .map((c) => ({
      ...c,
      tier: tierOf(c.adapterId),
    }))
    .filter((c) => !allowedTiers || allowedTiers.includes(c.tier))
    .map((c) => ({
      ...c,
      // Use FIELD_PRECEDENCE order if defined; else TIER_RANK.
      rank: allowedTiers
        ? allowedTiers.length - allowedTiers.indexOf(c.tier)
        : TIER_RANK[c.tier],
    }))
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return b.observedAt.localeCompare(a.observedAt);
    });

  if (eligible.length === 0) {
    return { value: undefined, source: undefined, conflicts: [] };
  }
  const winner = eligible[0]!;
  const conflicts = eligible
    .slice(1)
    .filter((c) => c.value !== undefined && !deepEqual(c.value, winner.value))
    .map((c) => ({ source: c.adapterId, value: c.value as T }));
  return {
    value: winner.value,
    source: winner.adapterId,
    conflicts,
  };
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length && a.every((v, i) => deepEqual(v, b[i]))
    );
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.length !== kb.length) return false;
    return ka.every(
      (k, i) =>
        k === kb[i] &&
        deepEqual(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
        ),
    );
  }
  return false;
}

export interface CanonicalBuildInput {
  brandRegistryId: string;
  externalId: string;
  records: Array<{
    adapterId: string;
    observedAt: string;
    payload: NormalizedFormula;
  }>;
}

export interface CanonicalBuildResult {
  canonical: NormalizedFormula;
  provenance: Record<string, { source: string; observedAt: string }>;
  conflicts: Array<{
    field: string;
    winningSource: string;
    losingSource: string;
    winningValue: unknown;
    losingValue: unknown;
  }>;
}

const FIELDS_TO_MERGE: Array<keyof NormalizedFormula> = [
  "productName",
  "stage",
  "proteinSource",
  "proteinForm",
  "carbSources",
  "fatBlend",
  "ingredients",
  "specialtyDesignations",
  "pediatricIndications",
  "packageSizesGrams",
  "msrpUsdCents",
];

/**
 * Pure merge: takes the source records for a single product and
 * produces the canonical normalized record + provenance + conflict
 * audit trail. No DB calls — easy to unit-test.
 */
export function buildCanonical(input: CanonicalBuildInput): CanonicalBuildResult {
  const provenance: Record<string, { source: string; observedAt: string }> = {};
  const conflicts: CanonicalBuildResult["conflicts"] = [];

  const newest = [...input.records].sort((a, b) =>
    b.observedAt.localeCompare(a.observedAt),
  )[0];

  if (!newest) {
    throw new Error(
      `buildCanonical: no records for ${input.brandRegistryId}/${input.externalId}`,
    );
  }

  const canonical: NormalizedFormula = {
    brandId: input.brandRegistryId,
    externalId: input.externalId,
    productUrl: newest.payload.productUrl,
    productName: newest.payload.productName,
    fetchedAt: newest.observedAt,
    sourceProvenance: newest.adapterId,
  };

  for (const field of FIELDS_TO_MERGE) {
    const candidates: FieldCandidate<unknown>[] = input.records.map((r) => ({
      adapterId: r.adapterId,
      observedAt: r.observedAt,
      value: r.payload[field] as unknown,
    }));
    const pick = pickByPrecedence(candidates, field);
    if (pick.value !== undefined) {
      (canonical as unknown as Record<string, unknown>)[field as string] =
        pick.value;
      provenance[field as string] = {
        source: pick.source!,
        observedAt:
          input.records.find((r) => r.adapterId === pick.source)?.observedAt ??
          newest.observedAt,
      };
      for (const c of pick.conflicts) {
        conflicts.push({
          field: field as string,
          winningSource: pick.source!,
          losingSource: c.source,
          winningValue: pick.value,
          losingValue: c.value,
        });
      }
    }
  }

  return { canonical, provenance, conflicts };
}

// -------------------------------------------------------------------------
// Database-touching layer. Imports SupabaseClient as a type only so the
// pure functions above can be unit-tested without the @supabase package
// being initialized.
// -------------------------------------------------------------------------

export interface WriteSourceResult {
  recordsInserted: number;
  runId: string | null;
  errors: string[];
}

/**
 * Append every RawProduct from an adapter run to source_records, plus
 * one telemetry row to source_runs. Returns the source_runs.id so a
 * follow-up merge can reference it.
 */
export async function writeSourceRecords(
  client: SupabaseClient,
  result: AdapterResult,
): Promise<WriteSourceResult> {
  const errors: string[] = [];

  let runId: string | null = null;
  const runStatus =
    result.errors.length === 0
      ? "success"
      : result.recordsNormalized > 0
        ? "partial"
        : "failed";

  const runInsert = await client
    .from("source_runs")
    .insert({
      adapter_id: result.adapterId,
      brand_registry_id: result.brandId,
      started_at: result.startedAt,
      ended_at: result.endedAt,
      status: runStatus,
      records_seen: result.recordsSeen,
      records_upserted: result.recordsNormalized,
      field_coverage: result.fieldCoverage,
      errors: result.errors,
    })
    .select("id")
    .single();

  if (runInsert.error) {
    errors.push(`source_runs insert failed: ${runInsert.error.message}`);
  } else {
    runId = (runInsert.data as { id: string }).id;
  }

  if (result.rawProducts.length === 0) {
    return { recordsInserted: 0, runId, errors };
  }

  const rows = result.rawProducts.map((rp) => ({
    adapter_id: result.adapterId,
    external_id: rp.externalId,
    brand_registry_id: result.brandId,
    payload: { ...rp.rawPayload, _normalized: result.normalized.find(
      (n) => n.externalId === rp.externalId,
    ) ?? null },
    observed_at: rp.fetchedAt,
  }));

  const insert = await client.from("source_records").upsert(rows, {
    onConflict: "adapter_id,external_id,observed_at",
    ignoreDuplicates: true,
  });

  if (insert.error) {
    errors.push(`source_records insert failed: ${insert.error.message}`);
    return { recordsInserted: 0, runId, errors };
  }

  return { recordsInserted: rows.length, runId, errors };
}

export interface MergeOptions {
  brandRegistryId?: string;
  /** Only consider source_records observed at or after this timestamp. */
  since?: string;
  /** When true, report the merge plan but don't write anything. */
  dryRun?: boolean;
}

export interface MergeResult {
  productsConsidered: number;
  formulasUpserted: number;
  ingredientsUpserted: number;
  conflictsLogged: number;
  errors: string[];
}

interface SourceRecordRow {
  adapter_id: string;
  external_id: string;
  brand_registry_id: string | null;
  payload: { _normalized?: NormalizedFormula | null } & Record<string, unknown>;
  observed_at: string;
}

/**
 * Reads source_records for the requested scope, groups by
 * (brand_registry_id, external_id), runs `buildCanonical` per product,
 * and upserts into formulas + formula_ingredients with provenance.
 * Conflicts are logged to source_conflicts.
 */
export async function mergeCanonical(
  client: SupabaseClient,
  opts: MergeOptions = {},
): Promise<MergeResult> {
  const errors: string[] = [];
  let q = client
    .from("source_records")
    .select(
      "adapter_id, external_id, brand_registry_id, payload, observed_at",
    );
  if (opts.brandRegistryId) {
    q = q.eq("brand_registry_id", opts.brandRegistryId);
  }
  if (opts.since) {
    q = q.gte("observed_at", opts.since);
  }
  const { data, error } = await q.returns<SourceRecordRow[]>();
  if (error) {
    return {
      productsConsidered: 0,
      formulasUpserted: 0,
      ingredientsUpserted: 0,
      conflictsLogged: 0,
      errors: [`source_records query failed: ${error.message}`],
    };
  }

  const grouped = new Map<string, SourceRecordRow[]>();
  for (const row of data ?? []) {
    if (!row.brand_registry_id) continue;
    const key = `${row.brand_registry_id} ${row.external_id}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  let formulasUpserted = 0;
  let ingredientsUpserted = 0;
  let conflictsLogged = 0;

  for (const [key, rows] of grouped) {
    const [brandRegistryId, externalId] = key.split(" ");
    const records = rows
      .filter((r) => r.payload._normalized)
      .map((r) => ({
        adapterId: r.adapter_id,
        observedAt: r.observed_at,
        payload: r.payload._normalized as NormalizedFormula,
      }));
    if (records.length === 0) continue;

    let merge: CanonicalBuildResult;
    try {
      merge = buildCanonical({
        brandRegistryId: brandRegistryId!,
        externalId: externalId!,
        records,
      });
    } catch (err) {
      errors.push(
        `${brandRegistryId}/${externalId}: ${(err as Error).message}`,
      );
      continue;
    }

    if (opts.dryRun) {
      formulasUpserted++;
      ingredientsUpserted += merge.canonical.ingredients?.length ?? 0;
      conflictsLogged += merge.conflicts.length;
      continue;
    }

    // Resolve brand by registry_id.
    const brandQ = await client
      .from("brands")
      .select("id")
      .eq("registry_id", brandRegistryId)
      .single();
    if (brandQ.error || !brandQ.data) {
      errors.push(
        `brand ${brandRegistryId} not found in brands.registry_id`,
      );
      continue;
    }
    const brandId = (brandQ.data as { id: string }).id;

    const formulaUpsert = await client
      .from("formulas")
      .upsert(
        {
          brand_id: brandId,
          product_name: merge.canonical.productName,
          external_id: externalId,
          product_url: merge.canonical.productUrl,
          stage: merge.canonical.stage,
          protein_source: merge.canonical.proteinSource,
          protein_form: merge.canonical.proteinForm,
          carb_source: merge.canonical.carbSources ?? [],
          fat_blend: merge.canonical.fatBlend ?? null,
          specialty_designations: merge.canonical.specialtyDesignations ?? [],
          pediatric_indications: merge.canonical.pediatricIndications ?? [],
          provenance: merge.provenance,
        },
        { onConflict: "brand_id,product_name" },
      )
      .select("id")
      .single();
    if (formulaUpsert.error) {
      errors.push(
        `formulas upsert ${brandRegistryId}/${merge.canonical.productName}: ${formulaUpsert.error.message}`,
      );
      continue;
    }
    formulasUpserted++;
    const formulaId = (formulaUpsert.data as { id: string }).id;

    if (merge.canonical.ingredients?.length) {
      // Replace ingredient list. Ingredients are cascade-deleted on formulas.delete
      // but here we want to refresh in place — delete + insert is atomic enough
      // for V1 since this is a server-only merge.
      const del = await client
        .from("formula_ingredients")
        .delete()
        .eq("formula_id", formulaId);
      if (del.error) errors.push(`ingredients delete: ${del.error.message}`);

      const rows = merge.canonical.ingredients.map((ing) => ({
        formula_id: formulaId,
        ingredient_name: ing.name,
        display_order: ing.displayOrder,
        is_potential_allergen: ing.isPotentialAllergen ?? false,
      }));
      const ins = await client.from("formula_ingredients").insert(rows);
      if (ins.error) {
        errors.push(`ingredients insert: ${ins.error.message}`);
      } else {
        ingredientsUpserted += rows.length;
      }
    }

    if (merge.conflicts.length) {
      const conflictRows = merge.conflicts.map((c) => ({
        formula_id: formulaId,
        field: c.field,
        old_value: c.losingValue ?? null,
        new_value: c.winningValue ?? null,
        old_source: c.losingSource,
        new_source: c.winningSource,
      }));
      const conf = await client.from("source_conflicts").insert(conflictRows);
      if (conf.error) {
        errors.push(`source_conflicts insert: ${conf.error.message}`);
      } else {
        conflictsLogged += conflictRows.length;
      }
    }
  }

  return {
    productsConsidered: grouped.size,
    formulasUpserted,
    ingredientsUpserted,
    conflictsLogged,
    errors,
  };
}
