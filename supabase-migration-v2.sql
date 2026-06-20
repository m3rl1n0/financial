-- ============================================================
-- CADENZA — Migration v2: storico variazioni di prezzo
-- Esegui nel SQL Editor di Supabase (una volta sola)
-- ============================================================

create table public.expense_prices (
  id               uuid primary key default uuid_generate_v4(),
  expense_id       uuid not null references public.expenses(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  amount           numeric(10,2) not null,
  valid_from_year  smallint not null,
  valid_from_month smallint not null check (valid_from_month between 0 and 11),
  valid_to_year    smallint,
  valid_to_month   smallint check (valid_to_month between 0 and 11),
  created_at       timestamptz not null default now()
);

alter table public.expense_prices enable row level security;

create policy "Utente vede solo i suoi prezzi"
  on public.expense_prices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
