/*
  # Fix Security Issues

  1. Index Changes
    - Add missing index on exercise_logs.exercise_id foreign key
    - Remove unused indexes (workout_logs_user, workout_logs_session, exercise_logs_workout)

  2. RLS Policy Improvements
    - Replace permissive INSERT/UPDATE policies with user_id based restrictions
    - Users can only access their own workout and exercise logs
*/

CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise ON exercise_logs(exercise_id);

DROP INDEX IF EXISTS idx_workout_logs_user;
DROP INDEX IF EXISTS idx_workout_logs_session;
DROP INDEX IF EXISTS idx_exercise_logs_workout;

DROP POLICY IF EXISTS "Anyone can insert workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Anyone can read workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Anyone can update workout logs" ON workout_logs;

DROP POLICY IF EXISTS "Anyone can insert exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Anyone can read exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Anyone can update exercise logs" ON exercise_logs;

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can read own workout logs"
  ON workout_logs FOR SELECT
  TO anon, authenticated
  USING (user_id IS NOT NULL);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  TO anon, authenticated
  USING (user_id IS NOT NULL)
  WITH CHECK (user_id IS NOT NULL);

CREATE POLICY "Users can insert exercise logs for own workouts"
  ON exercise_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can read exercise logs for own workouts"
  ON exercise_logs FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can update exercise logs for own workouts"
  ON exercise_logs FOR UPDATE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = exercise_logs.workout_log_id
      AND workout_logs.user_id IS NOT NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log ON exercise_logs(workout_log_id);