-- updated_at triggers and the recall denormalization trigger.

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- updated_at on every table that has the column.
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public'
      and column_name = 'updated_at'
      and table_name != 'set_updated_at'
  loop
    execute format('drop trigger if exists trg_%I_updated_at on %I;', t, t);
    execute format(
      'create trigger trg_%I_updated_at before update on %I
       for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- Recall denormalization: when a formula_recalls row goes ongoing or
-- completed (not terminated), set formulas.recalled_at to the recall
-- initiation date. Cleared when the recall is terminated and no other
-- ongoing recall exists.
create or replace function sync_formula_recalled_at() returns trigger
language plpgsql as $$
begin
  if (new.formula_id is not null) then
    if (new.recall_status = 'terminated') then
      -- if any other non-terminated recall exists for this formula, leave it
      if not exists (
        select 1 from formula_recalls
        where formula_id = new.formula_id
          and recall_status != 'terminated'
          and id != new.id
      ) then
        update formulas set recalled_at = null where id = new.formula_id;
      end if;
    else
      update formulas
        set recalled_at = coalesce(
          new.recall_initiation_date::timestamptz, now())
        where id = new.formula_id
          and (recalled_at is null
               or recalled_at > coalesce(new.recall_initiation_date::timestamptz, now()));
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_formula_recalls_sync
  after insert or update on formula_recalls
  for each row execute function sync_formula_recalled_at();

-- baby_profiles version auto-increment helper.
create or replace function next_baby_profile_version(p_baby_id uuid)
returns integer language sql as $$
  select coalesce(max(version), 0) + 1
    from baby_profiles
    where baby_id = p_baby_id;
$$;
