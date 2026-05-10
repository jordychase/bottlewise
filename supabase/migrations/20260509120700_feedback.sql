-- The feedback loop. Per DATA_MODEL.md § Feedback loop.

create table formula_trials (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies(id) on delete restrict,
  formula_id uuid not null references formulas(id) on delete restrict,
  started_on date not null,
  ended_on date,
  baby_profile_version integer not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on formula_trials(baby_id, started_on desc);
create index on formula_trials(formula_id, started_on desc);

-- Append-only. A trial can have multiple outcome reports (7-day, 30-day check-ins).
create table trial_outcomes (
  id uuid primary key default gen_random_uuid(),
  trial_id uuid not null references formula_trials(id) on delete restrict,
  reported_at timestamptz not null default now(),
  tolerance tolerance_enum not null,
  issues_observed text[] not null default '{}',
  would_recommend_to_similar boolean,
  notes text,
  notes_embedding vector(384),
  safety_flag boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index on trial_outcomes(trial_id, reported_at desc);
create index on trial_outcomes(safety_flag, reported_at desc) where safety_flag = true;
create index on trial_outcomes(is_published, reported_at desc) where is_published = true;
