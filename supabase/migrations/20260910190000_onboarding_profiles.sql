create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  student_id text,
  college_name text,
  course text,
  department text,
  semester smallint,
  minimum_attendance_percentage numeric not null default 75 check (minimum_attendance_percentage between 1 and 100),
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists student_id text,
  add column if not exists course text,
  add column if not exists department text,
  add column if not exists semester smallint,
  add column if not exists avatar_url text;

create table if not exists public.study_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_study_start time,
  preferred_study_end time,
  session_duration_minutes smallint not null default 45,
  break_duration_minutes smallint not null default 10,
  strong_subjects text[] not null default '{}',
  weak_subjects text[] not null default '{}',
  language text not null default 'English',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (language in ('English', 'Hindi', 'Marathi'))
);

alter table public.study_preferences
  add column if not exists preferred_study_start time,
  add column if not exists preferred_study_end time,
  add column if not exists session_duration_minutes smallint not null default 45,
  add column if not exists break_duration_minutes smallint not null default 10,
  add column if not exists strong_subjects text[] not null default '{}',
  add column if not exists weak_subjects text[] not null default '{}',
  add column if not exists language text not null default 'English';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_semester_range') then
    alter table public.profiles add constraint profiles_semester_range check (semester is null or semester between 1 and 20);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'study_preferences_language_check') then
    alter table public.study_preferences add constraint study_preferences_language_check check (language in ('English', 'Hindi', 'Marathi'));
  end if;
end $$;

alter table public.profiles enable row level security;
alter table public.study_preferences enable row level security;

revoke all on public.profiles from anon;
revoke all on public.study_preferences from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.study_preferences to authenticated;

drop policy if exists "profiles are visible to their owner" on public.profiles;
drop policy if exists "profiles are editable by their owner" on public.profiles;
drop policy if exists "onboarding profiles select own" on public.profiles;
drop policy if exists "onboarding profiles insert own" on public.profiles;
drop policy if exists "onboarding profiles update own" on public.profiles;
create policy "onboarding profiles select own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "onboarding profiles insert own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "onboarding profiles update own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "preferences are visible to their owner" on public.study_preferences;
drop policy if exists "preferences are created by their owner" on public.study_preferences;
drop policy if exists "preferences are editable by their owner" on public.study_preferences;
drop policy if exists "onboarding preferences select own" on public.study_preferences;
drop policy if exists "onboarding preferences insert own" on public.study_preferences;
drop policy if exists "onboarding preferences update own" on public.study_preferences;
create policy "onboarding preferences select own" on public.study_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "onboarding preferences insert own" on public.study_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "onboarding preferences update own" on public.study_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "onboarding avatars select own" on storage.objects;
drop policy if exists "onboarding avatars insert own" on storage.objects;
drop policy if exists "onboarding avatars update own" on storage.objects;
drop policy if exists "onboarding avatars delete own" on storage.objects;
create policy "onboarding avatars select own" on storage.objects for select to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "onboarding avatars insert own" on storage.objects for insert to authenticated with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "onboarding avatars update own" on storage.objects for update to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "onboarding avatars delete own" on storage.objects for delete to authenticated using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
