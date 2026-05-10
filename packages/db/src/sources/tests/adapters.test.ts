import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  matchAgainstBrand,
  parseFdaSubmissionsHtml,
} from "../adapters/fda-submissions.js";
import { parseOpenFdaResponse } from "../adapters/openfda-recalls.js";
import { parseAmazonResponse } from "../adapters/amazon-pa-api.js";
import { parseWalmartResponse } from "../adapters/walmart.js";
import { parseRedSkyResponse } from "../adapters/target-redsky.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function fixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", name), "utf8");
}

describe("FDA submissions parser", () => {
  it("extracts manufacturer + product rows from a structured table", () => {
    const html = fixture("fda-submissions.html");
    const records = parseFdaSubmissionsHtml(html);
    expect(records.length).toBe(5);
    expect(records[0]).toMatchObject({
      manufacturer: "Mead Johnson Nutrition",
      productName: "Enfamil NeuroPro Infant Formula",
      submissionType: "New formulation",
      submissionDate: "2023-04-12",
    });
    expect(records.find((r) => r.productName.includes("Kabrita"))).toBeDefined();
  });

  it("matches a brand + product against the submissions list", () => {
    const records = parseFdaSubmissionsHtml(fixture("fda-submissions.html"));
    const match = matchAgainstBrand(records, "Bobbie", "Organic Infant Formula");
    expect(match).toBeDefined();
    expect(match?.manufacturer).toBe("Bobbie Baby Inc.");
  });

  it("returns undefined when a brand has not submitted", () => {
    const records = parseFdaSubmissionsHtml(fixture("fda-submissions.html"));
    expect(matchAgainstBrand(records, "Unsubmitted Brand", "X")).toBeUndefined();
  });
});

describe("openFDA recalls parser", () => {
  it("normalizes recall records and converts YYYYMMDD dates", () => {
    const raw = JSON.parse(fixture("openfda-recalls.json"));
    const records = parseOpenFdaResponse(raw);
    expect(records.length).toBe(2);
    expect(records[0]?.classification).toBe("Class I");
    expect(records[0]?.recall_initiation_date).toBe("2025-01-14");
    expect(records[1]?.termination_date).toBe("2024-12-01");
  });
});

describe("Amazon PA-API parser", () => {
  it("extracts ASIN, title, price, and availability", () => {
    const raw = JSON.parse(fixture("amazon-pa-api.json"));
    const results = parseAmazonResponse(raw);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      asin: "B07ABCDEFG",
      title: "Mama Bear Gentle Infant Formula 23.2 oz",
      brand: "Mama Bear",
      priceCents: 1899,
      currency: "USD",
      availability: "In Stock",
    });
  });
});

describe("Walmart parser", () => {
  it("extracts itemId, brand, UPC, and sale price", () => {
    const raw = JSON.parse(fixture("walmart.json"));
    const results = parseWalmartResponse(raw);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      itemId: "12345678",
      brand: "Parent's Choice",
      upc: "078742000000",
      priceCents: 1697,
      stockStatus: "Available",
    });
  });

  it("falls back to msrp when salePrice missing", () => {
    const synthetic = {
      items: [{ itemId: 1, name: "x", brandName: "Y", msrp: 9.99 }],
    };
    expect(parseWalmartResponse(synthetic)[0]?.priceCents).toBe(999);
  });
});

describe("Target RedSky parser", () => {
  it("extracts tcin, brand, price, and stock", () => {
    const raw = JSON.parse(fixture("target-redsky.json"));
    const results = parseRedSkyResponse(raw);
    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      tcin: "12345678",
      brand: "Up & Up",
      priceCents: 1749,
      inStock: true,
    });
    expect(results[1]?.inStock).toBe(false);
    expect(results[1]?.priceCents).toBe(1899);
  });

  it("survives missing optional fields", () => {
    expect(parseRedSkyResponse({ data: { search: { products: [] } } })).toEqual(
      [],
    );
    expect(parseRedSkyResponse({})).toEqual([]);
  });
});
