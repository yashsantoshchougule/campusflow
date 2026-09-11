-- CampusFlow final shared data layer. This migration extends the existing
-- student schema; it does not create a second database or copy existing data.
create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null;
end $$;

create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists branch text,
  add column if not exists year text,
  add column if not exists division text,
  add column if not exists academic_status text,
  add column if not exists atkt_status text,
  add column if not exists avatar_path text,
  add column if not exists preferred_language text not null default 'English' check (preferred_language in ('English', 'Hindi', 'Marathi'));
alter table public.study_preferences
  add column if not exists attendance_target_percent numeric not null default 75 check (attendance_target_percent between 1 and 100);

create or replace function private.has_role(expected_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.user_roles
      where user_id = (select auth.uid()) and role = expected_role
    );
$$;

revoke all on function private.has_role(public.app_role) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;

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

-- Normal registration is student-only. The trigger never reads user_metadata
-- for authorization; full_name is only a display value.
create or replace function private.create_student_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_student_account() from public;
drop trigger if exists campusflow_create_student_account on auth.users;
create trigger campusflow_create_student_account
  after insert on auth.users
  for each row execute function private.create_student_account();

insert into public.user_roles (user_id, role)
select id, 'student' from auth.users
on conflict (user_id) do nothing;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  language text not null default 'English' check (language in ('English', 'Hindi', 'Marathi')),
  allow_study_ai_uploaded_materials boolean not null default true,
  confirm_before_data_save boolean not null default true,
  privacy_source text not null default 'student' check (privacy_source = 'student'),
  privacy_updated_at timestamptz not null default now(),
  calendar_preferences jsonb not null default '{"view":"month","filters":{"eventTypes":[],"includeCompletedReminders":false}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  assignment_reminder_hours integer not null default 48 check (assignment_reminder_hours between 1 and 720),
  exam_reminder_days integer not null default 3 check (exam_reminder_days between 1 and 60),
  lecture_reminder_minutes integer not null default 30 check (lecture_reminder_minutes between 1 and 1440),
  attendance_alerts boolean not null default true,
  notice_alerts boolean not null default true,
  atkt_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stable_source_key text not null,
  status text not null check (status in ('unread', 'read', 'dismissed')),
  read_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stable_source_key)
);

-- Existing Academic Management tables are extended to the actual application
-- models. Legacy dashboard columns remain only for backwards compatibility.
alter table public.subjects
  add column if not exists code text,
  add column if not exists faculty_name text not null default '',
  add column if not exists credits smallint not null default 0 check (credits between 0 and 60),
  add column if not exists difficulty text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  add column if not exists strength_level text not null default 'Average' check (strength_level in ('Strong', 'Average', 'Weak')),
  add column if not exists attendance_target numeric not null default 75 check (attendance_target between 1 and 100),
  add column if not exists colour text not null default '#2563EB';

alter table public.assignments
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists deadline timestamptz,
  add column if not exists estimated_minutes integer not null default 30 check (estimated_minutes between 1 and 10080),
  add column if not exists difficulty text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  add column if not exists priority_label text not null default 'Medium' check (priority_label in ('Low', 'Medium', 'High')),
  add column if not exists attachment jsonb,
  add column if not exists completed_at timestamptz;

alter table public.timetable_entries
  add column if not exists subject_id uuid references public.subjects(id) on delete cascade,
  add column if not exists day_of_week text check (day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  add column if not exists faculty_name text not null default '',
  add column if not exists classroom text not null default '',
  add column if not exists online_link text not null default '',
  add column if not exists lecture_type text not null default '';

alter table public.examinations
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists name text,
  add column if not exists examination_type text not null default '',
  add column if not exists exam_date timestamptz,
  add column if not exists topics text not null default '',
  add column if not exists room text not null default '',
  add column if not exists preparation_progress integer not null default 0 check (preparation_progress between 0 and 100),
  add column if not exists study_plan_id uuid;

alter table public.attendance_records
  add column if not exists timetable_entry_id uuid references public.timetable_entries(id) on delete set null;
alter table public.attendance_records
  drop constraint if exists attendance_records_status_check;
alter table public.attendance_records
  add constraint attendance_records_status_check check (status in ('present', 'absent', 'cancelled', 'late'));

create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('draft', 'active', 'needs_recovery', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.study_plans drop constraint if exists study_plans_status_check;
alter table public.study_plans add constraint study_plans_status_check check (status in ('draft', 'active', 'needs_recovery', 'completed', 'archived'));

alter table public.study_sessions
  add column if not exists study_plan_id uuid references public.study_plans(id) on delete set null,
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists assignment_id uuid references public.assignments(id) on delete set null,
  add column if not exists examination_id uuid references public.examinations(id) on delete set null,
  add column if not exists title text,
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  add column if not exists difficulty smallint check (difficulty is null or difficulty between 1 and 5),
  add column if not exists priority text check (priority is null or priority in ('high', 'medium', 'low')),
  add column if not exists locked boolean not null default false,
  add column if not exists reason text,
  add column if not exists replaces_session_id uuid,
  add column if not exists invalid boolean not null default false,
  add column if not exists invalid_reason text,
  add column if not exists status text not null default 'scheduled';
alter table public.study_sessions drop constraint if exists study_sessions_status_check;
alter table public.study_sessions add constraint study_sessions_status_check check (status in ('scheduled', 'active', 'completed', 'missed', 'rescheduled', 'cancelled'));

alter table public.reminders
  add column if not exists description text,
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists linked_entity_type text,
  add column if not exists linked_entity_id uuid,
  add column if not exists reminder_at timestamptz,
  add column if not exists status text not null default 'active' check (status in ('active', 'completed')),
  add column if not exists completed_at timestamptz;

create table if not exists public.reminder_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id uuid not null references public.reminders(id) on delete cascade,
  status text not null check (status in ('active', 'completed')),
  occurred_at timestamptz not null default now()
);

create table if not exists public.note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.note_folders(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  content text,
  note_type text not null default 'text' check (note_type in ('text', 'file')),
  text_content text not null default '',
  file_name text,
  file_type text,
  file_size bigint,
  file_path text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_module text not null,
  source_id uuid,
  file_name text not null,
  mime_type text not null,
  storage_bucket text not null default 'student-documents',
  storage_path text not null,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_bucket, storage_path)
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  pinned boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.todo_subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  todo_id uuid not null references public.todos(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notice_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('image_upload', 'pdf_upload', 'camera_capture')),
  file_name text not null,
  mime_type text not null,
  file_hash text not null,
  storage_path text not null,
  page_count integer check (page_count is null or page_count > 0),
  extracted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, file_hash)
);

alter table public.notices
  add column if not exists source_id uuid references public.notice_sources(id) on delete cascade,
  add column if not exists raw_text text not null default '',
  add column if not exists detected_deadlines jsonb not null default '[]'::jsonb,
  add column if not exists fields jsonb not null default '{}'::jsonb,
  add column if not exists original_extraction jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'draft' check (status in ('draft', 'confirmed', 'archived')),
  add column if not exists version integer not null default 1 check (version > 0);

create table if not exists public.notice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_id uuid not null references public.notices(id) on delete cascade,
  version integer not null check (version > 0),
  action text not null check (action in ('extracted', 'edited', 'confirmed', 'linked')),
  summary text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.notice_action_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_id uuid not null references public.notices(id) on delete cascade,
  type text not null check (type in ('task', 'reminder', 'atkt_application')),
  target_id uuid not null,
  details jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, notice_id, type)
);
create table if not exists public.student_academic_contexts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  course text not null default '',
  branch text not null default '',
  year text not null default '',
  semester text not null default '',
  division text not null default '',
  academic_status text not null default '',
  atkt_status text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.atkt_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notice_id uuid references public.notices(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  deadline timestamptz,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'under_review', 'confirmed', 'approved', 'rejected', 'changes_requested')),
  correction_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.atkt_applications
  add column if not exists subject_id uuid references public.subjects(id) on delete set null,
  add column if not exists description text,
  add column if not exists deadline timestamptz;
alter table public.atkt_applications drop constraint if exists atkt_applications_status_check;
alter table public.atkt_applications add constraint atkt_applications_status_check check (status in ('draft', 'submitted', 'under_review', 'confirmed', 'approved', 'rejected', 'changes_requested'));
create table if not exists public.atkt_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.atkt_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.local_data_imports (
  user_id uuid primary key references auth.users(id) on delete cascade,
  imported_at timestamptz not null default now(),
  source_version smallint not null default 1 check (source_version = 1)
);

-- AI answers, materials, quizzes, attempts, schedules and document extraction
-- statuses retain their existing feature shapes in the JSON payload.
create table if not exists public.ai_history (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('answer', 'material', 'quiz', 'attempt', 'schedule', 'document_status')),
  subject_id uuid references public.subjects(id) on delete set null,
  document_id uuid,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_document_chunks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null,
  content text not null,
  page_number integer,
  section_title text,
  chunk_order integer not null check (chunk_order >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, document_id, chunk_order)
);

create table if not exists public.teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  subject_code text not null,
  course text,
  department text,
  semester smallint check (semester is null or semester between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, subject_code, course, department, semester)
);

create or replace function private.teacher_has_subject(expected_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from public.teacher_subjects
      where teacher_id = (select auth.uid()) and subject_code = expected_code
    );
$$;
revoke all on function private.teacher_has_subject(text) from public;
grant execute on function private.teacher_has_subject(text) to authenticated;

create table if not exists public.academic_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  subject_code text not null,
  title text not null,
  description text not null default '',
  target_course text not null,
  target_department text not null,
  target_semester smallint not null check (target_semester between 1 and 20),
  status text not null default 'draft' check (status in ('draft', 'published')),
  storage_bucket text not null default 'academic-notes' check (storage_bucket = 'academic-notes'),
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function private.can_read_academic_note(expected_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.academic_notes note
    join public.profiles profile on profile.id = (select auth.uid())
    join public.subjects subject on subject.user_id = (select auth.uid()) and subject.code = note.subject_code
    where note.storage_path = expected_path
      and note.status = 'published'
      and profile.course = note.target_course
      and profile.department = note.target_department
      and profile.semester = note.target_semester
  );
$$;
revoke all on function private.can_read_academic_note(text) from public;
grant execute on function private.can_read_academic_note(text) to authenticated;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes match real list/filter access paths.
create index if not exists subjects_user_code_idx on public.subjects (user_id, code);
create index if not exists assignments_user_deadline_idx on public.assignments (user_id, deadline);
create index if not exists examinations_user_date_idx on public.examinations (user_id, exam_date);
create index if not exists timetable_entries_user_day_idx on public.timetable_entries (user_id, day_of_week, start_time);
create index if not exists attendance_records_user_subject_date_idx on public.attendance_records (user_id, subject_id, date);
create index if not exists reminders_user_time_idx on public.reminders (user_id, reminder_at);
create index if not exists notices_user_updated_idx on public.notices (user_id, updated_at desc);
create index if not exists ai_history_user_kind_idx on public.ai_history (user_id, kind, created_at desc);
create index if not exists ai_document_chunks_user_document_idx on public.ai_document_chunks (user_id, document_id, chunk_order);
create index if not exists academic_notes_audience_idx on public.academic_notes (status, subject_code, target_course, target_department, target_semester);
create index if not exists teacher_subjects_teacher_code_idx on public.teacher_subjects (teacher_id, subject_code);

-- Existing retained pages use authenticated client inserts. A database default
-- makes those inserts owned by the caller without trusting a client-supplied ID.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'user_settings', 'notification_preferences', 'notification_states',
    'subjects', 'assignments', 'timetable_entries', 'examinations', 'attendance_records',
    'study_plans', 'study_sessions', 'reminders', 'reminder_history', 'note_folders',
    'notes', 'documents', 'todos', 'todo_subtasks', 'notice_sources', 'notices',
    'notice_history', 'notice_action_links', 'student_academic_contexts',
    'atkt_applications', 'atkt_status_history', 'ai_history', 'ai_document_chunks',
    'chat_sessions', 'chat_messages', 'local_data_imports'
  ] loop
    execute format('alter table public.%I alter column user_id set default auth.uid()', table_name);
  end loop;
end $$;

-- Keep old timetable client calls on the canonical table without duplicating
-- rows. The view runs with the caller's RLS rules.
do $$
begin
  if to_regclass('public.studybuddy_timetable_entries') is null then
    execute 'create view public.studybuddy_timetable_entries with (security_invoker = true) as select * from public.timetable_entries';
  end if;
end $$;

-- Every personal table gets explicit grants, RLS, and four ownership policies.
do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'user_settings', 'notification_preferences', 'notification_states',
    'subjects', 'assignments', 'timetable_entries', 'examinations',
    'attendance_records', 'study_plans', 'study_sessions', 'reminders',
    'reminder_history', 'note_folders', 'notes', 'documents', 'todos',
    'todo_subtasks', 'notice_sources', 'notices', 'notice_history',
    'notice_action_links', 'student_academic_contexts', 'atkt_applications',
    'atkt_status_history', 'ai_history', 'ai_document_chunks',
    'chat_sessions', 'chat_messages', 'local_data_imports'
  ] loop
    for policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = table_name loop
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    end loop;
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', 'campusflow_' || table_name || '_select_own', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', 'campusflow_' || table_name || '_insert_own', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', 'campusflow_' || table_name || '_update_own', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', 'campusflow_' || table_name || '_delete_own', table_name);
  end loop;
end $$;

-- Profiles and preferences use their primary key as the ownership column.
do $$
declare policy_name text;
begin
  foreach policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles' loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
  foreach policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = 'study_preferences' loop
    execute format('drop policy if exists %I on public.study_preferences', policy_name);
  end loop;
  foreach policy_name in select policyname from pg_policies where schemaname = 'public' and tablename = 'user_roles' loop
    execute format('drop policy if exists %I on public.user_roles', policy_name);
  end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.study_preferences enable row level security;
alter table public.user_roles enable row level security;
revoke all on public.profiles, public.study_preferences, public.user_roles from anon, authenticated;
grant select, insert, update on public.profiles, public.study_preferences to authenticated;
grant select on public.user_roles to authenticated;
create policy campusflow_profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy campusflow_profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy campusflow_profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy campusflow_study_preferences_select_own on public.study_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy campusflow_study_preferences_insert_own on public.study_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy campusflow_study_preferences_update_own on public.study_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy campusflow_user_roles_select_own on public.user_roles for select to authenticated using ((select auth.uid()) = user_id);

-- Only admins assign teachers to subject codes. Teachers can read only their
-- own assignments; student clients have no access to this table.
alter table public.teacher_subjects enable row level security;
revoke all on public.teacher_subjects from anon, authenticated;
grant select on public.teacher_subjects to authenticated;
drop policy if exists campusflow_teacher_subjects_select on public.teacher_subjects;
create policy campusflow_teacher_subjects_select on public.teacher_subjects
  for select to authenticated
  using (teacher_id = (select auth.uid()) or private.has_role('admin'));

-- Teachers manage only their notes for subject codes assigned by an admin.
-- Students can read only matching published notes. Admins can moderate all.
alter table public.academic_notes enable row level security;
revoke all on public.academic_notes from anon, authenticated;
grant select, insert, update, delete on public.academic_notes to authenticated;
drop policy if exists campusflow_academic_notes_select on public.academic_notes;
drop policy if exists campusflow_academic_notes_insert on public.academic_notes;
drop policy if exists campusflow_academic_notes_update on public.academic_notes;
drop policy if exists campusflow_academic_notes_delete on public.academic_notes;
create policy campusflow_academic_notes_select on public.academic_notes
  for select to authenticated
  using (
    teacher_id = (select auth.uid())
    or private.has_role('admin')
    or (
      status = 'published'
      and exists (
        select 1 from public.profiles profile
        where profile.id = (select auth.uid())
          and profile.course = target_course
          and profile.department = target_department
          and profile.semester = target_semester
      )
      and exists (
        select 1 from public.subjects subject
        where subject.user_id = (select auth.uid())
          and subject.code = academic_notes.subject_code
      )
    )
  );
create policy campusflow_academic_notes_insert on public.academic_notes
  for insert to authenticated
  with check (
    (teacher_id = (select auth.uid()) and private.has_role('teacher') and private.teacher_has_subject(subject_code))
    or private.has_role('admin')
  );
create policy campusflow_academic_notes_update on public.academic_notes
  for update to authenticated
  using (
    (teacher_id = (select auth.uid()) and private.has_role('teacher'))
    or private.has_role('admin')
  )
  with check (
    (teacher_id = (select auth.uid()) and private.has_role('teacher') and private.teacher_has_subject(subject_code))
    or private.has_role('admin')
  );
create policy campusflow_academic_notes_delete on public.academic_notes
  for delete to authenticated
  using (
    (teacher_id = (select auth.uid()) and private.has_role('teacher'))
    or private.has_role('admin')
  );

-- Reminder history is written in the same transaction as a status change.
create or replace function public.record_reminder_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'insert' or new.status is distinct from old.status then
    insert into public.reminder_history (user_id, reminder_id, status)
    values (new.user_id, new.id, new.status);
  end if;
  return new;
end;
$$;
drop trigger if exists campusflow_reminder_history on public.reminders;
create trigger campusflow_reminder_history
  after insert or update of status on public.reminders
  for each row execute function public.record_reminder_history();

-- Keep all mutable records timestamped without client-controlled updated_at.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'user_roles', 'study_preferences', 'user_settings',
    'notification_preferences', 'notification_states', 'subjects', 'assignments',
    'timetable_entries', 'examinations', 'attendance_records', 'study_plans',
    'study_sessions', 'reminders', 'note_folders', 'notes', 'documents', 'todos',
    'todo_subtasks', 'notices', 'student_academic_contexts', 'atkt_applications',
    'ai_history', 'teacher_subjects', 'academic_notes', 'chat_sessions', 'local_data_imports'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'campusflow_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'campusflow_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

revoke all on function public.set_updated_at() from public;
revoke all on function public.record_reminder_history() from public;

-- Private buckets and matching object policies. File bytes never go into tables.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('student-documents', 'student-documents', false, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'text/markdown']),
  ('academic-notes', 'academic-notes', false, 52428800, array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists campusflow_avatars_select on storage.objects;
drop policy if exists campusflow_avatars_insert on storage.objects;
drop policy if exists campusflow_avatars_update on storage.objects;
drop policy if exists campusflow_avatars_delete on storage.objects;
create policy campusflow_avatars_select on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_avatars_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists campusflow_student_documents_select on storage.objects;
drop policy if exists campusflow_student_documents_insert on storage.objects;
drop policy if exists campusflow_student_documents_update on storage.objects;
drop policy if exists campusflow_student_documents_delete on storage.objects;
create policy campusflow_student_documents_select on storage.objects for select to authenticated
  using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_student_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_student_documents_update on storage.objects for update to authenticated
  using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy campusflow_student_documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'student-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists campusflow_academic_notes_select on storage.objects;
drop policy if exists campusflow_academic_notes_insert on storage.objects;
drop policy if exists campusflow_academic_notes_update on storage.objects;
drop policy if exists campusflow_academic_notes_delete on storage.objects;
create policy campusflow_academic_notes_select on storage.objects for select to authenticated
  using (
    bucket_id = 'academic-notes'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or private.has_role('admin')
      or private.can_read_academic_note(name)
    )
  );
create policy campusflow_academic_notes_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'academic-notes'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) and private.has_role('teacher') or private.has_role('admin'))
  );
create policy campusflow_academic_notes_update on storage.objects for update to authenticated
  using (
    bucket_id = 'academic-notes'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) and private.has_role('teacher') or private.has_role('admin'))
  )
  with check (
    bucket_id = 'academic-notes'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) and private.has_role('teacher') or private.has_role('admin'))
  );
create policy campusflow_academic_notes_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'academic-notes'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) and private.has_role('teacher') or private.has_role('admin'))
  );
