import { describe, expect, it } from "vitest";
import {
  buildCanonical,
  pickByPrecedence,
  tierOf,
} from "../merge.js";
import type { NormalizedFormula } from "../types.js";

describe("tierOf", () => {
  it("classifies FDA + openFDA as authoritative", () => {
    expect(tierOf("fda-submissions")).toBe("authoritative");
    expect(tierOf("openfda-recalls")).toBe("authoritative");
  });
  it("classifies brand DTC engines correctly", () => {
    expect(tierOf("shopify:hibobbie.com")).toBe("brand_dtc");
    expect(tierOf("jsonld:byheart.com")).toBe("brand_dtc");
    expect(tierOf("html:enfamil.com")).toBe("brand_dtc");
  });
  it("classifies retailer adapters", () => {
    expect(tierOf("retailer:amazon")).toBe("retailer");
    expect(tierOf("amazon-pa-api")).toBe("retailer");
    expect(tierOf("walmart")).toBe("retailer");
    expect(tierOf("target-redsky")).toBe("retailer");
  });
  it("classifies community sources", () => {
    expect(tierOf("off:bulk")).toBe("community");
    expect(tierOf("openfoodfacts")).toBe("community");
    expect(tierOf("usda:fdc")).toBe("community");
  });
  it("falls back to manual", () => {
    expect(tierOf("manual")).toBe("manual");
    expect(tierOf("unknown")).toBe("manual");
  });
});

describe("pickByPrecedence — default tier ranking", () => {
  it("brand_dtc beats retailer when no field rules apply", () => {
    const result = pickByPrecedence(
      [
        { adapterId: "retailer:amazon", observedAt: "2026-05-01", value: "A" },
        { adapterId: "shopify:bobbie.com", observedAt: "2026-04-01", value: "B" },
      ],
      "productName",
    );
    expect(result.value).toBe("B");
    expect(result.source).toBe("shopify:bobbie.com");
  });
  it("breaks ties by most-recent observation", () => {
    const result = pickByPrecedence(
      [
        { adapterId: "shopify:a.com", observedAt: "2026-04-01", value: "older" },
        { adapterId: "shopify:b.com", observedAt: "2026-05-01", value: "newer" },
      ],
      "productName",
    );
    expect(result.value).toBe("newer");
  });
});

describe("pickByPrecedence — per-field rules", () => {
  it("ingredients: brand_dtc beats community", () => {
    const result = pickByPrecedence(
      [
        { adapterId: "off:bulk", observedAt: "2026-05-01", value: ["off-list"] },
        { adapterId: "shopify:bobbie.com", observedAt: "2026-04-01", value: ["dtc-list"] },
      ],
      "ingredients",
    );
    expect(result.value).toEqual(["dtc-list"]);
    expect(result.source).toBe("shopify:bobbie.com");
  });
  it("ingredients: community fills when DTC absent", () => {
    const result = pickByPrecedence(
      [{ adapterId: "off:bulk", observedAt: "2026-05-01", value: ["off-list"] }],
      "ingredients",
    );
    expect(result.value).toEqual(["off-list"]);
  });
  it("pediatricIndications: retailer is rejected entirely", () => {
    const result = pickByPrecedence(
      [
        {
          adapterId: "retailer:amazon",
          observedAt: "2026-05-01",
          value: ["sensitive"],
        },
      ],
      "pediatricIndications",
    );
    // retailer not in the allowlist for indications — must be filtered out
    expect(result.value).toBeUndefined();
  });
  it("pediatricIndications: brand_dtc is accepted", () => {
    const result = pickByPrecedence(
      [
        {
          adapterId: "shopify:bobbie.com",
          observedAt: "2026-05-01",
          value: ["sensitive"],
        },
      ],
      "pediatricIndications",
    );
    expect(result.value).toEqual(["sensitive"]);
  });
  it("msrpUsdCents: retailer beats brand_dtc", () => {
    const result = pickByPrecedence(
      [
        { adapterId: "shopify:bobbie.com", observedAt: "2026-05-01", value: 2600 },
        { adapterId: "amazon-pa-api", observedAt: "2026-04-01", value: 2300 },
      ],
      "msrpUsdCents",
    );
    expect(result.value).toBe(2300);
    expect(result.source).toBe("amazon-pa-api");
  });
});

describe("pickByPrecedence — conflicts", () => {
  it("reports losing values as conflicts", () => {
    const result = pickByPrecedence(
      [
        {
          adapterId: "shopify:bobbie.com",
          observedAt: "2026-05-01",
          value: ["dtc"],
        },
        { adapterId: "off:bulk", observedAt: "2026-04-01", value: ["off"] },
      ],
      "ingredients",
    );
    expect(result.conflicts).toEqual([
      { source: "off:bulk", value: ["off"] },
    ]);
  });
  it("does not log conflicts when values agree", () => {
    const result = pickByPrecedence(
      [
        { adapterId: "shopify:a.com", observedAt: "2026-05-01", value: ["x"] },
        { adapterId: "off:bulk", observedAt: "2026-04-01", value: ["x"] },
      ],
      "ingredients",
    );
    expect(result.conflicts).toEqual([]);
  });
});

describe("buildCanonical", () => {
  const dtcRecord: NormalizedFormula = {
    brandId: "bobbie",
    externalId: "BOB-1",
    productUrl: "https://www.hibobbie.com/products/bobbie-organic-infant-formula",
    productName: "Bobbie Organic Infant Formula",
    stage: "infant_0_12",
    proteinSource: "cow_milk",
    proteinForm: "intact",
    ingredients: [
      { name: "Organic Reduced Minerals Whey", displayOrder: 0 },
      { name: "Organic Lactose", displayOrder: 1 },
    ],
    specialtyDesignations: ["organic"],
    pediatricIndications: [],
    packageSizesGrams: [400],
    msrpUsdCents: 2600,
    fetchedAt: "2026-05-01T00:00:00.000Z",
    sourceProvenance: "shopify:hibobbie.com",
  };

  const retailerRecord: NormalizedFormula = {
    ...dtcRecord,
    productName: "Bobbie Organic Infant Formula 14.1 oz",
    msrpUsdCents: 2400,
    ingredients: undefined,
    pediatricIndications: ["sensitive"], // should be ignored — retailer not allowed
    fetchedAt: "2026-05-02T00:00:00.000Z",
    sourceProvenance: "amazon-pa-api",
  };

  it("merges DTC + retailer with correct field-level winners", () => {
    const result = buildCanonical({
      brandRegistryId: "bobbie",
      externalId: "BOB-1",
      records: [
        {
          adapterId: "shopify:www.hibobbie.com",
          observedAt: "2026-05-01T00:00:00.000Z",
          payload: dtcRecord,
        },
        {
          adapterId: "amazon-pa-api",
          observedAt: "2026-05-02T00:00:00.000Z",
          payload: retailerRecord,
        },
      ],
    });
    expect(result.canonical.proteinSource).toBe("cow_milk");
    expect(result.canonical.ingredients).toHaveLength(2);
    expect(result.canonical.msrpUsdCents).toBe(2400); // retailer wins on price
    expect(result.canonical.pediatricIndications).toEqual([]); // retailer ignored
    expect(result.provenance.msrpUsdCents?.source).toBe("amazon-pa-api");
    expect(result.provenance.ingredients?.source).toBe("shopify:www.hibobbie.com");
  });

  it("logs conflicts when sources disagree on a winnable field", () => {
    const result = buildCanonical({
      brandRegistryId: "bobbie",
      externalId: "BOB-1",
      records: [
        {
          adapterId: "shopify:www.hibobbie.com",
          observedAt: "2026-05-01T00:00:00.000Z",
          payload: dtcRecord,
        },
        {
          adapterId: "amazon-pa-api",
          observedAt: "2026-05-02T00:00:00.000Z",
          payload: retailerRecord,
        },
      ],
    });
    const priceConflict = result.conflicts.find((c) => c.field === "msrpUsdCents");
    expect(priceConflict).toBeDefined();
    expect(priceConflict?.winningSource).toBe("amazon-pa-api");
    expect(priceConflict?.losingSource).toBe("shopify:www.hibobbie.com");
  });

  it("throws on empty records", () => {
    expect(() =>
      buildCanonical({
        brandRegistryId: "bobbie",
        externalId: "BOB-1",
        records: [],
      }),
    ).toThrow();
  });
});
