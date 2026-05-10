/**
 * Amazon Product Advertising API 5.0 adapter.
 *
 * Used to surface price + stock for any brand whose products are sold
 * on Amazon. Critical for private-label brands (Mama Bear) and as a
 * cross-reference price point for premium DTC and European-import
 * brands sold via Amazon.
 *
 * Auth: AWS-style SigV4 against ProductAdvertisingAPI v1. Three secrets
 * required at runtime:
 *   AMAZON_PA_ACCESS_KEY
 *   AMAZON_PA_SECRET_KEY
 *   AMAZON_PA_ASSOCIATE_TAG
 *
 * Region defaults to us-east-1 (Marketplace: www.amazon.com).
 *
 * Docs: https://webservices.amazon.com/paapi5/documentation/
 */

import { createHash, createHmac } from "node:crypto";
import { USER_AGENT } from "../http.js";

const HOST = "webservices.amazon.com";
const REGION = "us-east-1";
const SERVICE = "ProductAdvertisingAPI";
const TARGET_SEARCH = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
const PATH = "/paapi5/searchitems";

export interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  associateTag: string;
  marketplace?: string;
}

export interface AmazonSearchResult {
  asin: string;
  title?: string;
  detailPageUrl?: string;
  priceCents?: number;
  currency?: string;
  availability?: string;
  brand?: string;
  fetchedAt: string;
}

interface AmazonSearchResponse {
  SearchResult?: {
    Items?: Array<{
      ASIN: string;
      DetailPageURL?: string;
      ItemInfo?: {
        Title?: { DisplayValue?: string };
        ByLineInfo?: { Brand?: { DisplayValue?: string } };
      };
      Offers?: {
        Listings?: Array<{
          Price?: { Amount?: number; Currency?: string };
          Availability?: { Message?: string };
        }>;
      };
    }>;
  };
  Errors?: Array<{ Code?: string; Message?: string }>;
}

function readCredentials(): AmazonCredentials | null {
  const accessKey = process.env.AMAZON_PA_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PA_SECRET_KEY;
  const associateTag = process.env.AMAZON_PA_ASSOCIATE_TAG;
  if (!accessKey || !secretKey || !associateTag) return null;
  return {
    accessKey,
    secretKey,
    associateTag,
    marketplace: process.env.AMAZON_PA_MARKETPLACE ?? "www.amazon.com",
  };
}

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function signingKey(secret: string, dateStamp: string): Buffer {
  const kDate = hmacSha256(`AWS4${secret}`, dateStamp);
  const kRegion = hmacSha256(kDate, REGION);
  const kService = hmacSha256(kRegion, SERVICE);
  return hmacSha256(kService, "aws4_request");
}

/**
 * SigV4 signs and POSTs a SearchItems request. Returns parsed offers
 * for products matching the search term + brand filter.
 */
export async function searchAmazon(opts: {
  searchTerm: string;
  brandFilter?: string;
  itemCount?: number;
  credentials?: AmazonCredentials;
}): Promise<AmazonSearchResult[]> {
  const creds = opts.credentials ?? readCredentials();
  if (!creds) {
    throw new Error(
      "AMAZON_PA_ACCESS_KEY / AMAZON_PA_SECRET_KEY / AMAZON_PA_ASSOCIATE_TAG must be set in env",
    );
  }

  const body = JSON.stringify({
    Keywords: opts.searchTerm,
    Brand: opts.brandFilter,
    SearchIndex: "Baby",
    ItemCount: opts.itemCount ?? 10,
    PartnerTag: creds.associateTag,
    PartnerType: "Associates",
    Marketplace: creds.marketplace ?? "www.amazon.com",
    Resources: [
      "ItemInfo.Title",
      "ItemInfo.ByLineInfo",
      "Offers.Listings.Price",
      "Offers.Listings.Availability.Message",
    ],
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const canonicalHeaders = [
    `content-encoding:amz-1.0`,
    `content-type:application/json; charset=utf-8`,
    `host:${HOST}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:${TARGET_SEARCH}`,
    "",
  ].join("\n");
  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest = [
    "POST",
    PATH,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const sig = hmacSha256(signingKey(creds.secretKey, dateStamp), stringToSign)
    .toString("hex");
  const auth =
    `AWS4-HMAC-SHA256 Credential=${creds.accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${sig}`;

  const res = await fetch(`https://${HOST}${PATH}`, {
    method: "POST",
    headers: {
      "Content-Encoding": "amz-1.0",
      "Content-Type": "application/json; charset=utf-8",
      Host: HOST,
      "X-Amz-Date": amzDate,
      "X-Amz-Target": TARGET_SEARCH,
      Authorization: auth,
      "User-Agent": USER_AGENT,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon PA-API ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as AmazonSearchResponse;
  return parseAmazonResponse(data);
}

export function parseAmazonResponse(
  data: AmazonSearchResponse,
): AmazonSearchResult[] {
  const fetchedAt = new Date().toISOString();
  const items = data.SearchResult?.Items ?? [];
  return items.map((it) => {
    const listing = it.Offers?.Listings?.[0];
    const priceAmt = listing?.Price?.Amount;
    return {
      asin: it.ASIN,
      title: it.ItemInfo?.Title?.DisplayValue,
      detailPageUrl: it.DetailPageURL,
      priceCents:
        typeof priceAmt === "number" ? Math.round(priceAmt * 100) : undefined,
      currency: listing?.Price?.Currency,
      availability: listing?.Availability?.Message,
      brand: it.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
      fetchedAt,
    };
  });
}

export function hasAmazonCredentials(): boolean {
  return readCredentials() !== null;
}
