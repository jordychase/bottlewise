-- Postgres extensions Bottlewise depends on.
--   pgcrypto: gen_random_uuid()
--   vector:   pgvector for similarity (formulas.embedding, trial_outcomes.notes_embedding)
--   citext:   case-insensitive emails
create extension if not exists pgcrypto;
create extension if not exists vector;
create extension if not exists citext;
