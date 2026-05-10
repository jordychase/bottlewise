/**
 * Generic HTML engine. Fallback for sites that don't expose Shopify or
 * usable JSON-LD. Driven by per-brand selectors in the registry.
 *
 * Coverage: legacy big-brand corporate sites (Enfamil, Similac, Gerber,
 * regional HiPP variants). Selectors per brand — most fragile of the
 * three engines.
 */

import { load } from "cheerio";
import { getText } from "../http.js";
import type {
  AdapterResult,
  BrandRegistryEntry,
  HtmlConfig,
  RawProduct,
} from "../types.js";

async function discoverProductLinks(config: HtmlConfig): Promise<string[]> {
  const html = await getText(config.productListUrl);
  const $ = load(html);
  const links = new Set<string>();
  $(config.productLinkSelector).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = new URL(href, config.productListUrl).toString();
    links.add(abs);
  });
  return Array.from(links);
}

function selectText($: ReturnType<typeof load>, selector?: string): string | undefined {
  if (!selector) return undefined;
  const text = $(selector).first().text().trim();
  return text === "" ? undefined : text;
}

function selectAllText(
  $: ReturnType<typeof load>,
  selector?: string,
): string[] {
  if (!selector) return [];
  return $(selector)
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
}

export async function runHtmlAdapter(
  brand: BrandRegistryEntry,
  config: HtmlConfig,
): Promise<AdapterResult> {
  const startedAt = new Date().toISOString();
  const errors: AdapterResult["errors"] = [];
  const rawProducts: RawProduct[] = [];

  let productUrls: string[] = [];
  try {
    productUrls = await discoverProductLinks(config);
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
      const $ = load(html);
      const title = selectText($, config.selectors.title);
      if (!title) continue;
      const ingredients = selectText($, config.selectors.ingredients);
      const nutrition = selectText($, config.selectors.nutrition);
      const description = selectText($, config.selectors.description);
      const images = selectAllText($, config.selectors.images);

      rawProducts.push({
        brandId: brand.id,
        externalId: url,
        productUrl: url,
        rawPayload: {
          title,
          ingredients,
          nutrition,
          description,
          images,
        },
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
    adapterId: `html:${new URL(config.productListUrl).hostname}`,
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
