/**
 * Shopify engine. The single highest-leverage adapter — Shopify exposes
 * a stable `/products.json` endpoint on every storefront, so we get the
 * full catalog without per-site selectors. Coverage: most modern DTC
 * brands (Bobbie, Serenity Kids, Else, Earthly Origins, etc.).
 */

import { getJson } from "../http.js";
import type {
  AdapterResult,
  BrandRegistryEntry,
  RawProduct,
  ShopifyConfig,
} from "../types.js";

interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  variants: ShopifyVariant[];
  images: Array<{ src: string }>;
  options?: Array<{ name: string; values: string[] }>;
}

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  sku?: string;
  grams?: number;
  weight?: number;
  weight_unit?: string;
}

const PAGE_LIMIT = 250;

/**
 * Fetches the full catalog from a Shopify storefront via /products.json,
 * paginating until exhausted or `maxPages` is reached.
 */
export async function fetchShopifyCatalog(
  config: ShopifyConfig,
  maxPages = 10,
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = `https://${config.domain}/products.json?limit=${PAGE_LIMIT}&page=${page}`;
    const data = await getJson<ShopifyProductsResponse>(url);
    if (!data.products || data.products.length === 0) break;
    all.push(...data.products);
    if (data.products.length < PAGE_LIMIT) break;
  }
  return all;
}

const FORMULA_KEYWORDS =
  /\b(formula|infant|baby milk|stage 1|stage 2|stage 3|toddler|hypoallergenic)\b/i;
const NON_FORMULA_KEYWORDS =
  /\b(bottle|nipple|pacifier|bib|swaddle|wipe|cream|lotion|book|gift card|onesie|hat|sock|teether|toy|burp cloth|blanket|breast pump|nursing pad)\b/i;

/**
 * Filters Shopify products to those that look like infant formula. Many
 * formula brands sell adjacent merch (bottles, swaddles) on the same
 * Shopify store; we exclude those by keyword.
 */
function isLikelyFormula(p: ShopifyProduct): boolean {
  const haystack = [
    p.title,
    p.product_type,
    Array.isArray(p.tags) ? p.tags.join(" ") : p.tags ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (NON_FORMULA_KEYWORDS.test(haystack)) return false;
  if (FORMULA_KEYWORDS.test(haystack)) return true;

  if (p.product_type && /\bformula\b/i.test(p.product_type)) return true;
  return false;
}

export async function runShopifyAdapter(
  brand: BrandRegistryEntry,
  config: ShopifyConfig,
): Promise<AdapterResult> {
  const startedAt = new Date().toISOString();
  const errors: AdapterResult["errors"] = [];
  const rawProducts: RawProduct[] = [];

  let allProducts: ShopifyProduct[] = [];
  try {
    allProducts = await fetchShopifyCatalog(config);
  } catch (err) {
    errors.push({
      brandId: brand.id,
      message: `Shopify catalog fetch failed: ${(err as Error).message}`,
    });
  }

  const formulaProducts = allProducts.filter(isLikelyFormula);

  for (const p of formulaProducts) {
    rawProducts.push({
      brandId: brand.id,
      externalId: String(p.id),
      productUrl: `https://${config.domain}/products/${p.handle}`,
      rawPayload: p as unknown as Record<string, unknown>,
      fetchedAt: new Date().toISOString(),
    });
  }

  return {
    brandId: brand.id,
    adapterId: `shopify:${config.domain}`,
    startedAt,
    endedAt: new Date().toISOString(),
    recordsSeen: allProducts.length,
    recordsNormalized: 0,
    errors,
    fieldCoverage: {},
    rawProducts,
    normalized: [],
  };
}
