-- ============================================================
-- CADENZA — Migration v3: flag spese variabili
-- Esegui nel SQL Editor di Supabase
-- ============================================================

alter table public.expenses
  add column if not exists is_variable boolean not null default false;
