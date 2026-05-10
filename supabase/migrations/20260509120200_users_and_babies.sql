-- Users + per-baby profile. Per DATA_MODEL.md §§ 2-3.

create table users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  display_name text,
  zip_code text,
  budget_monthly_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  name text,
  dob date not null,
  sex sex_enum default 'unspecified',
  birth_weight_grams integer,
  gestational_age_weeks integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on babies(user_id, is_active);

create table baby_profiles (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete restrict,
  version integer not null,
  family_allergy_history jsonb not null default '{}'::jsonb,
  feeding_status feeding_status_enum not null,
  current_formula_ids uuid[] not null default '{}',
  observed_issues text[] not null default '{}',
  transition_intent jsonb,
  created_at timestamptz not null default now(),
  unique (baby_id, version)
);
create index on baby_profiles(baby_id, version desc);
