/**
 * Comprehensive brand registry.
 *
 * Every infant formula brand a US family might encounter — across mass
 * market, store-brand / WIC-budget, premium DTC, European imports,
 * hypoallergenic / amino-acid specialty, preemie post-discharge, goat
 * milk, A2, plant-based, and toddler formulas. The product surfaces
 * recommendations across all budgets and family circumstances; the
 * brand registry must reflect that scope.
 *
 * Engine selection per brand:
 *   - shopify       : storefronts with a /products.json endpoint
 *   - jsonld        : sites embedding schema.org Product structured data
 *   - html          : legacy corporate sites needing per-brand selectors
 *   - retailer_api  : store brands with no DTC site (sourced via Amazon
 *                     PA-API, Walmart Open API, Target RedSky)
 *   - manual_only   : NICU / prescription formulas with no public DTC
 *                     surface; loaded via curator CSVs
 *
 * `validated: false` means the engine + config are an informed guess.
 * Run a manual smoke test (`pnpm seed --brand=<id> --dry`) and flip to
 * `true` once the adapter returns a sane catalog. Selectors for HTML
 * engines that I have not verified are left empty and an operator must
 * fill them in during the validation pass.
 *
 * Cross-reference: docs/DATA_SOURCING.md § 2 Tier C, § 8 Schema additions.
 */

import type { BrandRegistryEntry } from "./types.js";

export const BRAND_REGISTRY: BrandRegistryEntry[] = [
  // ---------------------------------------------------------------------
  // MASS-MARKET US INCUMBENTS
  // ---------------------------------------------------------------------
  {
    id: "enfamil",
    name: "Enfamil",
    manufacturer: "Mead Johnson Nutrition",
    parentCompany: "Reckitt",
    countryOfOrigin: "US",
    segments: ["mass_market"],
    website: "https://www.enfamil.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.enfamil.com/products/",
      productLinkSelector: "a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Umbrella brand: NeuroPro, Gentlease, A.R., ProSobee, Enspire, Reguline. Selectors need validation; product pages may also expose JSON-LD.",
  },
  {
    id: "similac",
    name: "Similac",
    manufacturer: "Abbott Nutrition",
    parentCompany: "Abbott",
    countryOfOrigin: "US",
    segments: ["mass_market"],
    website: "https://www.similac.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.similac.com/baby-formula.html",
      productLinkSelector: "a[href*='/baby-formula/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Umbrella brand: Pro-Advance, Sensitive, Total Comfort, 360 Total Care, Soy Isomil, Organic. Hypoallergenic / amino-acid lines tracked separately under alimentum / elecare.",
  },
  {
    id: "gerber-good-start",
    name: "Gerber Good Start",
    manufacturer: "Nestlé Nutrition",
    parentCompany: "Nestlé",
    countryOfOrigin: "US",
    segments: ["mass_market"],
    website: "https://www.gerber.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "partnership_only",
    config: {
      engine: "html",
      productListUrl: "https://www.gerber.com/baby-formula",
      productLinkSelector: "a[href*='/baby-formula/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Lines: GentlePro, Soothe Pro, Soy, Extensive HA, Plus. Validation 2026-05-09: gerber.com returns 403 to bot UAs (anti-bot). Marked partnership_only — data will come via Nestlé partnership feed once engaged.",
  },
  {
    id: "earths-best-organic",
    name: "Earth's Best Organic",
    manufacturer: "Hain Celestial",
    countryOfOrigin: "US",
    segments: ["mass_market", "premium_dtc"],
    website: "https://www.earthsbest.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.earthsbest.com/products/baby-formula",
    },
    validated: false,
    notes: "Lines: Dairy, Sensitivity, Soy, Gentle, Plant-Based.",
  },

  // ---------------------------------------------------------------------
  // PRIVATE LABEL / WIC-BUDGET (no DTC site — retailer-sourced)
  // ---------------------------------------------------------------------
  {
    id: "parents-choice",
    name: "Parent's Choice",
    manufacturer: "Perrigo (Walmart private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.walmart.com/cp/parents-choice/1100899",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["walmart"],
      searchTerm: "parent's choice infant formula",
    },
    validated: false,
    notes:
      "Walmart exclusive. Manufactured by Perrigo. Critical WIC-budget brand. No DTC site.",
  },
  {
    id: "up-and-up",
    name: "Up & Up",
    manufacturer: "Perrigo (Target private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.target.com/c/up-up",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["target"],
      searchTerm: "up & up infant formula",
    },
    validated: false,
    notes: "Target exclusive. Manufactured by Perrigo.",
  },
  {
    id: "comforts",
    name: "Comforts",
    manufacturer: "Perrigo (Kroger private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.kroger.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["walmart", "amazon"],
      searchTerm: "comforts infant formula",
    },
    validated: false,
    notes:
      "Kroger family of stores (Kroger, Fred Meyer, Ralphs, King Soopers). Sourcing via retailer search; Kroger has no public product API.",
  },
  {
    id: "members-mark",
    name: "Member's Mark",
    manufacturer: "Perrigo (Sam's Club private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.samsclub.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["walmart"],
      searchTerm: "member's mark infant formula",
    },
    validated: false,
    notes: "Sam's Club exclusive. Bulk-pack pricing matters for cost transparency.",
  },
  {
    id: "kirkland-signature",
    name: "Kirkland Signature",
    manufacturer: "Perrigo (Costco private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.costco.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "kirkland signature infant formula",
    },
    validated: false,
    notes:
      "Costco exclusive. No Costco product API; cross-referenced via Amazon listings where available.",
  },
  {
    id: "mama-bear",
    name: "Mama Bear",
    manufacturer: "Perrigo (Amazon private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.amazon.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "mama bear infant formula",
    },
    validated: false,
  },
  {
    id: "berkley-jensen",
    name: "Berkley Jensen",
    manufacturer: "Perrigo (BJ's private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.bjs.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "berkley jensen infant formula",
    },
    validated: false,
  },
  {
    id: "tippy-toes",
    name: "Tippy Toes",
    manufacturer: "Perrigo (Aldi private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.aldi.us",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "tippy toes infant formula",
    },
    validated: false,
    notes: "Aldi exclusive. Critical budget brand for cost-conscious families.",
  },
  {
    id: "cvs-health",
    name: "CVS Health",
    manufacturer: "Perrigo (CVS private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.cvs.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "cvs health infant formula",
    },
    validated: false,
  },
  {
    id: "heb-baby",
    name: "HEB Baby",
    manufacturer: "Perrigo (HEB private label)",
    countryOfOrigin: "US",
    segments: ["private_label"],
    website: "https://www.heb.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "retailer_api",
      retailers: ["amazon"],
      searchTerm: "heb baby infant formula",
    },
    validated: false,
    notes: "Texas-region grocery exclusive. Important for TX/SW families.",
  },

  // ---------------------------------------------------------------------
  // PREMIUM US DTC
  // ---------------------------------------------------------------------
  {
    id: "bobbie",
    name: "Bobbie",
    manufacturer: "Bobbie Baby Inc.",
    countryOfOrigin: "US",
    segments: ["premium_dtc"],
    website: "https://www.hibobbie.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "www.hibobbie.com" },
    validated: false,
    notes:
      "EU-recipe-style organic formula, US-manufactured + FDA-registered. Strong partnership candidate per PRD.",
  },
  {
    id: "byheart",
    name: "ByHeart",
    manufacturer: "ByHeart, Inc.",
    countryOfOrigin: "US",
    segments: ["premium_dtc"],
    website: "https://www.byheart.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.byheart.com/products",
      productLinkSelector: "a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Whole milk + lactoferrin. Validation 2026-05-09: site has no JSON-LD; switched from jsonld to html engine. Selectors need a real validation pass. Partnership candidate per PRD.",
  },
  {
    id: "serenity-kids",
    name: "Serenity Kids",
    manufacturer: "Serenity Kids",
    countryOfOrigin: "US",
    segments: ["premium_dtc", "toddler_followon"],
    website: "https://www.myserenitykids.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "www.myserenitykids.com" },
    validated: false,
    notes:
      "Toddler formula primarily. Whole milk + grass-fed dairy + A2 protein.",
  },
  {
    id: "else-nutrition",
    name: "Else Nutrition",
    manufacturer: "Else Nutrition",
    countryOfOrigin: "IL",
    segments: ["premium_dtc", "plant_based", "toddler_followon"],
    website: "https://elsenutrition.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "elsenutrition.com" },
    validated: false,
    notes:
      "Plant-based (almond + buckwheat + tapioca). Toddler-positioned in US; infant version under FDA review historically.",
  },
  {
    id: "earthly-origins",
    name: "Earthly Origins",
    manufacturer: "Earthly Origins",
    countryOfOrigin: "US",
    segments: ["premium_dtc"],
    website: "https://www.earthlyorigins.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.earthlyorigins.com/shop",
      productLinkSelector: "a[href*='/products/'], a[href*='/shop/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Validation 2026-05-09: domain serves HTML, not Shopify products.json. Switched to html engine. Listing URL guessed at /shop; needs validation.",
  },
  {
    id: "happy-baby-organic",
    name: "Happy Baby Organic",
    manufacturer: "Nurture (Happy Family)",
    parentCompany: "Danone",
    countryOfOrigin: "US",
    segments: ["premium_dtc"],
    website: "https://www.happyfamilyorganics.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl:
        "https://www.happyfamilyorganics.com/products/category/infant-formula/",
    },
    validated: false,
  },
  {
    id: "munchkin-grass-fed",
    name: "Munchkin Grass Fed",
    manufacturer: "Munchkin",
    countryOfOrigin: "US",
    segments: ["premium_dtc"],
    website: "https://www.munchkin.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.munchkin.com/grass-fed-formula",
    },
    validated: false,
  },
  {
    id: "burts-bees-baby-organic",
    name: "Burt's Bees Baby Organic",
    manufacturer: "Burt's Bees Baby",
    parentCompany: "Hain Celestial",
    countryOfOrigin: "US",
    segments: ["premium_dtc", "niche"],
    website: "https://www.burtsbeesbaby.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.burtsbeesbaby.com/formula",
    },
    validated: false,
  },

  // ---------------------------------------------------------------------
  // EUROPEAN IMPORTS — FDA enforcement-discretion territory
  // ---------------------------------------------------------------------
  {
    id: "hipp-de",
    name: "HiPP (Germany)",
    manufacturer: "HiPP GmbH & Co. Vertrieb KG",
    countryOfOrigin: "DE",
    segments: ["european_import"],
    website: "https://www.hipp.de",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.hipp.de/baby-ernaehrung/anfangsmilch/",
      productLinkSelector: "a.product-tile-link",
      selectors: { title: "h1.product-title" },
    },
    validated: false,
    notes:
      "Combiotik, HA, Comfort, AR. Recipe varies by region; DE/UK/NL each tracked separately because parents specifically seek the Dutch/German recipe.",
  },
  {
    id: "hipp-uk",
    name: "HiPP (UK)",
    manufacturer: "HiPP UK Ltd",
    countryOfOrigin: "GB",
    segments: ["european_import"],
    website: "https://www.hipp.co.uk",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.hipp.co.uk/baby-milk/",
    },
    validated: false,
  },
  {
    id: "hipp-nl",
    name: "HiPP (Dutch)",
    manufacturer: "HiPP Nederland",
    countryOfOrigin: "NL",
    segments: ["european_import"],
    website: "https://www.hipp.nl",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.hipp.nl/babyvoeding/zuigelingenvoeding/",
      productLinkSelector: "a[href*='/babyvoeding/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes: "Dutch HiPP (Hipp Bio Combiotik) is the most-requested European import in many parent communities.",
  },
  {
    id: "hipp-us-importer",
    name: "HiPP (US specialty importer)",
    manufacturer: "HiPP via specialty US importers",
    countryOfOrigin: "DE",
    segments: ["european_import"],
    website: "https://organicsbestshop.com/collections/hipp",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "shopify",
      domain: "organicsbestshop.com",
      productPathFilter: "/collections/hipp",
    },
    validated: false,
    notes:
      "Organic's Best, MyOrganicCompany, Formuland import HiPP into the US. They're retailer surfaces but also the only US-shipping price points for HiPP — track for cost transparency.",
  },
  {
    id: "holle",
    name: "Holle",
    manufacturer: "Holle baby food AG",
    countryOfOrigin: "CH",
    segments: ["european_import"],
    website: "https://www.holle.ch",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.holle.ch/en/our-products",
    },
    validated: false,
    notes: "Stage Pre, 1, 2, 3 + Goat (tracked separately) + A2.",
  },
  {
    id: "lebenswert",
    name: "Lebenswert Bio",
    manufacturer: "Holle baby food AG",
    countryOfOrigin: "DE",
    segments: ["european_import"],
    website: "https://www.holle.ch",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "shopify",
      domain: "organicsbestshop.com",
      productPathFilter: "/collections/lebenswert",
    },
    validated: false,
    notes:
      "Subsidiary of Holle, EU Bioland-certified. Sold in US via specialty importers.",
  },
  {
    id: "loulouka",
    name: "Loulouka",
    manufacturer: "Loulouka Switzerland",
    countryOfOrigin: "CH",
    segments: ["european_import"],
    website: "https://loulouka.com",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "shopify",
      domain: "organicsbestshop.com",
      productPathFilter: "/collections/loulouka",
    },
    validated: false,
    notes:
      "Coconut-oil-based fat blend (no palm). Sold in US via specialty importers.",
  },
  {
    id: "kendamil",
    name: "Kendamil",
    manufacturer: "Kendal Nutricare",
    countryOfOrigin: "GB",
    segments: ["european_import"],
    website: "https://www.kendamil.com",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.kendamil.com/collections/all-formula",
    },
    validated: false,
    notes:
      "Classic, Organic, Goat, Comfort. Some Kendamil SKUs FDA-registered as of 2024 (Operation Fly Formula imports); others still enforcement-discretion. Per-SKU FDA status must come from the FDA submissions list, not this default.",
  },
  {
    id: "aussie-bubs",
    name: "Aussie Bubs",
    manufacturer: "Bubs Australia Limited",
    countryOfOrigin: "AU",
    segments: ["european_import"],
    website: "https://aussiebubs.com",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "aussiebubs.com" },
    validated: false,
    notes:
      "Goat, A2 Beta-Casein, Organic Grass Fed, Supreme. FDA enforcement-discretion + some SKUs FDA-registered post Operation Fly Formula.",
  },
  {
    id: "bubs-australia",
    name: "Bubs Australia",
    manufacturer: "Bubs Australia Limited",
    countryOfOrigin: "AU",
    segments: ["european_import"],
    website: "https://bubsaustralia.com",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "bubsaustralia.com" },
    validated: false,
    notes:
      "Australian site for the same brand; product specs may differ from the aussiebubs.com US-importer surface.",
  },
  {
    id: "topfer",
    name: "Töpfer Lactana",
    manufacturer: "Töpfer GmbH",
    countryOfOrigin: "DE",
    segments: ["european_import"],
    website: "https://www.toepfer-babywelt.de",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.toepfer-babywelt.de/produkte/",
      productLinkSelector: "a.product-link",
      selectors: { title: "h1" },
    },
    validated: false,
  },
  {
    id: "nannycare",
    name: "Nannycare",
    manufacturer: "Vitacare Ltd",
    countryOfOrigin: "GB",
    segments: ["european_import", "goat_milk"],
    website: "https://www.nannycare.co.uk",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.nannycare.co.uk/products",
      productLinkSelector: "a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "UK goat-milk specialist. Stage 1/2/3. Validation 2026-05-09: page has JSON-LD scripts but none typed Product; switched to html engine.",
  },

  // ---------------------------------------------------------------------
  // SPECIALTY: HYPOALLERGENIC / EXTENSIVELY HYDROLYZED
  // ---------------------------------------------------------------------
  {
    id: "nutramigen",
    name: "Nutramigen",
    manufacturer: "Mead Johnson Nutrition",
    parentCompany: "Reckitt",
    countryOfOrigin: "US",
    segments: ["specialty_hypoallergenic"],
    website: "https://www.enfamil.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.enfamil.com/products/",
      productLinkSelector: "a[href*='nutramigen' i]",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Extensively hydrolyzed casein. Cow milk protein allergy. Validation 2026-05-09: per-sub-brand URL 404s; consolidated under enfamil.com/products/ umbrella with case-insensitive nutramigen link filter.",
  },
  {
    id: "alimentum",
    name: "Similac Alimentum",
    manufacturer: "Abbott Nutrition",
    parentCompany: "Abbott",
    countryOfOrigin: "US",
    segments: ["specialty_hypoallergenic"],
    website: "https://www.similac.com/baby-formula/alimentum.html",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.similac.com/baby-formula/alimentum.html",
      productLinkSelector: "a[href*='alimentum']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes: "Extensively hydrolyzed casein. Cow milk protein allergy + colic.",
  },
  {
    id: "gerber-extensive-ha",
    name: "Gerber Extensive HA",
    manufacturer: "Nestlé Nutrition",
    parentCompany: "Nestlé",
    countryOfOrigin: "US",
    segments: ["specialty_hypoallergenic"],
    website: "https://www.gerber.com/products/extensive-ha",
    fdaStatusDefault: "registered",
    scrapeStatus: "partnership_only",
    config: {
      engine: "html",
      productListUrl: "https://www.gerber.com/products/extensive-ha",
      productLinkSelector: "a[href*='extensive-ha']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "100% extensively hydrolyzed whey. Validation 2026-05-09: gerber.com 403s; partnership_only until Nestlé feed lands.",
  },
  {
    id: "pregestimil",
    name: "Pregestimil",
    manufacturer: "Mead Johnson Nutrition",
    parentCompany: "Reckitt",
    countryOfOrigin: "US",
    segments: ["specialty_hypoallergenic", "specialty_metabolic"],
    website: "https://www.enfamil.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.enfamil.com/products/",
      productLinkSelector: "a[href*='pregestimil' i]",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Extensively hydrolyzed casein + MCT oil. Fat malabsorption. Validation 2026-05-09: per-sub-brand URL 404; consolidated under enfamil umbrella.",
  },

  // ---------------------------------------------------------------------
  // SPECIALTY: AMINO-ACID (ELEMENTAL)
  // ---------------------------------------------------------------------
  {
    id: "elecare",
    name: "EleCare",
    manufacturer: "Abbott Nutrition",
    parentCompany: "Abbott",
    countryOfOrigin: "US",
    segments: ["specialty_amino_acid"],
    website: "https://elecare.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://elecare.com/products",
      productLinkSelector: "a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "100% free amino acids. Severe CMPA / multiple food allergies / EoE. Often prescription-only via specialty pharmacy.",
  },
  {
    id: "neocate",
    name: "Neocate",
    manufacturer: "Nutricia North America",
    parentCompany: "Danone",
    countryOfOrigin: "US",
    segments: ["specialty_amino_acid"],
    website: "https://www.neocate.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.neocate.com/products/",
      productLinkSelector: "a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Syneo Infant, Junior, Splash. Amino-acid based; severe allergy / GI conditions. Validation 2026-05-09: no JSON-LD on listing page; switched to html.",
  },
  {
    id: "puramino",
    name: "PurAmino",
    manufacturer: "Mead Johnson Nutrition",
    parentCompany: "Reckitt",
    countryOfOrigin: "US",
    segments: ["specialty_amino_acid"],
    website: "https://www.enfamil.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.enfamil.com/products/",
      productLinkSelector: "a[href*='puramino' i]",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Amino-acid + medium-chain triglycerides. Validation 2026-05-09: consolidated under enfamil umbrella.",
  },

  // ---------------------------------------------------------------------
  // PREEMIE POST-DISCHARGE
  // ---------------------------------------------------------------------
  {
    id: "neosure",
    name: "Similac NeoSure",
    manufacturer: "Abbott Nutrition",
    parentCompany: "Abbott",
    countryOfOrigin: "US",
    segments: ["preemie_post_discharge"],
    website: "https://www.similac.com/baby-formula/neosure.html",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.similac.com/baby-formula/neosure.html",
      productLinkSelector: "a[href*='neosure']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Post-NICU discharge formula for premature infants. 22 cal/oz. Higher protein + minerals.",
  },
  {
    id: "enfacare",
    name: "Enfamil EnfaCare",
    manufacturer: "Mead Johnson Nutrition",
    parentCompany: "Reckitt",
    countryOfOrigin: "US",
    segments: ["preemie_post_discharge"],
    website: "https://www.enfamil.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.enfamil.com/products/",
      productLinkSelector: "a[href*='enfacare' i]",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "Post-NICU discharge formula. 22 cal/oz. Validation 2026-05-09: consolidated under enfamil umbrella.",
  },

  // ---------------------------------------------------------------------
  // GOAT MILK SPECIALISTS
  // ---------------------------------------------------------------------
  {
    id: "kabrita",
    name: "Kabrita",
    manufacturer: "Ausnutria Hyproca",
    countryOfOrigin: "NL",
    segments: ["goat_milk"],
    website: "https://www.kabritausa.com",
    fdaStatusDefault: "registered",
    scrapeStatus: "auto",
    config: { engine: "shopify", domain: "www.kabritausa.com" },
    validated: false,
    notes:
      "Dutch goat-milk formula, FDA-registered for US sale (newer entrant). Stage 1, 2, 3 + toddler.",
  },
  {
    id: "holle-goat",
    name: "Holle Goat",
    manufacturer: "Holle baby food AG",
    countryOfOrigin: "CH",
    segments: ["european_import", "goat_milk"],
    website: "https://www.holle.ch",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "shopify",
      domain: "organicsbestshop.com",
      productPathFilter: "/collections/holle-goat",
    },
    validated: false,
    notes: "Tracked as a separate brand from Holle cow because the recipe is materially different and parents discriminate.",
  },
  {
    id: "kendamil-goat",
    name: "Kendamil Goat",
    manufacturer: "Kendal Nutricare",
    countryOfOrigin: "GB",
    segments: ["european_import", "goat_milk"],
    website: "https://www.kendamil.com/collections/goat",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "jsonld",
      productListUrl: "https://www.kendamil.com/collections/goat",
    },
    validated: false,
  },

  // ---------------------------------------------------------------------
  // A2 / ALTERNATIVE PROTEIN
  // ---------------------------------------------------------------------
  {
    id: "a2-platinum",
    name: "a2 Platinum",
    manufacturer: "The a2 Milk Company",
    countryOfOrigin: "AU",
    segments: ["european_import", "a2_milk"],
    website: "https://www.a2platinum.com",
    fdaStatusDefault: "enforcement_discretion",
    scrapeStatus: "auto",
    config: {
      engine: "html",
      productListUrl: "https://www.a2platinum.com/products",
      productLinkSelector: "a[href*='/product/'], a[href*='/products/']",
      selectors: { title: "h1" },
    },
    validated: false,
    notes:
      "A2-only β-casein protein. Stage 1/2/3. AU/NZ-recipe; US enforcement-discretion. Validation 2026-05-09: JSON-LD present but not Product type; switched to html.",
  },
];

export function findBrand(id: string): BrandRegistryEntry | undefined {
  return BRAND_REGISTRY.find((b) => b.id === id);
}

export function listBrands(filter?: {
  segment?: BrandRegistryEntry["segments"][number];
  engine?: BrandRegistryEntry["config"]["engine"];
  scrapeStatus?: BrandRegistryEntry["scrapeStatus"];
}): BrandRegistryEntry[] {
  return BRAND_REGISTRY.filter((b) => {
    if (filter?.segment && !b.segments.includes(filter.segment)) return false;
    if (filter?.engine && b.config.engine !== filter.engine) return false;
    if (filter?.scrapeStatus && b.scrapeStatus !== filter.scrapeStatus)
      return false;
    return true;
  });
}
