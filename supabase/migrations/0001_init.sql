-- WAKEEL schema — the four pillars + policy config.
-- Idempotent: safe to run repeatedly.

create extension if not exists pgcrypto;

-- 1. Agent registry -----------------------------------------------------------
create table if not exists public.agents (
  id          text primary key,
  name        text not null,
  owner       text not null,
  department  text not null,
  purpose     text not null,
  risk_tier   text not null,
  model       text not null,
  vendor      text not null,
  status      text not null default 'idle',
  orb_color   text not null,
  created_at  timestamptz not null default now()
);

-- 2. Audit trail --------------------------------------------------------------
create table if not exists public.events (
  id             text primary key,
  agent_id       text not null references public.agents(id) on delete cascade,
  action         text not null,
  input_summary  text not null default '',
  output_summary text not null default '',
  confidence     numeric,
  "timestamp"    timestamptz not null default now(),
  flagged        boolean not null default false,
  flag_reason    text,
  review_state   text not null default 'pending'
);
create index if not exists events_timestamp_idx on public.events ("timestamp" desc);
create index if not exists events_agent_idx on public.events (agent_id);
create index if not exists events_flag_idx on public.events (flagged, review_state);

-- 3. Review workflow ----------------------------------------------------------
create table if not exists public.reviews (
  id          text primary key,
  event_id    text not null references public.events(id) on delete cascade,
  reviewer    text not null,
  decision    text not null,
  note        text,
  "timestamp" timestamptz not null default now()
);
create index if not exists reviews_event_idx on public.reviews (event_id);

-- 4. Incident register --------------------------------------------------------
create table if not exists public.incidents (
  id              text primary key,
  event_id        text references public.events(id) on delete set null,
  agent_id        text not null references public.agents(id) on delete cascade,
  title           text not null,
  status          text not null default 'open',
  severity        text not null default 'medium',
  opened_by       text not null,
  opened_at       timestamptz not null default now(),
  resolved_at     timestamptz,
  resolution_note text
);
create index if not exists incidents_status_idx on public.incidents (status);
create index if not exists incidents_agent_idx on public.incidents (agent_id);

-- Policy config (a small table of thresholds, not a DSL) ----------------------
create table if not exists public.policy_rules (
  id             text primary key,
  description    text not null,
  field          text not null,
  operator       text not null,
  value          text not null,
  and_conditions jsonb not null default '[]'::jsonb,
  action         text not null default 'require_approval',
  enabled        boolean not null default true
);

-- Realtime: broadcast inserts/updates on the live tables ----------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then
    alter publication supabase_realtime add table public.events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'incidents'
  ) then
    alter publication supabase_realtime add table public.incidents;
  end if;
end $$;

-- RLS: demo posture — anyone may read; writes go through the service role
-- (which bypasses RLS). Tighten to authenticated roles at M8.
alter table public.agents       enable row level security;
alter table public.events       enable row level security;
alter table public.reviews      enable row level security;
alter table public.incidents    enable row level security;
alter table public.policy_rules enable row level security;

do $$
declare t text;
begin
  foreach t in array array['agents','events','reviews','incidents','policy_rules'] loop
    execute format('drop policy if exists %I on public.%I', 'read_all_'||t, t);
    execute format(
      'create policy %I on public.%I for select using (true)', 'read_all_'||t, t
    );
  end loop;
end $$;
