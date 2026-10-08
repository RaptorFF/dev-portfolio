create table if not exists public.portfolios (
  user_id text primary key,
  slug text not null unique,
  theme text not null default 'purple',
  profile jsonb not null default '{}'::jsonb,
  selected_projects jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Pristup ide samo preko servera (service role); bez policy-ja anon klijent ne vidi ništa.
alter table public.portfolios enable row level security;

-- Data API ne izlaže nove tabele automatski, pa prava dajemo samo server ulozi.
grant select, insert, update, delete on public.portfolios to service_role;
