/**
 * FDA Infant Formula Submissions adapter.
 *
 * The FDA publishes the list of infant formulas that have been submitted
 * under section 412 of the FD&C Act. This list is the authoritative
 * source for `formulas.fda_status='registered'` — the gate that
 * determines which formulas are allowed to surface to users.
 *
 * Source page (HTML, no API):
 *   https://www.fda.gov/food/infant-formula-guidance-documents-regulatory-information/submission-infant-formulas-fda
 *
 * The page format is a structured table of submissions per manufacturer,
 * grouped by submission type. The parser is structural (table + heading
 * walks) so HTML cosmetic changes don't break it — but FDA does
 * occasionally re-template these pages, so a CI canary against this
 * page is recommended.
 */

import { load } from "cheerio";
import { getText } from "../http.js";

export const FDA_SUBMISSIONS_URL =
  "https://www.fda.gov/food/infant-formula-guidance-documents-regulatory-information/submission-infant-formulas-fda";

export interface FdaSubmissionRecord {
  manufacturer: string;
  productName: string;
  submissionType?: string;
  submissionDate?: string;
  notes?: string;
}

export interface FdaSubmissionsRunResult {
  fetchedAt: string;
  sourceUrl: string;
  records: FdaSubmissionRecord[];
  manufacturerCount: number;
}

/**
 * Parses the FDA submissions page HTML into structured records.
 * Tolerant of multiple table shapes the page has shipped over the
 * years: (1) flat table with manufacturer + product columns,
 * (2) nested headings per manufacturer with bulleted product lists.
 */
export function parseFdaSubmissionsHtml(html: string): FdaSubmissionRecord[] {
  const $ = load(html);
  const records: FdaSubmissionRecord[] = [];

  // Strategy A: structured tables. Each <table> with a header row that
  // contains "Manufacturer" / "Firm" / "Product".
  $("table").each((_, table) => {
    const $t = $(table);
    const headerRow = $t.find("tr").first();
    const headers = headerRow
      .find("th, td")
      .map((_i, c) => $(c).text().trim().toLowerCase())
      .get();
    if (headers.length === 0) return;

    const idxMfr = headers.findIndex((h) =>
      /manufacturer|firm|company/.test(h),
    );
    const idxProduct = headers.findIndex((h) => /product|brand|name/.test(h));
    const idxType = headers.findIndex((h) => /type|category/.test(h));
    const idxDate = headers.findIndex((h) => /date|submitted/.test(h));

    if (idxMfr < 0 || idxProduct < 0) return;

    $t.find("tr").slice(1).each((_i, row) => {
      const cells = $(row)
        .find("td")
        .map((_j, c) => $(c).text().trim())
        .get();
      const mfr = cells[idxMfr];
      const product = cells[idxProduct];
      if (!mfr || !product) return;
      records.push({
        manufacturer: mfr,
        productName: product,
        submissionType: idxType >= 0 ? cells[idxType] : undefined,
        submissionDate: idxDate >= 0 ? cells[idxDate] : undefined,
      });
    });
  });

  // Strategy B (fallback): heading-per-manufacturer with <ul> of products.
  if (records.length === 0) {
    $("h2, h3, h4").each((_, heading) => {
      const $h = $(heading);
      const mfr = $h.text().trim();
      if (!mfr || mfr.length < 3) return;
      $h.nextUntil("h2, h3, h4")
        .find("li")
        .each((_i, li) => {
          const product = $(li).text().trim();
          if (!product) return;
          records.push({ manufacturer: mfr, productName: product });
        });
    });
  }

  return records;
}

export async function fetchFdaSubmissions(): Promise<FdaSubmissionsRunResult> {
  const fetchedAt = new Date().toISOString();
  const html = await getText(FDA_SUBMISSIONS_URL);
  const records = parseFdaSubmissionsHtml(html);
  const manufacturers = new Set(records.map((r) => r.manufacturer.trim()));
  return {
    fetchedAt,
    sourceUrl: FDA_SUBMISSIONS_URL,
    records,
    manufacturerCount: manufacturers.size,
  };
}

/**
 * Match an FDA submissions record against a brand from the registry.
 * Used by the merge layer to set `formulas.fda_status='registered'` on
 * formulas whose brand + product name appear in the FDA list.
 */
export function matchAgainstBrand(
  records: FdaSubmissionRecord[],
  brandName: string,
  productName: string,
): FdaSubmissionRecord | undefined {
  const bn = brandName.toLowerCase();
  const pn = productName.toLowerCase();
  return records.find((r) => {
    const m = r.manufacturer.toLowerCase();
    const p = r.productName.toLowerCase();
    return (
      (m.includes(bn) || bn.includes(m) || p.includes(bn)) &&
      (p.includes(pn) || pn.includes(p))
    );
  });
}
