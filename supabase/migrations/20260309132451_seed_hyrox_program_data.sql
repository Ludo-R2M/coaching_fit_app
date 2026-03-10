/*
  # Seed Hyrox 3-Week Program Data

  Populates the database with Ludovic's Hyrox preparation program:
  - 3 weeks of training
  - 2-3 sessions per week
  - Detailed exercises with load, sets, reps, tempo, rest, and notes
*/

INSERT INTO weeks (id, week_number) VALUES
  ('11111111-1111-1111-1111-111111111111', 1),
  ('22222222-2222-2222-2222-222222222222', 2),
  ('33333333-3333-3333-3333-333333333333', 3);

INSERT INTO sessions (id, week_id, session_number, name, is_optional, session_type) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'Lower Body Strength', false, 'strength'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 2, 'Upper Body Strength', false, 'strength'),
  ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 3, 'Technical Conditioning', true, 'conditioning'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, 'Lower Body Strength', false, 'strength'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 2, 'Upper Body Strength', false, 'strength'),
  ('b3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 3, 'Zone 2 Cardio', true, 'conditioning'),
  ('c1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1, 'Lower Body Strength', false, 'strength'),
  ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 2, 'Upper Body Strength', false, 'strength'),
  ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 3, 'Mixed Conditioning', true, 'conditioning');

INSERT INTO exercises (session_id, name, category, load_description, target_load_kg, sets, reps, tempo, rest_seconds, notes, order_index) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Back Squat', 'main', '75/80% RM Theo', 85, 5, '5', NULL, 150, 'Controle du mouvement', 1),
  ('a1111111-1111-1111-1111-111111111111', 'Romanian DB Deadlift', 'main', 'RPE 7/8', NULL, 4, '6', '3/1/1/1', 90, 'Bien controler la phase excentrique', 2),
  ('a1111111-1111-1111-1111-111111111111', 'Walking Lunges DB', 'main', '2 DB de 15 a 20 kg', 17.5, 3, '20m', NULL, 90, NULL, 3),
  ('a1111111-1111-1111-1111-111111111111', 'Farmer Carry', 'main', 'KB 28-32 ou Barre', 30, 4, '40m', NULL, 90, NULL, 4),
  ('a1111111-1111-1111-1111-111111111111', '500m Ski Erg', 'finisher', NULL, NULL, 4, '500m', NULL, 60, NULL, 5),
  ('a1111111-1111-1111-1111-111111111111', 'Dead Hang', 'grip', '1 ou 2 bras', NULL, 3, 'Max temps', NULL, NULL, NULL, 6),

  ('a2222222-2222-2222-2222-222222222222', 'Bench Press', 'main', '75/80% RM Theo', 80, 5, '5', NULL, 150, 'Controle de la descente', 1),
  ('a2222222-2222-2222-2222-222222222222', 'Developpe Militaire', 'main', 'RPE 7/8', NULL, 3, '8', NULL, 90, NULL, 2),
  ('a2222222-2222-2222-2222-222222222222', 'Rowing Barre', 'main', 'RPE 7/8', NULL, 4, '6', NULL, 90, NULL, 3),
  ('a2222222-2222-2222-2222-222222222222', 'Sled Push', 'main', '70% charge officielle', NULL, 6, '20m', NULL, 90, 'Focus sensation technique', 4),
  ('a2222222-2222-2222-2222-222222222222', 'Wall Ball', 'main', '9 kg', 9, 3, '15-20', NULL, 90, 'Focus profondeur et extension', 5),

  ('a3333333-3333-3333-3333-333333333333', '800m Run', 'circuit', 'Leger et fluide', NULL, 3, '800m', NULL, NULL, 'Seance technique - Sans exploser', 1),
  ('a3333333-3333-3333-3333-333333333333', 'Wall Ball', 'circuit', '6 kg', 6, 3, '20', NULL, NULL, NULL, 2),
  ('a3333333-3333-3333-3333-333333333333', 'Sled Pull', 'circuit', '70%', NULL, 3, '20m', NULL, NULL, NULL, 3),
  ('a3333333-3333-3333-3333-333333333333', 'Burpee Broad Jump', 'circuit', NULL, NULL, 3, '15', NULL, NULL, NULL, 4),

  ('b1111111-1111-1111-1111-111111111111', 'Back Squat', 'main', '75/80% RM Theo', 85, 5, '5', NULL, 150, 'Controle du mouvement', 1),
  ('b1111111-1111-1111-1111-111111111111', 'Deadlift Barre/Trap Bar', 'main', 'RPE 7/8', 65, 4, '6-8', NULL, 90, NULL, 2),
  ('b1111111-1111-1111-1111-111111111111', 'Sled Push Lourd', 'main', '110-120% charge off', NULL, 4, '20m', NULL, 120, NULL, 3),
  ('b1111111-1111-1111-1111-111111111111', 'Farmer Carry', 'main', 'KB 28-32 ou Barre', 30, 4, '40m', NULL, 90, NULL, 4),
  ('b1111111-1111-1111-1111-111111111111', '500m Row', 'finisher', NULL, NULL, 4, '500m', NULL, 60, NULL, 5),
  ('b1111111-1111-1111-1111-111111111111', 'Dead Hang', 'grip', '1 ou 2 bras', NULL, 3, 'Max temps', NULL, NULL, NULL, 6),

  ('b2222222-2222-2222-2222-222222222222', 'Bench Press', 'main', '75/80% RM Theo', 80, 5, '5', NULL, 150, 'Controle de la descente', 1),
  ('b2222222-2222-2222-2222-222222222222', 'Developpe Militaire', 'main', 'RPE 7/8', NULL, 3, '8', NULL, 90, NULL, 2),
  ('b2222222-2222-2222-2222-222222222222', 'Rowing Barre', 'main', 'RPE 7/8', NULL, 4, '6', NULL, 90, NULL, 3),
  ('b2222222-2222-2222-2222-222222222222', 'Sled Pull', 'main', '70% charge officielle', NULL, 6, '20m', NULL, 90, 'Focus sensation technique', 4),
  ('b2222222-2222-2222-2222-222222222222', 'Wall Ball', 'main', '9 kg', 9, 3, '15-20', NULL, 90, 'Focus profondeur et extension', 5),

  ('b3333333-3333-3333-3333-333333333333', '500m Run', 'circuit', 'Zone 2', NULL, 3, '500m', NULL, NULL, NULL, 1),
  ('b3333333-3333-3333-3333-333333333333', '500m Ski', 'circuit', 'Zone 2', NULL, 3, '500m', NULL, NULL, NULL, 2),
  ('b3333333-3333-3333-3333-333333333333', '500m Row', 'circuit', 'Zone 2', NULL, 3, '500m', NULL, NULL, NULL, 3),

  ('c1111111-1111-1111-1111-111111111111', 'Deadlift', 'main', '75/80% RM Theo', 85, 5, '5', NULL, 150, 'Controle du mouvement', 1),
  ('c1111111-1111-1111-1111-111111111111', 'Back Squat', 'main', 'RPE 7/8', 65, 4, '6-8', NULL, 90, 'Bien controler la phase excentrique', 2),
  ('c1111111-1111-1111-1111-111111111111', 'Walking Lunges DB', 'main', '2 DB de 15 a 20 kg', 17.5, 3, '20m', NULL, 90, NULL, 3),
  ('c1111111-1111-1111-1111-111111111111', 'Farmer Carry', 'main', 'KB 28-32 ou Barre', 30, 4, '40m', NULL, 90, NULL, 4),
  ('c1111111-1111-1111-1111-111111111111', '500m Run', 'finisher', NULL, NULL, 4, '500m', NULL, 60, NULL, 5),
  ('c1111111-1111-1111-1111-111111111111', 'Dead Hang', 'grip', '1 ou 2 bras', NULL, 3, 'Max temps', NULL, NULL, NULL, 6),

  ('c2222222-2222-2222-2222-222222222222', 'Bench Press', 'main', '75/80% RM Theo', 80, 5, '5', NULL, 150, 'Controle de la descente', 1),
  ('c2222222-2222-2222-2222-222222222222', 'Developpe Militaire', 'main', 'RPE 7/8', NULL, 3, '8', NULL, 90, NULL, 2),
  ('c2222222-2222-2222-2222-222222222222', 'Rowing Barre', 'main', 'RPE 7/8', NULL, 4, '6', NULL, 90, NULL, 3),
  ('c2222222-2222-2222-2222-222222222222', 'Sled Push', 'main', '70% charge officielle', NULL, 6, '20m', NULL, 90, 'Focus sensation technique', 4),
  ('c2222222-2222-2222-2222-222222222222', 'Wall Ball', 'main', '9 kg', 9, 3, '15-20', NULL, 90, 'Focus profondeur et extension', 5),

  ('c3333333-3333-3333-3333-333333333333', '20 Cal Assault Bike', 'circuit', NULL, NULL, 3, '20 cal', NULL, NULL, NULL, 1),
  ('c3333333-3333-3333-3333-333333333333', 'Wall Ball', 'circuit', '6 kg', 6, 3, '20', NULL, NULL, NULL, 2),
  ('c3333333-3333-3333-3333-333333333333', 'Sled Pull', 'circuit', '70%', NULL, 3, '20m', NULL, NULL, NULL, 3),
  ('c3333333-3333-3333-3333-333333333333', 'Burpee Broad Jump', 'circuit', NULL, NULL, 3, '15', NULL, NULL, NULL, 4);