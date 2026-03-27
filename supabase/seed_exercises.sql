-- ============================================================
-- GYM BUDDY APP – Exercise Library Seed + Schema Updates
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to exercises table (safe – ignored if already exist)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category  TEXT;

-- 2. Add schedule JSON column to routines table
ALTER TABLE routines ADD COLUMN IF NOT EXISTS schedule JSONB;

-- 3. Clear old minimal seed data (safe – only removes rows with no user data)
--    If you already have custom exercises, comment out the DELETE below.
DELETE FROM exercises WHERE created_at < NOW() - INTERVAL '0 seconds'
  AND id NOT IN (SELECT DISTINCT exercise_id FROM routine_exercises)
  AND id NOT IN (SELECT DISTINCT exercise_id FROM workout_sets);

-- 4. Insert comprehensive exercise library
INSERT INTO exercises (name, muscle_group, equipment, category) VALUES

-- ══════════════ CHEST ══════════════
('Barbell Flat Bench Press',         'Chest',        'Barbell',       'Strength'),
('Incline Barbell Bench Press',      'Chest',        'Barbell',       'Strength'),
('Decline Barbell Bench Press',      'Chest',        'Barbell',       'Strength'),
('Incline Dumbbell Press',           'Chest',        'Dumbbell',      'Strength'),
('Flat Dumbbell Press',              'Chest',        'Dumbbell',      'Strength'),
('Decline Dumbbell Press',           'Chest',        'Dumbbell',      'Strength'),
('Dumbbell Flys',                    'Chest',        'Dumbbell',      'Hypertrophy'),
('Incline Dumbbell Flys',            'Chest',        'Dumbbell',      'Hypertrophy'),
('Cable Chest Fly',                  'Chest',        'Cable',         'Hypertrophy'),
('Pec Deck Machine',                 'Chest',        'Machine',       'Hypertrophy'),
('Landmine Press',                   'Chest',        'Barbell',       'Strength'),
('Push-Ups',                         'Chest',        'Bodyweight',    'Endurance'),
('Diamond Push-Ups',                 'Chest',        'Bodyweight',    'Endurance'),
('Chest Dips',                       'Chest',        'Bodyweight',    'Strength'),

-- ══════════════ BACK ══════════════
('Deadlift',                         'Back',         'Barbell',       'Strength'),
('Conventional Deadlift',            'Back',         'Barbell',       'Strength'),
('Sumo Deadlift',                    'Back',         'Barbell',       'Strength'),
('Pull-Ups',                         'Back',         'Bodyweight',    'Strength'),
('Chin-Ups',                         'Back',         'Bodyweight',    'Strength'),
('Lat Pulldown',                     'Back',         'Cable',         'Hypertrophy'),
('Wide Grip Lat Pulldown',           'Back',         'Cable',         'Hypertrophy'),
('Seated Cable Row',                 'Back',         'Cable',         'Strength'),
('T-Bar Row',                        'Back',         'Barbell',       'Strength'),
('Bent Over Barbell Row',            'Back',         'Barbell',       'Strength'),
('Pendlay Row',                      'Back',         'Barbell',       'Strength'),
('Single Arm Dumbbell Row',          'Back',         'Dumbbell',      'Strength'),
('Dumbbell Pullover',                'Back',         'Dumbbell',      'Hypertrophy'),
('Cable Pullover',                   'Back',         'Cable',         'Hypertrophy'),
('Rack Pulls',                       'Back',         'Barbell',       'Strength'),
('Good Mornings',                    'Back',         'Barbell',       'Strength'),
('Hyperextensions',                  'Lower Back',   'Bodyweight',    'Strength'),

-- ══════════════ SHOULDERS ══════════════
('Barbell Overhead Press',           'Shoulders',    'Barbell',       'Strength'),
('Dumbbell Shoulder Press',          'Shoulders',    'Dumbbell',      'Strength'),
('Arnold Press',                     'Shoulders',    'Dumbbell',      'Hypertrophy'),
('Lateral Raises',                   'Shoulders',    'Dumbbell',      'Hypertrophy'),
('Cable Lateral Raise',              'Shoulders',    'Cable',         'Hypertrophy'),
('Front Raises',                     'Shoulders',    'Dumbbell',      'Hypertrophy'),
('Face Pulls',                       'Rear Delts',   'Cable',         'Hypertrophy'),
('Reverse Dumbbell Fly',             'Rear Delts',   'Dumbbell',      'Hypertrophy'),
('Rear Delt Machine Fly',            'Rear Delts',   'Machine',       'Hypertrophy'),
('Upright Row',                      'Shoulders',    'Barbell',       'Strength'),
('Machine Shoulder Press',           'Shoulders',    'Machine',       'Strength'),

-- ══════════════ BICEPS ══════════════
('Barbell Curls',                    'Biceps',       'Barbell',       'Strength'),
('EZ Bar Curls',                     'Biceps',       'EZ Bar',        'Strength'),
('Dumbbell Bicep Curls',             'Biceps',       'Dumbbell',      'Hypertrophy'),
('Hammer Curls',                     'Biceps',       'Dumbbell',      'Hypertrophy'),
('Incline Dumbbell Curls',           'Biceps',       'Dumbbell',      'Hypertrophy'),
('Concentration Curls',              'Biceps',       'Dumbbell',      'Hypertrophy'),
('Cable Curls',                      'Biceps',       'Cable',         'Hypertrophy'),
('Preacher Curls',                   'Biceps',       'EZ Bar',        'Hypertrophy'),
('Spider Curls',                     'Biceps',       'Dumbbell',      'Hypertrophy'),

-- ══════════════ TRICEPS ══════════════
('Close-Grip Bench Press',           'Triceps',      'Barbell',       'Strength'),
('Triceps Skull Crushers',           'Triceps',      'EZ Bar',        'Hypertrophy'),
('Triceps Pushdowns',                'Triceps',      'Cable',         'Hypertrophy'),
('Rope Pushdowns',                   'Triceps',      'Cable',         'Hypertrophy'),
('Overhead Tricep Extension',        'Triceps',      'Dumbbell',      'Hypertrophy'),
('Tricep Kickbacks',                 'Triceps',      'Dumbbell',      'Hypertrophy'),
('Tricep Dips',                      'Triceps',      'Bodyweight',    'Strength'),
('Diamond Push-Ups',                 'Triceps',      'Bodyweight',    'Endurance'),

-- ══════════════ LEGS – QUADS ══════════════
('Barbell Back Squat',               'Quads',        'Barbell',       'Strength'),
('Barbell Front Squat',              'Quads',        'Barbell',       'Strength'),
('Goblet Squat',                     'Quads',        'Dumbbell',      'Strength'),
('Leg Press',                        'Quads',        'Machine',       'Strength'),
('Hack Squat',                       'Quads',        'Machine',       'Strength'),
('Walking Lunges',                   'Quads',        'Dumbbell',      'Hypertrophy'),
('Reverse Lunges',                   'Quads',        'Dumbbell',      'Hypertrophy'),
('Bulgarian Split Squats',           'Quads',        'Dumbbell',      'Strength'),
('Step-Ups',                         'Quads',        'Dumbbell',      'Strength'),
('Leg Extension',                    'Quads',        'Machine',       'Hypertrophy'),
('Sissy Squats',                     'Quads',        'Bodyweight',    'Hypertrophy'),

-- ══════════════ LEGS – HAMSTRINGS & GLUTES ══════════════
('Romanian Deadlift',                'Hamstrings',   'Barbell',       'Strength'),
('Stiff-Leg Deadlift',               'Hamstrings',   'Barbell',       'Strength'),
('Leg Curl',                         'Hamstrings',   'Machine',       'Hypertrophy'),
('Nordic Hamstring Curl',            'Hamstrings',   'Bodyweight',    'Strength'),
('Glute Bridges',                    'Glutes',       'Barbell',       'Strength'),
('Hip Thrusts',                      'Glutes',       'Barbell',       'Strength'),
('Cable Kickbacks',                  'Glutes',       'Cable',         'Hypertrophy'),
('Kettlebell Swings',                'Glutes',       'Kettlebell',    'Endurance'),
('Sumo Squats',                      'Glutes',       'Dumbbell',      'Hypertrophy'),

-- ══════════════ LEGS – CALVES ══════════════
('Standing Calf Raises',             'Calves',       'Machine',       'Hypertrophy'),
('Seated Calf Raises',               'Calves',       'Machine',       'Hypertrophy'),
('Donkey Calf Raises',               'Calves',       'Bodyweight',    'Hypertrophy'),

-- ══════════════ CORE / ABS ══════════════
('Plank',                            'Core',         'Bodyweight',    'Endurance'),
('Side Plank',                       'Core',         'Bodyweight',    'Endurance'),
('Cable Crunches',                   'Core',         'Cable',         'Hypertrophy'),
('Ab Rollout',                       'Core',         'Equipment',     'Strength'),
('Hanging Leg Raises',               'Core',         'Bodyweight',    'Strength'),
('Russian Twists',                   'Core',         'Bodyweight',    'Endurance'),
('Bicycle Crunches',                 'Core',         'Bodyweight',    'Endurance'),
('Decline Sit-Ups',                  'Core',         'Bodyweight',    'Endurance'),
('Dragon Flag',                      'Core',         'Bodyweight',    'Strength'),
('L-Sit',                            'Core',         'Bodyweight',    'Strength'),

-- ══════════════ CARDIO / CONDITIONING ══════════════
('Treadmill Running',                'Cardio',       'Machine',       'Cardio'),
('Rowing Machine',                   'Cardio',       'Machine',       'Cardio'),
('Jump Rope',                        'Cardio',       'Equipment',     'Cardio'),
('Assault Bike',                     'Cardio',       'Machine',       'Cardio'),
('Battle Ropes',                     'Cardio',       'Equipment',     'Cardio'),
('Box Jumps',                        'Cardio',       'Bodyweight',    'Cardio'),
('Burpees',                          'Cardio',       'Bodyweight',    'Cardio')

ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. OPTIONAL: Seed the 5-Day PPL/Upper-Lower template routine
--    for the demo user. Comment this section out if unwanted.
-- ============================================================

-- Insert the template routine
WITH new_routine AS (
  INSERT INTO routines (user_id, name, description, schedule)
  VALUES (
    '00000000-0000-0000-0000-000000000001',
    '5-Day PPL / Upper-Lower',
    'Push · Pull · Legs · Upper · Lower weekly split',
    '[
      {"day":"Mon","label":"Day 1","name":"Push","color":"#FF6B35"},
      {"day":"Tue","label":"Day 2","name":"Pull","color":"#4A9EFF"},
      {"day":"Wed","label":"Day 3","name":"Legs","color":"#A8FF3E"},
      {"day":"Thu","label":"Day 4","name":"Upper","color":"#BF5FFF"},
      {"day":"Fri","label":"Day 5","name":"Lower","color":"#FFD166"},
      {"day":"Sat","label":"Day 6","name":"Rest","color":"#5A6175"},
      {"day":"Sun","label":"Day 7","name":"Rest","color":"#5A6175"}
    ]'::jsonb
  )
  RETURNING id
)
-- Add exercises for Day 1 (Push)
INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps)
SELECT nr.id, e.id, rn.order_index, rn.sets, rn.reps
FROM new_routine nr
CROSS JOIN (VALUES
  ('Incline Dumbbell Press',      1, 4, 8),
  ('Barbell Flat Bench Press',    2, 4, 6),
  ('Landmine Press',              3, 3, 10),
  ('Dumbbell Flys',               4, 3, 12),
  ('Lateral Raises',              5, 4, 12),
  ('Triceps Skull Crushers',      6, 3, 10)
) AS rn(name, order_index, sets, reps)
JOIN exercises e ON e.name = rn.name
LIMIT 6;

