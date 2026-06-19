-- ============================================================
-- CADENZA — Schema Supabase
-- Esegui tutto questo nel SQL Editor di Supabase
-- ============================================================

-- Abilita UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- CATEGORIE
-- ============================================================
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,
  label      text not null,
  color      text not null default '#0f62fe',
  tag_bg     text not null default '#d0e2ff',
  tag_text   text not null default '#0043ce',
  created_at timestamptz not null default now(),
  unique(user_id, key)
);

alter table public.categories enable row level security;

create policy "Utente vede solo le sue categorie"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- METODI DI PAGAMENTO
-- ============================================================
create table public.payment_methods (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  created_at timestamptz not null default now(),
  unique(user_id, label)
);

alter table public.payment_methods enable row level security;

create policy "Utente vede solo i suoi metodi"
  on public.payment_methods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- SPESE RICORRENTI
-- ============================================================
create table public.expenses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  cat         text not null,
  amount      numeric(10,2) not null,
  interval    smallint not null default 1 check (interval in (1,2,3,6,12)),
  start_year  smallint not null,
  start_month smallint not null check (start_month between 0 and 11),
  end_year    smallint,
  end_month   smallint check (end_month between 0 and 11),
  day         smallint not null default 1 check (day between 1 and 31),
  method      text not null default 'Addebito SEPA',
  note        text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Utente vede solo le sue spese"
  on public.expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- FUNZIONE: popola categorie e metodi default al primo login
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Categorie default
  insert into public.categories (user_id, key, label, color, tag_bg, tag_text) values
    (new.id, 'bollette',      'Bollette',         '#0f62fe', '#d0e2ff', '#0043ce'),
    (new.id, 'abbonamenti',   'Abbonamenti',       '#8a3ffc', '#e8daff', '#6929c4'),
    (new.id, 'rate',          'Rate & prestiti',   '#007d79', '#9ef0f0', '#005d5d'),
    (new.id, 'assicurazioni', 'Assicurazioni',     '#198038', '#a7f0ba', '#0e6027');

  -- Metodi default
  insert into public.payment_methods (user_id, label) values
    (new.id, 'Addebito SEPA'),
    (new.id, 'Carta di credito'),
    (new.id, 'PayPal'),
    (new.id, 'Bonifico');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
