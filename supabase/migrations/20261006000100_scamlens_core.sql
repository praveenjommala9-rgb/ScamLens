create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  channel text not null check (channel in ('email', 'sms', 'chat', 'social', 'login')),
  category text not null check (
    category in (
      'Banking & Payment',
      'Account Takeover',
      'Delivery / Parcel',
      'Job & Recruitment',
      'Rewards & Promotions',
      'Impersonation',
      'Tech Support',
      'Password / Credential Reset'
    )
  ),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  sender_name text,
  sender_address text,
  subject text,
  body text not null,
  displayed_url text,
  correct_answer text not null check (correct_answer in ('phishing', 'legitimate', 'unsure')),
  red_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(red_flags) = 'array'),
  explanation text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scenarios_safe_display_url check (
    displayed_url is null or displayed_url ~* '^(https?://)?([a-z0-9-]+\.)*example([/:?#].*)?$'
  ),
  constraint scenarios_safe_sender_address check (
    sender_address is null or sender_address ~* '^[^[:space:]@]+@([a-z0-9-]+\.)*example$'
  )
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('baseline', 'training', 'final')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  total_questions integer not null check (total_questions = 8),
  answered_questions integer not null default 0 check (answered_questions between 0 and total_questions),
  score integer check (score between 0 and 100),
  scenario_ids uuid[] not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint sessions_eight_scenarios check (cardinality(scenario_ids) = total_questions),
  constraint sessions_id_user_unique unique (id, user_id),
  constraint sessions_completion_state check (
    (status = 'in_progress' and completed_at is null)
    or (status = 'completed' and completed_at is not null and answered_questions = total_questions and score is not null)
  )
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id),
  answer text not null check (answer in ('phishing', 'legitimate', 'unsure')),
  selected_red_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(selected_red_flags) = 'array'),
  is_correct boolean not null,
  response_time_ms integer not null check (response_time_ms between 0 and 3600000),
  reflection_note text check (reflection_note is null or char_length(reflection_note) <= 1000),
  created_at timestamptz not null default now(),
  constraint attempts_owner_session_fk
    foreign key (session_id, user_id)
    references public.sessions(id, user_id)
    on delete cascade,
  constraint attempts_one_scenario_per_session unique (session_id, scenario_id)
);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.attempts(id) on delete cascade,
  coaching_summary text not null,
  what_you_did_well jsonb not null default '[]'::jsonb check (jsonb_typeof(what_you_did_well) = 'array'),
  missed_signals jsonb not null default '[]'::jsonb check (jsonb_typeof(missed_signals) = 'array'),
  next_rule text not null,
  focus_category text not null check (
    focus_category in (
      'Banking & Payment',
      'Account Takeover',
      'Delivery / Parcel',
      'Job & Recruitment',
      'Rewards & Promotions',
      'Impersonation',
      'Tech Support',
      'Password / Credential Reset'
    )
  ),
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists scenarios_category_active_difficulty_idx
  on public.scenarios (category, active, difficulty);
create index if not exists scenarios_channel_idx
  on public.scenarios (channel);
create index if not exists sessions_user_started_idx
  on public.sessions (user_id, started_at desc);
create index if not exists attempts_user_created_idx
  on public.attempts (user_id, created_at desc);
create index if not exists attempts_session_idx
  on public.attempts (session_id);
create index if not exists attempts_scenario_idx
  on public.attempts (scenario_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists scenarios_set_updated_at on public.scenarios;
create trigger scenarios_set_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_scamlens on auth.users;
create trigger on_auth_user_created_scamlens
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.submit_scam_attempt(
  p_session_id uuid,
  p_user_id uuid,
  p_scenario_id uuid,
  p_answer text,
  p_selected_red_flags jsonb,
  p_is_correct boolean,
  p_response_time_ms integer,
  p_reflection_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_attempt public.attempts%rowtype;
  v_next_count integer;
  v_correct_count integer;
begin
  select *
    into v_session
    from public.sessions
   where id = p_session_id
     and user_id = p_user_id
   for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'SESSION_NOT_FOUND';
  end if;
  if v_session.status <> 'in_progress' then
    raise exception using errcode = 'P0001', message = 'SESSION_COMPLETED';
  end if;
  if v_session.answered_questions >= v_session.total_questions
     or v_session.scenario_ids[v_session.answered_questions + 1] is distinct from p_scenario_id then
    raise exception using errcode = 'P0001', message = 'SCENARIO_OUT_OF_ORDER';
  end if;

  insert into public.attempts (
    session_id,
    user_id,
    scenario_id,
    answer,
    selected_red_flags,
    is_correct,
    response_time_ms,
    reflection_note
  )
  values (
    p_session_id,
    p_user_id,
    p_scenario_id,
    p_answer,
    p_selected_red_flags,
    p_is_correct,
    p_response_time_ms,
    p_reflection_note
  )
  returning * into v_attempt;

  v_next_count := v_session.answered_questions + 1;
  if v_next_count = v_session.total_questions then
    select count(*)::integer
      into v_correct_count
      from public.attempts
     where session_id = p_session_id
       and is_correct;

    update public.sessions
       set answered_questions = v_next_count,
           score = round((v_correct_count * 100.0) / v_session.total_questions)::integer,
           status = 'completed',
           completed_at = now()
     where id = p_session_id
    returning * into v_session;
  else
    update public.sessions
       set answered_questions = v_next_count
     where id = p_session_id
    returning * into v_session;
  end if;

  return jsonb_build_object(
    'attempt', to_jsonb(v_attempt),
    'session', to_jsonb(v_session)
  );
end;
$$;

revoke all on function public.submit_scam_attempt(uuid, uuid, uuid, text, jsonb, boolean, integer, text)
  from public, anon, authenticated;
grant execute on function public.submit_scam_attempt(uuid, uuid, uuid, text, jsonb, boolean, integer, text)
  to service_role;

alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.ai_feedback enable row level security;

revoke all on public.profiles, public.scenarios, public.sessions, public.attempts, public.ai_feedback
  from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select (
  id, title, channel, category, difficulty, sender_name, sender_address,
  subject, body, displayed_url, active
) on public.scenarios to authenticated;
grant select on public.sessions, public.attempts, public.ai_feedback to authenticated;
grant all on public.profiles, public.scenarios, public.sessions, public.attempts, public.ai_feedback
  to service_role;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists profiles_update_own_name on public.profiles;
create policy profiles_update_own_name on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists scenarios_safe_select on public.scenarios;
create policy scenarios_safe_select on public.scenarios
  for select to authenticated
  using (
    active
    or exists (
      select 1
        from public.sessions s
       where s.user_id = (select auth.uid())
         and public.scenarios.id = any(s.scenario_ids)
    )
  );

drop policy if exists sessions_select_own on public.sessions;
create policy sessions_select_own on public.sessions
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists attempts_select_permitted_own on public.attempts;
create policy attempts_select_permitted_own on public.attempts
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1
        from public.sessions s
       where s.id = attempts.session_id
         and s.user_id = (select auth.uid())
         and (s.type = 'training' or s.status = 'completed')
    )
  );

drop policy if exists ai_feedback_select_own_training on public.ai_feedback;
create policy ai_feedback_select_own_training on public.ai_feedback
  for select to authenticated
  using (
    exists (
      select 1
        from public.attempts a
        join public.sessions s on s.id = a.session_id
       where a.id = ai_feedback.attempt_id
         and a.user_id = (select auth.uid())
         and s.user_id = (select auth.uid())
         and s.type = 'training'
    )
  );
