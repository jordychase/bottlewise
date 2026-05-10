/**
 * JSON-LD engine. Many brand sites embed schema.org Product structured
 * data in <script type="application/ld+json"> tags. This engine parses
 * those without per-site selectors.
 *
 * Coverage: any brand site that ships valid Product schema markup —
 * surprisingly common across both modern and legacy CMS-driven sites.
 */

import { load } from "cheerio";
import { getText } from "../http.js";
import type {
  AdapterResult,
  BrandRegistryEntry,
  JsonLdConfig,
  RawProduct,
} from "../types.js";

interface SchemaProduct {
  "@type": string | string[];
  name?: string;
  description?: string;
  brand?: string | { name?: string };
  sku?: string;
  gtin?: string;
  gtin13?: string;
  url?: string;
  image?: string | string[];
  offers?: unknown;
  additionalProperty?: Array<{ name?: string; value?: string }>;
}

function asProductArray(node: unknown): SchemaProduct[] {
  if (!node) return [];
  const arr = Array.isArray(node) ? node : [node];
  const out: SchemaProduct[] = [];
  for (const n of arr) {
    if (typeof n !== "object" || n === null) continue;
    const obj = n as Record<string, unknown>;
    const t = obj["@type"];
    const types = Array.isArray(t) ? t : [t];
    if (types.some((x) => typeof x === "string" && /Product/i.test(x))) {
      out.push(obj as unknown as SchemaProduct);
    }
    if (obj["@graph"] && Array.isArray(obj["@graph"])) {
      out.push(...asProductArray(obj["@graph"]));
    }
  }
  return out;
}

export function extractProductsFromHtml(html: string): SchemaProduct[] {
  const $ = load(html);
  const products: SchemaProduct[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    if (!text.trim()) return;
    try {
      const parsed = JSON.parse(text);
      products.push(...asProductArray(parsed));
    } catch {
      // Some sites ship malformed JSON-LD; skip silently — adapter
      // telemetry will catch coverage drops.
    }
  });
  return products;
}

async function discoverProductLinks(
  url: string,
  selector: string | undefined,
): Promise<string[]> {
  const html = await getText(url);
  const $ = load(html);
  const sel = selector ?? 'a[href*="/products/"], a[href*="/product/"]';
  const links = new Set<string>();
  $(sel).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = new URL(href, url).toString();
    links.add(abs);
  });
  return Array.from(links);
}

export async function runJsonLdAdapter(
  brand: BrandRegistryEntry,
  config: JsonLdConfig,
): Promise<AdapterResult> {
  const startedAt = new Date().toISOString();
  const errors: AdapterResult["errors"] = [];
  const rawProducts: RawProduct[] = [];

  let productUrls: string[] = [];
  try {
    productUrls = await discoverProductLinks(
      config.productListUrl,
      config.productLinkSelector,
    );
  } catch (err) {
    errors.push({
      brandId: brand.id,
      productUrl: config.productListUrl,
      message: `Product link discovery failed: ${(err as Error).message}`,
    });
  }

  for (const url of productUrls) {
    try {
      const html = await getText(url);
      const products = extractProductsFromHtml(html);
      if (products.length === 0) continue;
      const product = products[0]!;
      rawProducts.push({
        brandId: brand.id,
        externalId: product.sku ?? product.gtin13 ?? product.gtin ?? url,
        productUrl: url,
        rawPayload: product as unknown as Record<string, unknown>,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push({
        brandId: brand.id,
        productUrl: url,
        message: (err as Error).message,
      });
    }
  }

  return {
    brandId: brand.id,
    adapterId: `jsonld:${new URL(config.productListUrl).hostname}`,
    startedAt,
    endedAt: new Date().toISOString(),
    recordsSeen: productUrls.length,
    recordsNormalized: 0,
    errors,
    fieldCoverage: {},
    rawProducts,
    normalized: [],
  };
}
