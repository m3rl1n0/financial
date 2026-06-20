-- ============================================================
-- CADENZA — Import spese ricorrenti v2 (con storico prezzi)
-- Esegui nel SQL Editor di Supabase DOPO aver eseguito
-- supabase-migration-v2.sql (che crea la tabella expense_prices)
-- ============================================================

do $$
declare
  uid             uuid;
  id_sky          uuid;
  id_yada_luce    uuid;
  id_yada_gas     uuid;
  id_fastweb_sim  uuid;
begin

  select id into uid from auth.users
  where email = 'm3rl1n0@gmail.com' limit 1;

  if uid is null then
    raise exception 'Utente non trovato — verifica l''email';
  end if;

  -- Pulizia idempotente (cascade elimina anche expense_prices)
  delete from public.expenses where user_id = uid;

  -- ============================================================
  -- CONTO CORRENTE — Addebito SEPA
  -- ============================================================

  insert into public.expenses
    (user_id, name, cat, amount, interval, start_year, start_month,
     end_year, end_month, day, method, note)
  values
  -- Bollette
  (uid, 'Yada Energia – Luce',       'bollette',      65.77, 1, 2025,  5, null, null, 16, 'Addebito SEPA', 'Energia elettrica domestica — importo variabile'),
  (uid, 'Yada Energia – Gas',        'bollette',      51.44, 1, 2025,  5, null, null, 16, 'Addebito SEPA', 'Gas domestico — importo variabile'),
  (uid, 'Fastweb Internet',          'bollette',      21.90, 1, 2026,  1, null, null,  4, 'Addebito SEPA', 'Fibra domestica — attivata febbraio 2026'),
  (uid, 'Fastweb SIM moglie',        'bollette',       9.95, 1, 2025,  5, null, null, 25, 'Addebito SEPA', 'Abbonamento mobile'),
  (uid, 'Telepass',                  'bollette',     150.00, 1, 2025,  5, null, null, 28, 'Addebito SEPA', 'Importo variabile — media mensile stimata'),
  -- Abbonamenti
  (uid, 'Sky',                       'abbonamenti',   39.00, 1, 2025,  5, null, null, 27, 'Addebito SEPA', ''),
  -- Assicurazioni
  (uid, 'MetLife – Polizza vita',    'assicurazioni', 35.00, 1, 2025,  5, null, null,  3, 'Addebito SEPA', 'Polizza ALDN0006'),
  (uid, 'MetLife – Polizza salute',  'assicurazioni', 52.50, 3, 2025,  2, null, null, 11, 'Addebito SEPA', 'Polizza ELVW0030 — trimestrale (mar/giu/set/dic)'),
  -- Rate
  (uid, 'Findomestic – Rata',        'rate',         100.89, 1, 2025,  5, 2026,  7,   5, 'Addebito SEPA', 'Rata principale — ultima rata agosto 2026'),
  (uid, 'Findomestic – Rata 2',      'rate',          73.25, 1, 2025,  5, 2025, 10,   5, 'Addebito SEPA', 'Seconda rata — conclusa novembre 2025');

  -- ============================================================
  -- CARTA DI CREDITO
  -- ============================================================

  insert into public.expenses
    (user_id, name, cat, amount, interval, start_year, start_month,
     end_year, end_month, day, method, note)
  values
  (uid, 'Claude.ai Pro',             'abbonamenti',  21.96, 1, 2025,  5, null, null, 19, 'Carta di credito', 'Anthropic'),
  (uid, 'ChatGPT Plus',              'abbonamenti',  21.40, 1, 2025,  5, null, null,  6, 'Carta di credito', 'OpenAI — importo variabile per cambio USD/EUR'),
  (uid, 'Perplexity AI',             'abbonamenti',  21.40, 1, 2025,  9, 2026,  1,  20, 'Carta di credito', 'Disdetto a febbraio 2026'),
  (uid, 'Strava',                    'abbonamenti',  44.99, 12, 2026, 0, null, null, 27, 'Carta di credito', 'Abbonamento annuale'),
  (uid, 'Amazon Prime',              'abbonamenti',  49.90, 12, 2025, 9, null, null, 26, 'Carta di credito', 'Rinnovo annuale'),
  (uid, 'Vodafone SIM',              'bollette',     13.90, 1, 2025,  5, null, null, 18, 'Carta di credito', 'Ricarica mensile SIM'),
  (uid, 'Garmin Fenix 7 Pro',        'rate',         29.06, 1, 2025,  5, 2026,  9,  30, 'Carta di credito', 'Heylight/Mediobanca — ultima rata ottobre 2026'),
  (uid, 'Psicologo',                 'abbonamenti', 122.40, 1, 2025,  5, null, null, 15, 'Carta di credito', '2 sedute/mese × €61,20 — INNEO GIUSEPPE Roma');

  -- ============================================================
  -- PAYPAL
  -- ============================================================

  insert into public.expenses
    (user_id, name, cat, amount, interval, start_year, start_month,
     end_year, end_month, day, method, note)
  values
  (uid, 'Apple One',                 'abbonamenti',  34.95, 1, 2025,  5, null, null, 13, 'PayPal', 'Apple One Famiglia'),
  (uid, 'iCloud (piano 1)',          'abbonamenti',   2.99, 1, 2025,  5, null, null, 24, 'PayPal', 'Piano iCloud personale'),
  (uid, 'iCloud (piano 2)',          'abbonamenti',   2.99, 1, 2025,  8, null, null,  5, 'PayPal', 'Piano iCloud moglie — attivo da settembre 2025'),
  (uid, 'Apple (da ident. 1)',       'abbonamenti',  19.99, 1, 2025, 11, 2026,  2,   8, 'PayPal', 'Da identificare — dicembre 2025 / marzo 2026'),
  (uid, 'Apple (da ident. 2)',       'abbonamenti',  15.99, 1, 2025,  8, 2025, 10,   5, 'PayPal', 'Da identificare — settembre / novembre 2025'),
  (uid, 'Netflix',                   'abbonamenti',   6.99, 1, 2025,  5, null, null, 28, 'PayPal', 'Piano base'),
  -- Piani di rientro PayPal (Paga in rate)
  (uid, 'Allianz Direct',            'assicurazioni', 44.66, 1, 2026, 4, 2027,  3,   6, 'PayPal', 'Assicurazione auto — 12 rate, acquistata 06/05/2026'),
  (uid, 'Insta360 (rata)',           'rate',          85.93, 1, 2026, 0, 2026, 11,  17, 'PayPal', 'Insta360 Ace Pro 2 — 12 rate PayPal, acquistata 17/01/2026'),
  (uid, 'TicketOne (rata 1)',        'rate',          34.95, 1, 2026, 3, 2026,  5,  30, 'PayPal', 'Biglietti — 3 rate, acquistata 30/04/2026'),
  (uid, 'TicketOne (rata 2)',        'rate',          45.72, 1, 2026, 4, 2026,  6,   7, 'PayPal', 'Biglietti — 3 rate, acquistata 07/05/2026');

  -- ============================================================
  -- STORICO VARIAZIONI DI PREZZO
  -- ============================================================

  select id into id_sky         from public.expenses where user_id = uid and name = 'Sky' limit 1;
  select id into id_yada_luce   from public.expenses where user_id = uid and name = 'Yada Energia – Luce' limit 1;
  select id into id_yada_gas    from public.expenses where user_id = uid and name = 'Yada Energia – Gas' limit 1;
  select id into id_fastweb_sim from public.expenses where user_id = uid and name = 'Fastweb SIM moglie' limit 1;

  insert into public.expense_prices
    (expense_id, user_id, amount, valid_from_year, valid_from_month, valid_to_year, valid_to_month)
  values

  -- Sky: €24,90 giu 2025 – feb 2026 | €39,00 da mar 2026
  (id_sky, uid, 24.90, 2025,  5, 2026,  1),
  (id_sky, uid, 39.00, 2026,  2, null, null),

  -- Yada Luce: estate bassa / autunno-inverno alta / feb 2026 aggiustamento
  (id_yada_luce, uid, 42.89, 2025,  6, 2025,  8),   -- lug–set 2025
  (id_yada_luce, uid, 65.77, 2025,  9, 2026,  0),   -- ott 2025 – gen 2026
  (id_yada_luce, uid, 55.77, 2026,  1, 2026,  1),   -- feb 2026 (conguaglio)
  (id_yada_luce, uid, 65.77, 2026,  2, null, null),  -- mar 2026 in poi

  -- Yada Gas: estate leggermente più alta / autunno scende
  (id_yada_gas, uid, 53.15, 2025,  6, 2025,  8),   -- lug–set 2025
  (id_yada_gas, uid, 51.44, 2025,  9, null, null),  -- ott 2025 in poi

  -- Fastweb SIM: €8,95 fino a mar 2026, poi €9,95
  (id_fastweb_sim, uid, 8.95, 2025,  5, 2026,  2),
  (id_fastweb_sim, uid, 9.95, 2026,  3, null, null);

end $$;
