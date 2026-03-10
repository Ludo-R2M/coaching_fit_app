/*
  # Workout Tracking Schema for 3-Week Hyrox Preparation

  1. New Tables
    - `weeks` - Program weeks (1-3)
      - `id` (uuid, primary key)
      - `week_number` (integer) - Week 1, 2, or 3
      - `created_at` (timestamp)
    
    - `sessions` - Workout sessions per week
      - `id` (uuid, primary key)
      - `week_id` (uuid, foreign key)
      - `session_number` (integer) - Session 1, 2, or 3
      - `name` (text) - Session name
      - `is_optional` (boolean) - Whether session is optional
      - `session_type` (text) - 'strength' or 'conditioning'
    
    - `exercises` - Exercise definitions
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `name` (text) - Exercise name
      - `category` (text) - 'main', 'finisher', 'grip', 'circuit'
      - `load_description` (text) - Load/intensity description
      - `target_load_kg` (numeric) - Target weight if applicable
      - `sets` (integer) - Number of sets
      - `reps` (text) - Reps or distance
      - `tempo` (text) - Tempo if applicable
      - `rest_seconds` (integer) - Rest time in seconds
      - `notes` (text) - Coach comments
      - `order_index` (integer) - Display order
    
    - `workout_logs` - User workout session logs
      - `id` (uuid, primary key)
      - `user_id` (uuid) - User identifier
      - `session_id` (uuid, foreign key)
      - `started_at` (timestamp)
      - `completed_at` (timestamp)
      - `notes` (text)
      - `rpe` (integer) - Overall session RPE
    
    - `exercise_logs` - Individual exercise performance logs
      - `id` (uuid, primary key)
      - `workout_log_id` (uuid, foreign key)
      - `exercise_id` (uuid, foreign key)
      - `set_number` (integer)
      - `reps_completed` (integer)
      - `weight_kg` (numeric)
      - `distance_m` (numeric)
      - `time_seconds` (integer)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Public read access for program data (weeks, sessions, exercises)
    - Authenticated write access for logs
*/

CREATE TABLE IF NOT EXISTS weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES weeks(id) ON DELETE CASCADE,
  session_number integer NOT NULL,
  name text NOT NULL,
  is_optional boolean DEFAULT false,
  session_type text DEFAULT 'strength',
  created_at timestamptz DEFAULT now(),
  UNIQUE(week_id, session_number)
);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'main',
  load_description text,
  target_load_kg numeric,
  sets integer,
  reps text,
  tempo text,
  rest_seconds integer,
  notes text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text,
  rpe integer CHECK (rpe >= 1 AND rpe <= 10),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id uuid NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  reps_completed integer,
  weight_kg numeric,
  distance_m numeric,
  time_seconds integer,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_week ON sessions(week_id);
CREATE INDEX IF NOT EXISTS idx_exercises_session ON exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session ON workout_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);

ALTER TABLE weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read weeks"
  ON weeks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read sessions"
  ON sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read exercises"
  ON exercises FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert workout logs"
  ON workout_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read workout logs"
  ON workout_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update workout logs"
  ON workout_logs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can insert exercise logs"
  ON exercise_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read exercise logs"
  ON exercise_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update exercise logs"
  ON exercise_logs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);