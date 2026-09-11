-- Fix #1: restrict profile SELECT to owner only
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Fix #2: per-user Google Calendar state
CREATE TABLE public.user_google_calendar (
  user_id uuid PRIMARY KEY,
  tokens jsonb,
  synced jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_google_calendar TO authenticated;
GRANT ALL ON public.user_google_calendar TO service_role;

ALTER TABLE public.user_google_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own google calendar"
ON public.user_google_calendar FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own google calendar"
ON public.user_google_calendar FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own google calendar"
ON public.user_google_calendar FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own google calendar"
ON public.user_google_calendar FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER set_user_google_calendar_updated_at
BEFORE UPDATE ON public.user_google_calendar
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
