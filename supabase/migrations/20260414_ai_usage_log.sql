-- AI usage counter per user per month.
-- Used by the analyze-plant Edge Function to enforce tier quotas server-side.

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL, -- 'YYYY-MM'
  model text NOT NULL CHECK (model IN ('haiku', 'sonnet')),
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, month, model)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON ai_usage_log(user_id, month);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage (to show "X/Y remaining" in UI)
CREATE POLICY "Users can view own ai usage"
  ON ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT / UPDATE / DELETE. Only Edge Functions (service role) write here.
-- Intentionally no INSERT/UPDATE/DELETE policies for authenticated role.

-- Helper: atomic increment (call from Edge Function with service role).
-- Returns the new count after incrementing.
CREATE OR REPLACE FUNCTION increment_ai_usage(
  p_user_id uuid,
  p_month text,
  p_model text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  INSERT INTO ai_usage_log (user_id, month, model, count, updated_at)
  VALUES (p_user_id, p_month, p_model, 1, now())
  ON CONFLICT (user_id, month, model)
  DO UPDATE SET count = ai_usage_log.count + 1, updated_at = now()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION increment_ai_usage(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION increment_ai_usage(uuid, text, text) FROM anon, authenticated;
-- service_role keeps access implicitly.
