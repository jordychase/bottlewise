/**
 * Validation probes — light-touch checks that confirm a registry entry's
 * engine + config are pointed at the right thing. Runs one to three
 * requests per brand (not a full catalog scrape) so an operator can
 * sweep the whole registry quickly and flip `validated: true` on the
 * entries that pass.
 *
 * Each probe returns a `ValidationReport` with pass/fail + a hint
 * field that suggests what to fix on a near-miss (e.g., "this domain
 * has /products.json — switch engine from 'html' to 'shopify'").
 */

import { load } from "cheerio";
import { politeFetch } from "./http.js";
import {
  hasAmazonCredentials,
  searchAmazon,
} from "./adapters/amazon-pa-api.js";
import {
  hasWalmartCredentials,
  searchWalmart,
} from "./adapters/walmart.js";
import { searchTarget } from "./adapters/target-redsky.js";
import type { BrandRegistryEntry } from "./types.js";

export type ValidationStatus = "pass" | "fail" | "skipped";

export interface ValidationReport {
  brandId: string;
  brandName: string;
  engine: string;
  status: ValidationStatus;
  message: string;
  hint?: string;
  evidence?: Record<string, unknown>;
}

async function probeShopify(brand: BrandRegistryEntry): Promise<ValidationReport> {
  if (brand.config.engine !== "shopify")
    throw new Error("internal: probeShopify on non-shopify entry");
  const url = `https://${brand.config.domain}/products.json?limit=1`;
  try {
    const res = await politeFetch(url, { failFastOn4xx: false });
    if (!res.ok) {
      return {
        brandId: brand.id,
        brandName: brand.name,
        engine: "shopify",
        status: "fail",
        message: `${url} returned ${res.status}`,
        hint:
          res.status === 404
            ? "products.json not present — site may not be Shopify; try engine 'jsonld' or 'html'"
            : undefined,
      };
    }
    const data = (await res.json()) as { products?: unknown[] };
    const count = data?.products?.length ?? 0;
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "shopify",
      status: count > 0 ? "pass" : "fail",
      message:
        count > 0
          ? `products.json returned ${count} sample product(s)`
          : "products.json reachable but empty — check domain or storefront password",
      evidence: { sampleCount: count },
    };
  } catch (err) {
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "shopify",
      status: "fail",
      message: (err as Error).message,
    };
  }
}

async function probeJsonLd(brand: BrandRegistryEntry): Promise<ValidationReport> {
  if (brand.config.engine !== "jsonld") throw new Error("internal");
  const url = brand.config.productListUrl;
  try {
    const res = await politeFetch(url, { failFastOn4xx: false });
    if (!res.ok) {
      return {
        brandId: brand.id,
        brandName: brand.name,
        engine: "jsonld",
        status: "fail",
        message: `${url} returned ${res.status}`,
        hint:
          res.status === 404
            ? "URL 404 — listing path likely changed; update productListUrl"
            : undefined,
      };
    }
    const html = await res.text();
    const $ = load(html);
    const scripts = $('script[type="application/ld+json"]');
    const productScripts = scripts
      .map((_, el) => $(el).contents().text())
      .get()
      .filter((t) => /\"@type\"\s*:\s*\"Product\"/.test(t));
    const status: ValidationStatus = productScripts.length > 0 ? "pass" : "fail";
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "jsonld",
      status,
      message:
        status === "pass"
          ? `${productScripts.length} Product JSON-LD block(s) on listing page`
          : `${scripts.length} JSON-LD block(s) found, none with @type Product`,
      hint:
        status === "fail" && scripts.length === 0
          ? "no JSON-LD at all — try engine 'html' with selectors"
          : undefined,
      evidence: { totalScripts: scripts.length, productScripts: productScripts.length },
    };
  } catch (err) {
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "jsonld",
      status: "fail",
      message: (err as Error).message,
    };
  }
}

async function probeHtml(brand: BrandRegistryEntry): Promise<ValidationReport> {
  if (brand.config.engine !== "html") throw new Error("internal");
  const cfg = brand.config;
  try {
    const res = await politeFetch(cfg.productListUrl, { failFastOn4xx: false });
    if (!res.ok) {
      return {
        brandId: brand.id,
        brandName: brand.name,
        engine: "html",
        status: "fail",
        message: `${cfg.productListUrl} returned ${res.status}`,
      };
    }
    const html = await res.text();
    const $ = load(html);
    const matches = $(cfg.productLinkSelector).length;
    const hasJsonLdProduct = $('script[type="application/ld+json"]')
      .toArray()
      .some((el) => /\"@type\"\s*:\s*\"Product\"/.test($(el).contents().text()));
    const status: ValidationStatus = matches > 0 ? "pass" : "fail";
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "html",
      status,
      message:
        status === "pass"
          ? `selector matched ${matches} product link(s)`
          : `selector '${cfg.productLinkSelector}' matched 0 elements`,
      hint: hasJsonLdProduct
        ? "the page has Product JSON-LD — consider switching engine to 'jsonld'"
        : status === "fail"
          ? "selector probably wrong; inspect the listing page and update registry"
          : undefined,
      evidence: { matches, hasJsonLdProduct },
    };
  } catch (err) {
    return {
      brandId: brand.id,
      brandName: brand.name,
      engine: "html",
      status: "fail",
      message: (err as Error).message,
    };
  }
}

async function probeRetailerApi(
  brand: BrandRegistryEntry,
): Promise<ValidationReport> {
  if (brand.config.engine !== "retailer_api") throw new Error("internal");
  const cfg = brand.config;
  const reachableRetailers: string[] = [];
  const messages: string[] = [];
  for (const retailer of cfg.retailers) {
    if (retailer === "amazon") {
      if (!hasAmazonCredentials()) {
        messages.push("amazon: no credentials (skipped)");
        continue;
      }
      try {
        const r = await searchAmazon({
          searchTerm: cfg.searchTerm,
          brandFilter: brand.name,
          itemCount: 1,
        });
        if (r.length > 0) reachableRetailers.push("amazon");
        messages.push(`amazon: ${r.length} result(s)`);
      } catch (err) {
        messages.push(`amazon: ${(err as Error).message.slice(0, 80)}`);
      }
    } else if (retailer === "walmart") {
      if (!hasWalmartCredentials()) {
        messages.push("walmart: no credentials (skipped)");
        continue;
      }
      try {
        const r = await searchWalmart({ searchTerm: cfg.searchTerm, numItems: 1 });
        if (r.length > 0) reachableRetailers.push("walmart");
        messages.push(`walmart: ${r.length} result(s)`);
      } catch (err) {
        messages.push(`walmart: ${(err as Error).message.slice(0, 80)}`);
      }
    } else if (retailer === "target") {
      try {
        const r = await searchTarget({ searchTerm: cfg.searchTerm, count: 1 });
        if (r.length > 0) reachableRetailers.push("target");
        messages.push(`target: ${r.length} result(s)`);
      } catch (err) {
        messages.push(`target: ${(err as Error).message.slice(0, 80)}`);
      }
    }
  }
  return {
    brandId: brand.id,
    brandName: brand.name,
    engine: "retailer_api",
    status: reachableRetailers.length > 0 ? "pass" : "skipped",
    message: messages.join(" | "),
    evidence: { reachable: reachableRetailers },
  };
}

export async function validateBrand(
  brand: BrandRegistryEntry,
): Promise<ValidationReport> {
  switch (brand.config.engine) {
    case "shopify":
      return probeShopify(brand);
    case "jsonld":
      return probeJsonLd(brand);
    case "html":
      return probeHtml(brand);
    case "retailer_api":
      return probeRetailerApi(brand);
    default:
      return {
        brandId: brand.id,
        brandName: brand.name,
        engine: brand.config.engine,
        status: "skipped",
        message: `engine ${brand.config.engine} has no probe`,
      };
  }
}
