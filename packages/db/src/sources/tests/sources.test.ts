import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { extractProductsFromHtml } from "../engines/jsonld.js";
import {
  fieldCoverage,
  normalizeShopifyProduct,
} from "../normalize.js";
import { BRAND_REGISTRY, findBrand, listBrands } from "../registry.js";
import type { RawProduct } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ShopifyFixture {
  products: Array<Record<string, unknown>>;
}

function loadShopifyFixture(): ShopifyFixture {
  const raw = readFileSync(
    join(__dirname, "fixtures/shopify-products.json"),
    "utf8",
  );
  return JSON.parse(raw) as ShopifyFixture;
}

describe("normalizeShopifyProduct", () => {
  it("extracts ingredients, package size, and price from a Shopify product", () => {
    const fixture = loadShopifyFixture();
    const formula = fixture.products[0]!;

    const raw: RawProduct = {
      brandId: "bobbie",
      externalId: String(formula.id),
      productUrl: "https://www.hibobbie.com/products/bobbie-organic-infant-formula",
      rawPayload: formula,
      fetchedAt: "2026-05-09T18:00:00.000Z",
    };

    const normalized = normalizeShopifyProduct(raw);
    expect(normalized.productName).toContain("Bobbie Organic Infant Formula");
    expect(normalized.proteinSource).toBe("cow_milk");
    expect(normalized.specialtyDesignations).toContain("organic");
    expect(normalized.stage).toBe("infant_0_12");
    expect(normalized.packageSizesGrams).toContain(400);
    expect(normalized.msrpUsdCents).toBe(2300);
    expect(normalized.ingredients?.length ?? 0).toBeGreaterThan(5);
    const allergenIngredients =
      normalized.ingredients?.filter((i) => i.isPotentialAllergen) ?? [];
    expect(allergenIngredients.length).toBeGreaterThan(0);
  });

  it("infers the toddler stage from product type + tags", () => {
    const fixture = loadShopifyFixture();
    const toddler = fixture.products[2]!;
    const raw: RawProduct = {
      brandId: "bobbie",
      externalId: String(toddler.id),
      productUrl: "https://www.hibobbie.com/products/bobbie-plus-toddler",
      rawPayload: toddler,
      fetchedAt: "2026-05-09T18:00:00.000Z",
    };
    const normalized = normalizeShopifyProduct(raw);
    expect(normalized.stage).toBe("toddler_12_plus");
  });
});

describe("fieldCoverage", () => {
  it("reports the share of records with each field populated", () => {
    const fixture = loadShopifyFixture();
    const records = [fixture.products[0]!, fixture.products[2]!].map((p) =>
      normalizeShopifyProduct({
        brandId: "bobbie",
        externalId: String(p.id),
        productUrl: `https://www.hibobbie.com/products/${p.handle}`,
        rawPayload: p,
        fetchedAt: "2026-05-09T18:00:00.000Z",
      }),
    );
    const cov = fieldCoverage(records);
    expect(cov.stage).toBe(1);
    expect(cov.proteinSource).toBe(1);
    expect(cov.ingredients).toBeGreaterThan(0);
  });
});

describe("extractProductsFromHtml", () => {
  it("pulls a Product schema from a JSON-LD script tag", () => {
    const html = `
      <html><head>
      <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        name: "Test Formula",
        sku: "TEST-001",
        description: "Stage 1 organic infant formula. Ingredients: Organic Milk, Lactose, DHA.",
      })}
      </script>
      </head></html>
    `;
    const products = extractProductsFromHtml(html);
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe("Test Formula");
  });

  it("walks @graph nodes and returns nested Products", () => {
    const html = `
      <html><head>
      <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org/",
        "@graph": [
          { "@type": "Organization", name: "Test Brand" },
          {
            "@type": "Product",
            name: "Graph Product",
            sku: "G-1",
          },
        ],
      })}
      </script>
      </head></html>
    `;
    const products = extractProductsFromHtml(html);
    expect(products).toHaveLength(1);
    expect(products[0]?.name).toBe("Graph Product");
  });
});

describe("BRAND_REGISTRY", () => {
  it("includes brands across every required segment", () => {
    const requiredSegments = [
      "mass_market",
      "private_label",
      "premium_dtc",
      "european_import",
      "specialty_hypoallergenic",
      "specialty_amino_acid",
      "preemie_post_discharge",
      "goat_milk",
      "a2_milk",
      "plant_based",
    ] as const;
    for (const seg of requiredSegments) {
      const brands = listBrands({ segment: seg });
      expect(brands.length, `segment ${seg} has no brands`).toBeGreaterThan(0);
    }
  });

  it("has unique brand ids", () => {
    const ids = BRAND_REGISTRY.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("locates brands by id", () => {
    expect(findBrand("bobbie")?.name).toBe("Bobbie");
    expect(findBrand("kabrita")?.segments).toContain("goat_milk");
    expect(findBrand("nope-not-real")).toBeUndefined();
  });

  it("private-label brands are routed to retailer_api, not DTC scrapers", () => {
    const privateLabel = listBrands({ segment: "private_label" });
    expect(privateLabel.length).toBeGreaterThan(8);
    for (const b of privateLabel) {
      expect(b.config.engine).toBe("retailer_api");
    }
  });
});
