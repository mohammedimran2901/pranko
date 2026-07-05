-- Pranko: persistent user credits table + prank jobs table
-- Run this in the Supabase SQL Editor (or via `supabase db push`) before deploying.
--
-- Supabase gives every project a "public" schema by default.
-- These tables store credit balances and job results so they survive server restarts / cold starts.

create table if not exists public.user_credits (
  user_id          text primary key,                -- anonymous cookie id (pranko_uid)
  credits          integer not null default 0,      -- current balance
  subscription_id  text,                            -- Polar subscription id
  last_refilled_at bigint,                          -- epoch ms of last refill
  current_period_end bigint,                        -- epoch ms of current period end
  email            text,                            -- customer email from Polar
  canceled         boolean default false,           -- true if subscription canceled
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Persist prank jobs so they survive Vercel cold starts.
create table if not exists public.prank_jobs (
  id                text primary key,                 -- nanoid, created by the app
  share_token       text not null unique,             -- nanoid for public shareable links
  status            text not null default 'generating', -- queued|uploading|generating|completed|failed
  prompt            text not null,
  fal_request_id    text not null,
  fal_status_url    text,                             -- fal.ai status URL (model-specific)
  fal_result_url    text,                             -- fal.ai result URL (model-specific)
  uploaded_image_url text,
  result_video_url  text,
  error             text,
  locale            text not null default 'en',
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);

create index if not exists idx_prank_jobs_share_token on public.prank_jobs(share_token);
create index if not exists idx_prank_jobs_fal_request on public.prank_jobs(fal_request_id);

-- Trigger to auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_credits_updated_at on public.user_credits;
create trigger user_credits_updated_at
  before update on public.user_credits
  for each row execute function public.set_updated_at();

-- Enable RLS but allow service_role full access (we use service_role server-side).
alter table public.user_credits enable row level security;

-- The service_role key bypasses RLS entirely, so no policies needed
-- for server-side access. If you need anon access, add policies here.

-- ── Atomic credit consumption ──────────────────────────────────────

create or replace function public.consume_credit(p_user_id text)
returns jsonb
language plpgsql
as $$
declare
  v_row public.user_credits;
begin
  -- Lock the row for update to prevent race conditions.
  select * into v_row
  from public.user_credits
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('new_balance', null, 'error', 'user_not_found');
  end if;

  if v_row.credits <= 0 then
    return jsonb_build_object('new_balance', null, 'error', 'no_credits');
  end if;

  update public.user_credits
  set credits = credits - 1
  where user_id = p_user_id;

  return jsonb_build_object('new_balance', v_row.credits - 1);
end;
$$;
