export interface Week {
  id: string;
  week_number: number;
  created_at: string;
}

export interface Session {
  id: string;
  week_id: string;
  session_number: number;
  name: string;
  is_optional: boolean;
  session_type: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  session_id: string;
  name: string;
  category: string;
  load_description: string | null;
  target_load_kg: number | null;
  sets: number | null;
  reps: string | null;
  tempo: string | null;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  created_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  session_id: string;
  started_at: string;
  completed_at: string | null;
  notes: string | null;
  rpe: number | null;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  weight_kg: number | null;
  distance_m: number | null;
  time_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface SessionWithExercises extends Session {
  exercises: Exercise[];
}

export interface WeekWithSessions extends Week {
  sessions: SessionWithExercises[];
}
