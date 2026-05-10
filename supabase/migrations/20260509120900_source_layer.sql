-- Source-layer tables proposed in DATA_SOURCING.md § 8.
-- These hold adapter outputs (source_records), telemetry (source_runs),
-- and the audit trail of merge decisions (source_conflicts).

create table source_records (
  id uuid primary key default gen_random_uuid(),
  adapter_id text not null,
  external_id text not null,
  brand_registry_id text,
  payload jsonb not null,
  observed_at timestamptz not null default now(),
  raw_artifact_path text,
  created_at timestamptz not null default now(),
  unique (adapter_id, external_id, observed_at)
);
create index on source_records(adapter_id, observed_at desc);
create index on source_records(brand_registry_id, observed_at desc);
comment on column source_records.raw_artifact_path is
  'Storage key for raw HTML/JSON snapshot — used to diff parser changes against prior fetches.';

-- Per-run telemetry. Drives the adapter health dashboard.
create table source_runs (
  id uuid primary key default gen_random_uuid(),
  adapter_id text not null,
  brand_registry_id text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  status source_run_status_enum not null,
  records_seen integer not null default 0,
  records_upserted integer not null default 0,
  field_coverage jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index on source_runs(adapter_id, started_at desc);
create index on source_runs(status, started_at desc) where status != 'success';

-- Audit trail: every time the merge layer would overwrite an existing
-- canonical value with a higher-precedence source, log the conflict.
create table source_conflicts (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid references formulas(id) on delete cascade,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  old_source text,
  new_source text,
  resolution text not null default 'overwrote',
  resolved_at timestamptz not null default now()
);
create index on source_conflicts(formula_id, resolved_at desc);
create index on source_conflicts(field, resolved_at desc);
