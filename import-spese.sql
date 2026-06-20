-- ============================================================
-- CADENZA — Import spese ricorrenti da estratti conto
-- Esegui nel SQL Editor di Supabase
-- ============================================================

do $$
declare
  uid uuid;
begin
  -- Recupera l'id dell'utente
  select id into uid from auth.users
  where email = 'm3rl1n0@gmail.com'
  limit 1;

  if uid is null then
    raise exception 'Utente non trovato';
  end if;

  -- Pulizia eventuale (ri-esecuzione sicura)
  delete from public.expenses where user_id = uid;

  -- ============================================================
  -- CONTO CORRENTE — Addebito SEPA
  -- ============================================================

  -- Bollette
  insert into public.expenses (user_id, name, cat, amount, interval, start_year, start_month, end_year, end_month, day, method, note) values
  (uid, 'Yada Energia – Luce',       'bollette', 65.77,  1, 2025, 5, null, null, 16, 'Addebito SEPA', 'Energia elettrica domestica'),
  (uid, 'Yada Energia – Gas',        'bollette', 51.44,  1, 2025, 5, null, null, 16, 'Addebito SEPA', 'Gas domestico'),
  (uid, 'Fastweb Internet',          'bollette', 21.90,  1, 2025, 5, null, null,  4, 'Addebito SEPA', 'Fibra domestica'),
  (uid, 'Fastweb SIM moglie',        'bollette',  8.95,  1, 2025, 5, null, null, 25, 'Addebito SEPA', 'Abbonamento mobile'),
  (uid, 'Telepass',                  'bollette', 150.00, 1, 2025, 5, null, null, 28, 'Addebito SEPA', 'Importo variabile — media mensile stimata'),

  -- Abbonamenti
  (uid, 'Sky',                       'abbonamenti', 39.00, 1, 2026, 2, null, null, 27, 'Addebito SEPA', ''),

  -- Assicurazioni
  (uid, 'MetLife – Polizza vita',    'assicurazioni', 35.00, 1, 2025, 5, null, null,  3, 'Addebito SEPA', 'Polizza ALDN0006'),
  (uid, 'MetLife – Polizza salute',  'assicurazioni', 52.50, 3, 2025, 2, null, null, 11, 'Addebito SEPA', 'Polizza ELVW0030 — trimestrale (mar/giu/set/dic)'),

  -- Rate
  (uid, 'Findomestic – Rata',        'rate', 100.89, 1, 2025, 5, 2026,    7,  5, 'Addebito SEPA', 'Rata principale — ultima rata agosto 2026'),
  (uid, 'Findomestic – Rata 2',      'rate',  73.25, 1, 2025, 5, 2025,   10,  5, 'Addebito SEPA', 'Seconda rata — conclusa novembre 2025');

  -- ============================================================
  -- CARTA DI CREDITO
  -- ============================================================

  insert into public.expenses (user_id, name, cat, amount, interval, start_year, start_month, end_year, end_month, day, method, note) values

  -- Abbonamenti AI
  (uid, 'Claude.ai Pro',             'abbonamenti', 21.96, 1, 2025, 5, null, null, 19, 'Carta di credito', 'Anthropic'),
  (uid, 'ChatGPT Plus',              'abbonamenti', 21.40, 1, 2025, 5, null, null,  6, 'Carta di credito', 'OpenAI'),
  (uid, 'Perplexity AI',             'abbonamenti', 21.40, 1, 2025, 9, 2026,    1, 20, 'Carta di credito', 'Disdetto a febbraio 2026'),

  -- Abbonamenti
  (uid, 'Strava',                    'abbonamenti', 44.99, 12, 2026, 0, null, null, 27, 'Carta di credito', 'Abbonamento annuale'),
  (uid, 'Amazon Prime',              'abbonamenti', 49.90, 12, 2025, 9, null, null, 26, 'Carta di credito', 'Rinnovo annuale'),

  -- Bollette
  (uid, 'Vodafone SIM',              'bollette',    13.90, 1, 2025, 5, null, null, 18, 'Carta di credito', 'Ricarica mensile SIM'),

  -- Rate
  (uid, 'Garmin Fenix 7 Pro',        'rate',        29.06, 1, 2025, 5, 2026,    9, 30, 'Carta di credito', 'Heylight/Mediobanca — ultima rata ottobre 2026'),

  -- Professionisti
  (uid, 'Psicologo',                 'abbonamenti', 122.40, 1, 2025, 5, null, null, 15, 'Carta di credito', '2 sedute/mese × €61,20 — INNEO GIUSEPPE Roma');

  -- ============================================================
  -- PAYPAL → ADDEBITO SUL CONTO BANCARIO
  -- ============================================================

  insert into public.expenses (user_id, name, cat, amount, interval, start_year, start_month, end_year, end_month, day, method, note) values

  (uid, 'Apple One',                 'abbonamenti', 34.95, 1, 2025, 5, null, null, 13, 'PayPal', 'Apple One famiglia — via PayPal/conto'),
  (uid, 'Apple iCloud (da verif.)',  'abbonamenti',  2.99, 1, 2025, 5, null, null, 24, 'PayPal', 'Piano iCloud — da identificare'),
  (uid, 'Apple (da verif.)',         'abbonamenti', 19.99, 1, 2025,11, null, null,  8, 'PayPal', 'Servizio Apple da identificare — attivo da dic 2025'),
  (uid, 'Netflix',                   'abbonamenti',  6.99, 1, 2025, 5, null, null, 28, 'PayPal', 'Piano base — via PayPal/conto');

end $$;
