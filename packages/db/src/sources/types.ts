export type SourceTier =
  | "authoritative"
  | "community"
  | "brand_dtc"
  | "retailer"
  | "manual";

export type EngineType =
  | "shopify"
  | "jsonld"
  | "html"
  | "retailer_api"
  | "custom"
  | "manual_only";

export type BrandSegment =
  | "mass_market"
  | "private_label"
  | "premium_dtc"
  | "european_import"
  | "specialty_hypoallergenic"
  | "specialty_amino_acid"
  | "specialty_metabolic"
  | "preemie_post_discharge"
  | "goat_milk"
  | "a2_milk"
  | "plant_based"
  | "toddler_followon"
  | "soy"
  | "niche";

export type FdaStatus =
  | "registered"
  | "enforcement_discretion"
  | "gray_market"
  | "unknown";

export type ScrapeStatus = "auto" | "partnership_only" | "opted_out";

export type ProteinSource =
  | "cow_milk"
  | "goat_milk"
  | "soy"
  | "amino_acid"
  | "plant_blend"
  | "other";

export type ProteinForm =
  | "intact"
  | "partially_hydrolyzed"
  | "extensively_hydrolyzed"
  | "amino_acid";

export type FormulaStage =
  | "infant_0_12"
  | "toddler_12_plus"
  | "preemie"
  | "follow_on_eu_2"
  | "follow_on_eu_3";

/**
 * Per-engine config. Discriminated by engine type so the runner dispatches
 * correctly without runtime guessing.
 */
export type ShopifyConfig = {
  engine: "shopify";
  domain: string;
  productPathFilter?: RegExp | string;
};

export type JsonLdConfig = {
  engine: "jsonld";
  productListUrl: string;
  productLinkSelector?: string;
};

export type HtmlConfig = {
  engine: "html";
  productListUrl: string;
  productLinkSelector: string;
  selectors: {
    title: string;
    ingredients?: string;
    nutrition?: string;
    description?: string;
    images?: string;
  };
};

export type RetailerApiConfig = {
  engine: "retailer_api";
  retailers: Array<"amazon" | "walmart" | "target">;
  searchTerm: string;
};

export type ManualOnlyConfig = {
  engine: "manual_only";
  reason: string;
};

export type CustomConfig = {
  engine: "custom";
  adapterId: string;
};

export type EngineConfig =
  | ShopifyConfig
  | JsonLdConfig
  | HtmlConfig
  | RetailerApiConfig
  | ManualOnlyConfig
  | CustomConfig;

export interface BrandRegistryEntry {
  id: string;
  name: string;
  manufacturer: string;
  parentCompany?: string;
  countryOfOrigin: string;
  segments: BrandSegment[];
  website?: string;
  fdaStatusDefault: FdaStatus;
  scrapeStatus: ScrapeStatus;
  config: EngineConfig;
  /** Indicates whether engine + config have been verified against the live
   *  site. New entries default to `false` so an operator runs a manual
   *  smoke test before relying on the data. */
  validated: boolean;
  notes?: string;
}

/**
 * Raw record produced by an engine. Engines do not normalize — the
 * `normalize` layer translates raw → NormalizedFormula. This separation
 * lets us snapshot raw payloads for diff and replay.
 */
export interface RawProduct {
  brandId: string;
  externalId: string;
  productUrl: string;
  rawPayload: Record<string, unknown>;
  fetchedAt: string;
}

/**
 * Normalized formula record — maps onto `formulas` + `formula_ingredients`
 * tables in DATA_MODEL.md. Stored in `source_records.payload` as the
 * adapter's normalized output, then passed to the merge layer.
 */
export interface NormalizedFormula {
  brandId: string;
  externalId: string;
  productUrl: string;
  productName: string;
  stage?: FormulaStage;
  proteinSource?: ProteinSource;
  proteinForm?: ProteinForm;
  carbSources?: string[];
  fatBlend?: {
    palmOil?: boolean;
    dhaMgPer100Kcal?: number;
    araMgPer100Kcal?: number;
    mfgm?: boolean;
  };
  ingredients?: Array<{
    name: string;
    displayOrder: number;
    isPotentialAllergen?: boolean;
  }>;
  specialtyDesignations?: string[];
  pediatricIndications?: string[];
  packageSizesGrams?: number[];
  msrpUsdCents?: number;
  fetchedAt: string;
  sourceProvenance: string;
}

export interface AdapterError {
  brandId: string;
  productUrl?: string;
  message: string;
  code?: string;
  status?: number;
}

export interface AdapterResult {
  brandId: string;
  adapterId: string;
  startedAt: string;
  endedAt: string;
  recordsSeen: number;
  recordsNormalized: number;
  errors: AdapterError[];
  fieldCoverage: Record<string, number>;
  rawProducts: RawProduct[];
  normalized: NormalizedFormula[];
}

export interface RunOptions {
  brandId?: string;
  segment?: BrandSegment;
  dryRun?: boolean;
  limit?: number;
  outputDir?: string;
}
