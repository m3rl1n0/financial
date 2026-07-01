-- ============================================================
-- CADENZA — Migration v4: flag spese a prestazione
-- Esegui nel SQL Editor di Supabase
-- ============================================================

alter table public.expenses
  add column if not exists is_prestazione boolean not null default false;

-- Aggiungi categoria "Prestazione" per l'utente esistente
-- (i nuovi utenti la ricevono dal trigger handle_new_user)
insert into public.categories (user_id, key, label, color, tag_bg, tag_text)
select id, 'prestazione', 'Prestazione', '#007d79', '#9ef0f0', '#005d5d'
from auth.users
where email = 'm3rl1n0@gmail.com'
on conflict do nothing;
