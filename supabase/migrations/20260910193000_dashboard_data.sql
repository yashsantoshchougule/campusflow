-- Personal dashboard records. Existing project tables are preserved by IF NOT EXISTS.
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, type text, minimum_attendance_percentage numeric check (minimum_attendance_percentage between 1 and 100), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null, day text not null check (day in ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time time not null, end_time time not null, type text, location text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_time > start_time)
);
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text, description text, due_at timestamptz, status text not null default 'pending', completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.examinations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text, starts_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null, date date not null, status text not null check (status in ('present','absent','late')), remarks text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, subject, date)
);
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text, priority text not null default 'normal', important boolean not null default false, deadline timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, subject text, description text, priority text not null default 'medium', due_at timestamptz, scheduled_for date, estimated_minutes integer, completed boolean not null default false, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject text, started_at timestamptz not null default now(), duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  study_task_id uuid references public.study_tasks(id) on delete cascade, title text not null, remind_at timestamptz not null, completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.subjects add column if not exists type text;
alter table public.subjects add column if not exists minimum_attendance_percentage numeric;
alter table public.timetable_entries add column if not exists subject text;
alter table public.timetable_entries add column if not exists day text;
alter table public.timetable_entries add column if not exists start_time time;
alter table public.timetable_entries add column if not exists end_time time;
alter table public.timetable_entries add column if not exists type text;
alter table public.timetable_entries add column if not exists location text;
alter table public.assignments add column if not exists subject text;
alter table public.assignments add column if not exists description text;
alter table public.assignments add column if not exists due_at timestamptz;
alter table public.assignments add column if not exists status text not null default 'pending';
alter table public.assignments add column if not exists completed boolean not null default false;
alter table public.assignments add column if not exists completed_at timestamptz;
alter table public.assignments add column if not exists created_by uuid references auth.users(id) default auth.uid();
alter table public.assignments add column if not exists visibility text not null default 'personal';
alter table public.assignments add column if not exists source_type text not null default 'student';
alter table public.assignments add column if not exists verification_status text not null default 'verified';
alter table public.assignments add column if not exists assigned_at timestamptz not null default now();
alter table public.examinations add column if not exists title text;
alter table public.examinations add column if not exists subject text;
alter table public.examinations add column if not exists starts_at timestamptz;
alter table public.attendance_records add column if not exists subject text;
alter table public.attendance_records add column if not exists date date;
alter table public.attendance_records add column if not exists status text;
alter table public.attendance_records add column if not exists remarks text;
alter table public.attendance_records add column if not exists subject_id uuid references public.subjects(id);
alter table public.attendance_records add column if not exists class_date date;
alter table public.attendance_records add column if not exists class_start_time time;
alter table public.attendance_records add column if not exists source_type text not null default 'student';
alter table public.attendance_records add column if not exists verification_status text not null default 'verified';
alter table public.attendance_records add column if not exists recorded_by uuid references auth.users(id) default auth.uid();
alter table public.notices add column if not exists title text;
alter table public.notices add column if not exists body text;
alter table public.notices add column if not exists priority text not null default 'normal';
alter table public.notices add column if not exists important boolean not null default false;
alter table public.notices add column if not exists deadline timestamptz;
alter table public.study_tasks add column if not exists subject text;
alter table public.study_tasks add column if not exists description text;
alter table public.study_tasks add column if not exists priority text not null default 'medium';
alter table public.study_tasks add column if not exists due_at timestamptz;
alter table public.study_tasks add column if not exists scheduled_for date;
alter table public.study_tasks add column if not exists estimated_minutes integer;
alter table public.study_tasks add column if not exists completed boolean not null default false;
alter table public.study_tasks add column if not exists completed_at timestamptz;
alter table public.study_sessions add column if not exists subject text;
alter table public.study_sessions add column if not exists started_at timestamptz not null default now();
alter table public.study_sessions add column if not exists duration_minutes integer;
alter table public.reminders add column if not exists study_task_id uuid references public.study_tasks(id) on delete cascade;
alter table public.reminders add column if not exists title text;
alter table public.reminders add column if not exists remind_at timestamptz;
alter table public.reminders add column if not exists completed boolean not null default false;
alter table public.reminders add column if not exists scheduled_at timestamptz;
alter table public.reminders add column if not exists source_entity_type text;
alter table public.reminders add column if not exists source_entity_id uuid;

-- Keep CampusFlow's existing academic schema and add the student-origin value
-- required by the authenticated quick-attendance endpoint.
alter table public.attendance_records drop constraint if exists attendance_records_source_type_check;
alter table public.attendance_records add constraint attendance_records_source_type_check
  check (source_type in ('student', 'faculty', 'system_import', 'notice_extraction'));

-- Existing personal records use these ownership columns already.
alter table public.timetable_entries add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.assignments add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.examinations add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.notices add column if not exists user_id uuid references auth.users(id) on delete cascade;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'timetable_entries' and column_name = 'owner_user_id') then
    execute 'update public.timetable_entries set user_id = owner_user_id where user_id is null and owner_user_id is not null';
  end if;
end $$;
update public.assignments set user_id = created_by where user_id is null and visibility = 'personal';

-- Add the ownership/timestamp columns when an equivalent table pre-dates this migration.
do $$
declare table_name text;
begin
  foreach table_name in array array['timetable_entries','assignments','examinations','attendance_records','notices','study_tasks','study_sessions','reminders'] loop
    execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade', table_name);
    execute format('alter table public.%I add column if not exists created_at timestamptz not null default now()', table_name);
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', table_name);
    execute format('create index if not exists %I on public.%I (user_id)', table_name || '_user_id_idx', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists dashboard_own_select on public.%I', table_name);
    execute format('drop policy if exists dashboard_own_insert on public.%I', table_name);
    execute format('drop policy if exists dashboard_own_update on public.%I', table_name);
    execute format('drop policy if exists dashboard_own_delete on public.%I', table_name);
    execute format('create policy dashboard_own_select on public.%I for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name);
    execute format('create policy dashboard_own_insert on public.%I for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name);
    execute format('create policy dashboard_own_update on public.%I for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name);
    execute format('create policy dashboard_own_delete on public.%I for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)', table_name);
  end loop;
end $$;

-- A fresh CampusFlow database gets personal subjects; the current project keeps
-- its existing shared subject catalogue and enrolment-based RLS policies.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'subjects' and column_name = 'user_id') then
    alter table public.subjects enable row level security;
    revoke all on public.subjects from anon;
    grant select, insert, update, delete on public.subjects to authenticated;
    drop policy if exists dashboard_own_select on public.subjects;
    drop policy if exists dashboard_own_insert on public.subjects;
    drop policy if exists dashboard_own_update on public.subjects;
    drop policy if exists dashboard_own_delete on public.subjects;
    create policy dashboard_own_select on public.subjects for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
    create policy dashboard_own_insert on public.subjects for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
    create policy dashboard_own_update on public.subjects for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id) with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
    create policy dashboard_own_delete on public.subjects for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
  end if;
end $$;
