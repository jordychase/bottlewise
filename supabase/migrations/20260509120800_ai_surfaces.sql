-- AI-facing tables: recommendation snapshots, substitution events, chat history.
-- Per DATA_MODEL.md § AI surface tables.

create table recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  baby_id uuid not null references babies(id) on delete restrict,
  baby_profile_version integer not null,
  flow rec_flow_enum not null,
  recommended_formula_ids uuid[] not null default '{}',
  avoided_formula_ids uuid[] not null default '{}',
  reasoning_payload jsonb not null,
  narration_text text,
  model_version text not null,
  reviewing_clinician_id uuid,
  created_at timestamptz not null default now()
);
create index on recommendations(user_id, created_at desc);
create index on recommendations(baby_id, created_at desc);

create table substitution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  baby_id uuid not null references babies(id) on delete restrict,
  original_formula_id uuid not null references formulas(id) on delete restrict,
  reason substitution_reason_enum not null,
  suggested_formula_ids uuid[] not null default '{}',
  selected_formula_id uuid references formulas(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on substitution_events(user_id, created_at desc);
create index on substitution_events(original_formula_id, created_at desc);

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  baby_id uuid not null references babies(id) on delete restrict,
  flow rec_flow_enum not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index on chat_sessions(user_id, started_at desc);
create index on chat_sessions(baby_id, started_at desc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  role chat_role_enum not null,
  content text not null,
  tool_calls jsonb,
  safety_triggered boolean not null default false,
  created_at timestamptz not null default now()
);
create index on chat_messages(session_id, created_at);
