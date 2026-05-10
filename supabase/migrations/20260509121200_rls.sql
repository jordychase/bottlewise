-- Row-level security per DATA_MODEL.md § RLS policies.
--
-- User-scoped tables: a user can read/write only their own rows.
-- Public-readable tables: formulas, formula_ingredients, formula_certifications,
--   brands, manufacturers, retailers, tariff_data, customs_clearance_estimates,
--   formula_makers, formula_maker_settings, formula_recalls.
-- Aggregated public dataset: trial_outcomes where is_published = true,
--   exposed via a security-definer view that strips identifying columns.

-- User-scoped RLS.
alter table users enable row level security;
alter table babies enable row level security;
alter table baby_profiles enable row level security;
alter table formula_trials enable row level security;
alter table trial_outcomes enable row level security;
alter table recommendations enable row level security;
alter table substitution_events enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table stock_signals enable row level security;
alter table crowdsource_reputation enable row level security;

create policy users_self on users
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy babies_owner on babies
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy baby_profiles_owner on baby_profiles
  for all using (
    exists (select 1 from babies b where b.id = baby_id and b.user_id = auth.uid())
  ) with check (
    exists (select 1 from babies b where b.id = baby_id and b.user_id = auth.uid())
  );

create policy formula_trials_owner on formula_trials
  for all using (
    exists (select 1 from babies b where b.id = baby_id and b.user_id = auth.uid())
  ) with check (
    exists (select 1 from babies b where b.id = baby_id and b.user_id = auth.uid())
  );

create policy trial_outcomes_owner on trial_outcomes
  for all using (
    exists (
      select 1 from formula_trials ft
      join babies b on b.id = ft.baby_id
      where ft.id = trial_id and b.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from formula_trials ft
      join babies b on b.id = ft.baby_id
      where ft.id = trial_id and b.user_id = auth.uid()
    )
  );

create policy recommendations_owner on recommendations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy substitution_events_owner on substitution_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy chat_sessions_owner on chat_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy chat_messages_owner on chat_messages
  for all using (
    exists (select 1 from chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  ) with check (
    exists (select 1 from chat_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

create policy stock_signals_owner on stock_signals
  for all using (
    reporter_user_id = auth.uid() or reporter_user_id is null
  );
create policy stock_signals_insert on stock_signals
  for insert with check (
    reporter_user_id = auth.uid() or reporter_user_id is null
  );

create policy crowdsource_reputation_self on crowdsource_reputation
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public-readable knowledge base tables. RLS stays disabled.

-- Public dataset view: trial_outcomes with identifiers stripped.
create or replace view public_trial_outcomes
with (security_invoker = false, security_barrier = true) as
select
  to_id.id,
  to_id.reported_at,
  to_id.tolerance,
  to_id.issues_observed,
  to_id.would_recommend_to_similar,
  -- notes deliberately omitted; only the embedding is published
  to_id.notes_embedding,
  ft.formula_id,
  bp.family_allergy_history,
  bp.feeding_status
from trial_outcomes to_id
join formula_trials ft on ft.id = to_id.trial_id
join baby_profiles bp on bp.baby_id = ft.baby_id and bp.version = ft.baby_profile_version
where to_id.is_published = true
  and to_id.safety_flag = false;

comment on view public_trial_outcomes is
  'Public dataset surface. Strips user_id, baby_id, baby name, and notes. '
  'Notes_embedding is published for similarity search per the open-data commitment.';
