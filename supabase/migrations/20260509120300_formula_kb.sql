-- The formula knowledge base. Public-readable per DATA_MODEL.md § RLS.
-- Includes the recall tables proposed in DATA_SOURCING.md § 8.

create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  parent_company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  registry_id text unique,
  name text unique not null,
  manufacturer_id uuid not null references manufacturers(id) on delete restrict,
  country_of_origin text,
  website text,
  dtc_api_partner boolean not null default false,
  scrape_status scrape_status_enum not null default 'auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column brands.registry_id is
  'Mirrors @bottlewise/db registry entry id. Stable across migrations.';
comment on column brands.scrape_status is
  'auto = automated DTC scraping enabled; partnership_only = data via brand API only; opted_out = brand requested removal.';

create table formulas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete restrict,
  product_name text not null,
  external_id text,
  product_url text,
  stage formula_stage_enum,
  protein_source protein_source_enum,
  protein_form protein_form_enum,
  carb_source carb_source_enum[] not null default '{}',
  fat_blend jsonb,
  specialty_designations text[] not null default '{}',
  pediatric_indications text[] not null default '{}',
  fda_status fda_status_enum not null default 'unknown',
  fda_status_last_verified date,
  hts_code text,
  recalled_at timestamptz,
  embedding vector(384),
  provenance jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, product_name)
);
comment on column formulas.recalled_at is
  'Denormalized recall flag. Set by the recall trigger when formula_recalls insert lands a Class I event with status != terminated.';
comment on column formulas.provenance is
  'Per-field source attribution: { field_name: { source_id, observed_at } }.';

create table formula_ingredients (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete cascade,
  ingredient_name text not null,
  display_order integer not null,
  is_potential_allergen boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create index on formula_ingredients(formula_id, display_order);

create table formula_certifications (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete cascade,
  certification_type text not null,
  verified boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recall events: one row per FDA enforcement record matched against a formula.
-- Proposed in DATA_SOURCING.md § 8. The recall handling contract (§ 6) hinges
-- on this table being populated by the openFDA recalls adapter.
create table formula_recalls (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid references formulas(id) on delete restrict,
  brand_id uuid references brands(id) on delete restrict,
  openfda_recall_id text not null,
  classification recall_classification_enum not null,
  recall_status recall_status_enum not null default 'ongoing',
  recall_initiation_date date,
  termination_date date,
  reason text not null,
  recalling_firm text,
  product_description text,
  distribution_pattern text,
  voluntary_mandated text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (openfda_recall_id)
);
create index on formula_recalls(formula_id, recall_initiation_date desc);
create index on formula_recalls(brand_id, recall_initiation_date desc);
create index on formula_recalls(recall_status) where recall_status != 'terminated';
