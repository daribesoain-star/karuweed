-- Watering & feeding log table
CREATE TABLE IF NOT EXISTS watering_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL DEFAULT 'water' CHECK (type IN ('water', 'feed', 'foliar', 'flush')),
  amount_ml integer,
  ph_level numeric(3,1),
  ec_level numeric(4,2),
  nutrients jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watering_logs_plant ON watering_logs(plant_id);
CREATE INDEX IF NOT EXISTS idx_watering_logs_user ON watering_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_watering_logs_date ON watering_logs(date DESC);

-- RLS
ALTER TABLE watering_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watering logs"
  ON watering_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watering logs"
  ON watering_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watering logs"
  ON watering_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watering logs"
  ON watering_logs FOR DELETE
  USING (auth.uid() = user_id);
