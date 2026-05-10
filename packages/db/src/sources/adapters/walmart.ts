/**
 * Walmart Affiliate API adapter.
 *
 * Walmart deprecated their general Open Catalog API. The remaining
 * supported public surface for non-sellers is the Affiliate API, which
 * exposes search + price + stock for catalog items. Affiliate program
 * approval is required before this adapter returns real data.
 *
 * Auth: signed requests with `WM_CONSUMER.ID`, `WM_CONSUMER.INTIMESTAMP`,
 * and a `WM_SEC.AUTH_SIGNATURE` (RSA-SHA256 over a canonical string)
 * using the affiliate's private key.
 *
 * Required env vars:
 *   WALMART_CONSUMER_ID
 *   WALMART_PRIVATE_KEY        (PEM-encoded RSA private key)
 *   WALMART_PRIVATE_KEY_VERSION (default "1")
 *
 * Docs: https://developer.walmart.com/api/us/affiliate/search
 */

import { createSign } from "node:crypto";
import { USER_AGENT } from "../http.js";

const SEARCH_ENDPOINT =
  "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search";

export interface WalmartCredentials {
  consumerId: string;
  privateKey: string;
  keyVersion: string;
}

export interface WalmartSearchResult {
  itemId: string;
  name?: string;
  brand?: string;
  upc?: string;
  productUrl?: string;
  priceCents?: number;
  stockStatus?: string;
  fetchedAt: string;
}

interface WalmartSearchResponse {
  items?: Array<{
    itemId: number | string;
    name?: string;
    brandName?: string;
    upc?: string;
    productUrl?: string;
    salePrice?: number;
    msrp?: number;
    stock?: string;
    availableOnline?: boolean;
  }>;
  totalResults?: number;
  query?: string;
}

function readCredentials(): WalmartCredentials | null {
  const consumerId = process.env.WALMART_CONSUMER_ID;
  const privateKey = process.env.WALMART_PRIVATE_KEY;
  const keyVersion = process.env.WALMART_PRIVATE_KEY_VERSION ?? "1";
  if (!consumerId || !privateKey) return null;
  return { consumerId, privateKey, keyVersion };
}

function signRequest(creds: WalmartCredentials): {
  signature: string;
  timestamp: string;
} {
  const timestamp = Date.now().toString();
  const canonical = `${creds.consumerId}\n${timestamp}\n${creds.keyVersion}\n`;
  const signer = createSign("RSA-SHA256");
  signer.update(canonical);
  const signature = signer.sign(creds.privateKey, "base64");
  return { signature, timestamp };
}

export async function searchWalmart(opts: {
  searchTerm: string;
  numItems?: number;
  credentials?: WalmartCredentials;
}): Promise<WalmartSearchResult[]> {
  const creds = opts.credentials ?? readCredentials();
  if (!creds) {
    throw new Error(
      "WALMART_CONSUMER_ID and WALMART_PRIVATE_KEY must be set in env",
    );
  }

  const { signature, timestamp } = signRequest(creds);
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("query", opts.searchTerm);
  url.searchParams.set("numItems", String(opts.numItems ?? 25));
  url.searchParams.set("categoryId", "5427"); // Baby > Feeding > Baby Formula

  const res = await fetch(url.toString(), {
    headers: {
      "WM_CONSUMER.ID": creds.consumerId,
      "WM_CONSUMER.INTIMESTAMP": timestamp,
      "WM_SEC.KEY_VERSION": creds.keyVersion,
      "WM_SEC.AUTH_SIGNATURE": signature,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walmart Affiliate API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as WalmartSearchResponse;
  return parseWalmartResponse(data);
}

export function parseWalmartResponse(
  data: WalmartSearchResponse,
): WalmartSearchResult[] {
  const fetchedAt = new Date().toISOString();
  return (data.items ?? []).map((it) => {
    const price = it.salePrice ?? it.msrp;
    return {
      itemId: String(it.itemId),
      name: it.name,
      brand: it.brandName,
      upc: it.upc,
      productUrl: it.productUrl,
      priceCents:
        typeof price === "number" ? Math.round(price * 100) : undefined,
      stockStatus: it.stock ?? (it.availableOnline ? "Available" : undefined),
      fetchedAt,
    };
  });
}

export function hasWalmartCredentials(): boolean {
  return readCredentials() !== null;
}
