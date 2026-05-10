-- All enum types in one file so dependent migrations can reference them.

create type sex_enum as enum ('female', 'male', 'unspecified');

create type feeding_status_enum as enum (
  'exclusive_breastfeeding',
  'mixed',
  'exclusive_formula',
  'transitioning'
);

create type formula_stage_enum as enum (
  'infant_0_12',
  'toddler_12_plus',
  'preemie',
  'follow_on_eu_2',
  'follow_on_eu_3'
);

create type protein_source_enum as enum (
  'cow_milk',
  'goat_milk',
  'soy',
  'amino_acid',
  'plant_blend',
  'other'
);

create type protein_form_enum as enum (
  'intact',
  'partially_hydrolyzed',
  'extensively_hydrolyzed',
  'amino_acid'
);

create type carb_source_enum as enum (
  'lactose',
  'corn_syrup_solids',
  'maltodextrin',
  'sucrose',
  'glucose_syrup',
  'tapioca_starch',
  'rice_starch',
  'other'
);

create type fda_status_enum as enum (
  'registered',
  'enforcement_discretion',
  'gray_market',
  'unknown'
);

create type scrape_status_enum as enum (
  'auto',
  'partnership_only',
  'opted_out'
);

create type retailer_kind_enum as enum (
  'online',
  'big_box',
  'pharmacy',
  'specialty',
  'dtc'
);

create type price_source_enum as enum (
  'msrp',
  'amazon_pa_api',
  'walmart_api',
  'target_redsky',
  'manual',
  'crowdsource'
);

create type stock_signal_enum as enum (
  'in_stock',
  'low_stock',
  'out_of_stock'
);

create type signal_source_enum as enum (
  'amazon_pa_api',
  'walmart_api',
  'target_redsky',
  'crowdsource',
  'dtc_api'
);

create type tolerance_enum as enum (
  'well',
  'mixed',
  'poor',
  'severe_reaction'
);

create type rec_flow_enum as enum (
  'new_to_formula',
  'on_formula_help',
  'out_of_stock_cascade',
  'cost_substitution'
);

create type substitution_reason_enum as enum (
  'out_of_stock',
  'too_expensive',
  'not_tolerated',
  'recalled',
  'preference'
);

create type chat_role_enum as enum (
  'user',
  'assistant',
  'system',
  'safety_interstitial'
);

-- Recall classification per FDA. Used by formula_recalls.classification.
create type recall_classification_enum as enum (
  'class_i',
  'class_ii',
  'class_iii'
);

create type recall_status_enum as enum (
  'ongoing',
  'completed',
  'terminated'
);

-- Source-layer enums for the adapter telemetry tables.
create type source_run_status_enum as enum (
  'success',
  'partial',
  'failed'
);

create type source_tier_enum as enum (
  'authoritative',
  'community',
  'brand_dtc',
  'retailer',
  'manual'
);
