/**
 * Target RedSky adapter.
 *
 * Target's public site is backed by the redsky.target.com aggregation
 * service. The product listing endpoint accepts a category-id +
 * keyword query and returns price + availability.
 *
 * No formal credentials required, but Target rotates a public visitor
 * key periodically. We accept it via env (TARGET_REDSKY_VISITOR_KEY) so
 * an operator can update without a code change. Falls back to a
 * publicly-known key value at request time.
 *
 * Endpoint:
 *   GET https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2
 *
 * This adapter is best-effort — RedSky is a private API and Target may
 * change its shape without notice. The shape parsing is intentionally
 * defensive.
 */

import { politeFetch, USER_AGENT } from "../http.js";

const ENDPOINT =
  "https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v2";
const FORMULA_CATEGORY_ID = "5xt9q"; // Baby > Feeding > Formula

export interface TargetSearchResult {
  tcin: string;
  title?: string;
  brand?: string;
  productUrl?: string;
  priceCents?: number;
  inStock?: boolean;
  fetchedAt: string;
}

interface RedSkyResponse {
  data?: {
    search?: {
      products?: Array<{
        tcin: string;
        item?: {
          product_brand?: { brand?: string };
          product_description?: { title?: string };
          enrichment?: { buy_url?: string };
        };
        price?: {
          current_retail?: number;
          reg_retail?: number;
        };
        fulfillment?: {
          is_out_of_stock_in_all_store_locations?: boolean;
          shipping_options?: { availability_status?: string };
        };
      }>;
    };
  };
}

export interface TargetSearchOptions {
  searchTerm: string;
  count?: number;
  visitorKey?: string;
}

export async function searchTarget(
  opts: TargetSearchOptions,
): Promise<TargetSearchResult[]> {
  const visitorKey =
    opts.visitorKey ??
    process.env.TARGET_REDSKY_VISITOR_KEY ??
    "9f36aeafbe60771e321a7cc95a78140772ab3e96";

  const url = new URL(ENDPOINT);
  url.searchParams.set("key", visitorKey);
  url.searchParams.set("category", FORMULA_CATEGORY_ID);
  url.searchParams.set("keyword", opts.searchTerm);
  url.searchParams.set("count", String(opts.count ?? 24));
  url.searchParams.set("offset", "0");
  url.searchParams.set("page", "/c/baby-formula");
  url.searchParams.set("platform", "desktop");
  url.searchParams.set("pricing_store_id", "3991");
  url.searchParams.set("visitor_id", "BOTTLEWISE_BOT");
  url.searchParams.set("channel", "WEB");

  const res = await politeFetch(url.toString(), {
    rateLimitMs: 2000,
    failFastOn4xx: false,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Target RedSky ${res.status}: ${text.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as RedSkyResponse;
  return parseRedSkyResponse(data);
}

export function parseRedSkyResponse(
  data: RedSkyResponse,
): TargetSearchResult[] {
  const fetchedAt = new Date().toISOString();
  const products = data?.data?.search?.products ?? [];
  return products.map((p) => {
    const price = p.price?.current_retail ?? p.price?.reg_retail;
    const oos = p.fulfillment?.is_out_of_stock_in_all_store_locations;
    return {
      tcin: p.tcin,
      title: p.item?.product_description?.title,
      brand: p.item?.product_brand?.brand,
      productUrl: p.item?.enrichment?.buy_url,
      priceCents:
        typeof price === "number" ? Math.round(price * 100) : undefined,
      inStock: oos === undefined ? undefined : !oos,
      fetchedAt,
    };
  });
}

export function targetUserAgent(): string {
  return USER_AGENT;
}
