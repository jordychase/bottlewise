/**
 * openFDA enforcement (recalls) adapter.
 *
 * Pulls infant-formula recall events from openFDA's Food Enforcement
 * endpoint. Public API, no auth required. Runs every 15 minutes per
 * DATA_SOURCING.md § 5 — recalls are the highest-stakes data flow
 * because they trigger push notifications to active trial users.
 *
 * Endpoint: https://api.fda.gov/food/enforcement.json
 * Docs: https://open.fda.gov/apis/food/enforcement/
 */

import { getJson } from "../http.js";

const ENDPOINT = "https://api.fda.gov/food/enforcement.json";

const FORMULA_QUERY = [
  '(product_description:"infant formula"',
  'product_description:"baby formula"',
  'product_description:"powdered formula"',
  'product_description:"toddler formula"',
  'product_description:"hypoallergenic formula"',
  'product_description:"amino acid formula")',
].join("+OR+");

export type RecallClassification = "Class I" | "Class II" | "Class III";
export type RecallStatus = "Ongoing" | "Completed" | "Terminated";

export interface OpenFdaRecallRecord {
  recall_number: string;
  product_description: string;
  reason_for_recall: string;
  classification: RecallClassification;
  status: RecallStatus;
  recall_initiation_date: string;
  termination_date?: string;
  recalling_firm: string;
  distribution_pattern?: string;
  voluntary_mandated?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface OpenFdaResponse {
  meta: {
    results: { skip: number; limit: number; total: number };
  };
  results: Array<Record<string, unknown>>;
}

export interface RecallsRunResult {
  fetchedAt: string;
  total: number;
  records: OpenFdaRecallRecord[];
  classI: OpenFdaRecallRecord[];
}

function parseDate(s: string | undefined): string | undefined {
  if (!s || s.length !== 8) return s;
  // openFDA uses YYYYMMDD; normalize to ISO date
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function toRecord(raw: Record<string, unknown>): OpenFdaRecallRecord {
  return {
    recall_number: String(raw.recall_number ?? ""),
    product_description: String(raw.product_description ?? ""),
    reason_for_recall: String(raw.reason_for_recall ?? ""),
    classification: (raw.classification as RecallClassification) ?? "Class III",
    status: (raw.status as RecallStatus) ?? "Ongoing",
    recall_initiation_date:
      parseDate(raw.recall_initiation_date as string) ?? "",
    termination_date: parseDate(raw.termination_date as string),
    recalling_firm: String(raw.recalling_firm ?? ""),
    distribution_pattern: raw.distribution_pattern as string | undefined,
    voluntary_mandated: raw.voluntary_mandated as string | undefined,
    city: raw.city as string | undefined,
    state: raw.state as string | undefined,
    country: raw.country as string | undefined,
  };
}

/**
 * Fetches up to `limit` recall records since `since` (ISO date). Pages
 * via openFDA's skip/limit parameters. Default limit per request is 100,
 * max 1000 — we use 100 to keep individual requests light.
 */
export async function fetchOpenFdaRecalls(opts: {
  since?: string;
  limit?: number;
} = {}): Promise<RecallsRunResult> {
  const limit = opts.limit ?? 1000;
  const pageSize = 100;
  const fetchedAt = new Date().toISOString();
  const since = opts.since
    ? `+AND+recall_initiation_date:[${opts.since.replace(/-/g, "")}+TO+99991231]`
    : "";

  const all: OpenFdaRecallRecord[] = [];
  let total = 0;

  for (let skip = 0; skip < limit; skip += pageSize) {
    const url =
      `${ENDPOINT}?search=${FORMULA_QUERY}${since}&skip=${skip}&limit=${pageSize}`;
    let response: OpenFdaResponse;
    try {
      response = await getJson<OpenFdaResponse>(url);
    } catch (err) {
      // openFDA returns 404 when no records match. Stop pagination.
      if ((err as Error & { status?: number }).status === 404) break;
      throw err;
    }
    total = response.meta?.results?.total ?? 0;
    if (!response.results || response.results.length === 0) break;
    all.push(...response.results.map(toRecord));
    if (response.results.length < pageSize) break;
  }

  return {
    fetchedAt,
    total,
    records: all,
    classI: all.filter((r) => r.classification === "Class I"),
  };
}

export function parseOpenFdaResponse(raw: unknown): OpenFdaRecallRecord[] {
  const r = raw as OpenFdaResponse;
  if (!r?.results) return [];
  return r.results.map(toRecord);
}
