/**
 * Adapter runner. Dispatches each brand to the right engine, collects
 * results, computes field coverage, and (when not in dry-run) writes
 * raw + normalized payloads to `staging/{adapter_id}/{timestamp}.json`.
 *
 * In V1 there is no Supabase wired in yet, so the runner emits to
 * filesystem JSON. Once the merge layer is built, this will be swapped
 * for `source_records` upserts (DATA_SOURCING.md § 3 Adapter pattern).
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { runShopifyAdapter } from "./engines/shopify.js";
import { runJsonLdAdapter } from "./engines/jsonld.js";
import { runHtmlAdapter } from "./engines/html.js";
import {
  hasAmazonCredentials,
  searchAmazon,
} from "./adapters/amazon-pa-api.js";
import {
  hasWalmartCredentials,
  searchWalmart,
} from "./adapters/walmart.js";
import { searchTarget } from "./adapters/target-redsky.js";
import {
  fieldCoverage,
  normalizeHtmlProduct,
  normalizeJsonLdProduct,
  normalizeShopifyProduct,
} from "./normalize.js";
import { BRAND_REGISTRY, findBrand } from "./registry.js";
import type {
  AdapterResult,
  BrandRegistryEntry,
  RawProduct,
  RetailerApiConfig,
  RunOptions,
} from "./types.js";

export async function runAdapter(
  brand: BrandRegistryEntry,
): Promise<AdapterResult> {
  const cfg = brand.config;

  if (cfg.engine === "retailer_api") {
    return runRetailerAdapter(brand, cfg);
  }

  if (cfg.engine === "manual_only") {
    return {
      brandId: brand.id,
      adapterId: "manual",
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      recordsSeen: 0,
      recordsNormalized: 0,
      errors: [
        {
          brandId: brand.id,
          message: `manual_only: ${cfg.reason}`,
          code: "MANUAL_ONLY",
        },
      ],
      fieldCoverage: {},
      rawProducts: [],
      normalized: [],
    };
  }

  if (cfg.engine === "custom") {
    return {
      brandId: brand.id,
      adapterId: `custom:${cfg.adapterId}`,
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      recordsSeen: 0,
      recordsNormalized: 0,
      errors: [
        {
          brandId: brand.id,
          message: `custom adapter '${cfg.adapterId}' not registered`,
          code: "ADAPTER_UNREGISTERED",
        },
      ],
      fieldCoverage: {},
      rawProducts: [],
      normalized: [],
    };
  }

  let result: AdapterResult;
  if (cfg.engine === "shopify") {
    result = await runShopifyAdapter(brand, cfg);
    result.normalized = result.rawProducts.map(normalizeShopifyProduct);
  } else if (cfg.engine === "jsonld") {
    result = await runJsonLdAdapter(brand, cfg);
    result.normalized = result.rawProducts.map(normalizeJsonLdProduct);
  } else {
    result = await runHtmlAdapter(brand, cfg);
    result.normalized = result.rawProducts.map(normalizeHtmlProduct);
  }

  result.recordsNormalized = result.normalized.length;
  result.fieldCoverage = fieldCoverage(result.normalized);
  return result;
}

export async function runAll(opts: RunOptions = {}): Promise<AdapterResult[]> {
  const targets = opts.brandId
    ? [findBrand(opts.brandId)].filter(Boolean) as BrandRegistryEntry[]
    : opts.segment
      ? BRAND_REGISTRY.filter((b) => b.segments.includes(opts.segment!))
      : BRAND_REGISTRY;

  const limit = opts.limit ?? targets.length;
  const slice = targets.slice(0, limit);

  const results: AdapterResult[] = [];
  for (const brand of slice) {
    if (brand.scrapeStatus === "opted_out") {
      results.push({
        brandId: brand.id,
        adapterId: "skipped",
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        recordsSeen: 0,
        recordsNormalized: 0,
        errors: [
          {
            brandId: brand.id,
            message: "brand has opted out of automated scraping",
            code: "OPTED_OUT",
          },
        ],
        fieldCoverage: {},
        rawProducts: [],
        normalized: [],
      });
      continue;
    }

    if (opts.dryRun) {
      results.push({
        brandId: brand.id,
        adapterId: `dry:${brand.config.engine}`,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        recordsSeen: 0,
        recordsNormalized: 0,
        errors: [],
        fieldCoverage: {},
        rawProducts: [],
        normalized: [],
      });
      continue;
    }

    try {
      const r = await runAdapter(brand);
      results.push(r);
      if (opts.outputDir) await persist(r, opts.outputDir);
    } catch (err) {
      results.push({
        brandId: brand.id,
        adapterId: `error:${brand.config.engine}`,
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        recordsSeen: 0,
        recordsNormalized: 0,
        errors: [{ brandId: brand.id, message: (err as Error).message }],
        fieldCoverage: {},
        rawProducts: [],
        normalized: [],
      });
    }
  }
  return results;
}

async function persist(result: AdapterResult, outputDir: string): Promise<void> {
  const ts = result.startedAt.replace(/[:.]/g, "-");
  const path = join(outputDir, result.brandId, `${ts}.json`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(result, null, 2), "utf8");
}

/**
 * Dispatches a `retailer_api` brand entry to one or more Tier D
 * adapters. Each retailer returns price + stock signals only — no
 * composition data — and the result rolls up into a single
 * AdapterResult with raw payloads keyed by retailer.
 */
async function runRetailerAdapter(
  brand: BrandRegistryEntry,
  cfg: RetailerApiConfig,
): Promise<AdapterResult> {
  const startedAt = new Date().toISOString();
  const errors: AdapterResult["errors"] = [];
  const rawProducts: RawProduct[] = [];

  for (const retailer of cfg.retailers) {
    try {
      if (retailer === "amazon") {
        if (!hasAmazonCredentials()) {
          errors.push({
            brandId: brand.id,
            message:
              "amazon: AMAZON_PA_ACCESS_KEY / SECRET_KEY / ASSOCIATE_TAG not set",
            code: "NO_CREDENTIALS",
          });
          continue;
        }
        const results = await searchAmazon({
          searchTerm: cfg.searchTerm,
          brandFilter: brand.name,
        });
        for (const r of results) {
          rawProducts.push({
            brandId: brand.id,
            externalId: `amazon:${r.asin}`,
            productUrl: r.detailPageUrl ?? `https://www.amazon.com/dp/${r.asin}`,
            rawPayload: r as unknown as Record<string, unknown>,
            fetchedAt: r.fetchedAt,
          });
        }
      } else if (retailer === "walmart") {
        if (!hasWalmartCredentials()) {
          errors.push({
            brandId: brand.id,
            message:
              "walmart: WALMART_CONSUMER_ID / WALMART_PRIVATE_KEY not set",
            code: "NO_CREDENTIALS",
          });
          continue;
        }
        const results = await searchWalmart({ searchTerm: cfg.searchTerm });
        for (const r of results) {
          rawProducts.push({
            brandId: brand.id,
            externalId: `walmart:${r.itemId}`,
            productUrl: r.productUrl ?? "",
            rawPayload: r as unknown as Record<string, unknown>,
            fetchedAt: r.fetchedAt,
          });
        }
      } else if (retailer === "target") {
        const results = await searchTarget({ searchTerm: cfg.searchTerm });
        for (const r of results) {
          rawProducts.push({
            brandId: brand.id,
            externalId: `target:${r.tcin}`,
            productUrl: r.productUrl ?? `https://www.target.com/p/-/A-${r.tcin}`,
            rawPayload: r as unknown as Record<string, unknown>,
            fetchedAt: r.fetchedAt,
          });
        }
      }
    } catch (err) {
      errors.push({
        brandId: brand.id,
        message: `${retailer}: ${(err as Error).message}`,
        code: "RETAILER_FAILED",
      });
    }
  }

  return {
    brandId: brand.id,
    adapterId: `retailer:${cfg.retailers.join("+")}`,
    startedAt,
    endedAt: new Date().toISOString(),
    recordsSeen: rawProducts.length,
    recordsNormalized: 0,
    errors,
    fieldCoverage: {},
    rawProducts,
    normalized: [],
  };
}
