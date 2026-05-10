-- Formula maker calibration. Per DATA_MODEL.md § Formula maker settings.

create table formula_makers (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (manufacturer, model)
);

create table formula_maker_settings (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete cascade,
  formula_maker_id uuid not null references formula_makers(id) on delete cascade,
  setting_label text,
  scoop_type text,
  water_to_powder_ratio text,
  notes text,
  verified_by_user_count integer not null default 0,
  disputed_by_user_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formula_id, formula_maker_id)
);
