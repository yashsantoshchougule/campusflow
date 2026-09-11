alter table public.study_preferences drop constraint if exists study_preferences_user_id_fkey;
alter table public.study_preferences add constraint study_preferences_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
