-- ============================================================
-- GYM BUDDY APP – Fix Exercise RLS & Seed PDF Exercises
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. FIX RLS POLICIES FOR EXERCISES TABLE
-- This allows the app to insert custom exercises without "Failed to create exercise" errors.
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON exercises;
DROP POLICY IF EXISTS "Enable insert for all users" ON exercises;
DROP POLICY IF EXISTS "Enable update for all users" ON exercises;
DROP POLICY IF EXISTS "Enable delete for all users" ON exercises;

CREATE POLICY "Enable read access for all users" ON exercises FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON exercises FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON exercises FOR DELETE USING (true);

-- 2. ENSURE COLUMNS EXIST (Just in case)
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category TEXT;

-- 3. INSERT PDF EXERCISES (Using a safe approach to avoid duplicates without unique constraints)
-- We insert only if the exercise name does not already exist.
INSERT INTO exercises (name, muscle_group, equipment, category)
SELECT * FROM (VALUES 
    -- Chest
    ('Incline Barbell Press', 'Chest', 'Barbell', 'Strength'),
    ('Barbell Flat Bench Press', 'Chest', 'Barbell', 'Strength'),
    ('Incline Dumbbell Fly', 'Chest', 'Dumbbell', 'Strength'),
    ('Chest Dips', 'Chest', 'Bodyweight', 'Strength'),
    ('Dumbbell Flys', 'Chest', 'Dumbbell', 'Strength'),
    ('Landmine Press', 'Chest', 'Barbell', 'Strength'),
    ('Cable Cross Over', 'Chest', 'Cable', 'Strength'),
    ('Flat Dumbbell Press', 'Chest', 'Dumbbell', 'Strength'),
    ('Dumbbell Pull Overs', 'Chest', 'Dumbbell', 'Strength'),
    ('Underhand Cable Fly', 'Chest', 'Cable', 'Strength'),
    ('Decline Dumbbell Press', 'Chest', 'Dumbbell', 'Strength'),
    ('Incline Dumbbell Fly w/ Close Press', 'Chest', 'Dumbbell', 'Strength'),

    -- Triceps
    ('Standing French Press', 'Triceps', 'Barbell', 'Strength'),
    ('Dumbbell Kickbacks', 'Triceps', 'Dumbbell', 'Strength'),
    ('Triceps Skull Crushers', 'Triceps', 'Barbell', 'Strength'),
    ('EZ-Bar Skull Crusher', 'Triceps', 'EZ-Bar', 'Strength'),
    ('Rope Extensions', 'Triceps', 'Cable', 'Strength'),
    ('Cross Bench Dips', 'Triceps', 'Bodyweight', 'Strength'),
    ('Lying Dumbbell Triceps Ext.', 'Triceps', 'Dumbbell', 'Strength'),
    ('Cable Triceps Ext.', 'Triceps', 'Cable', 'Strength'),

    -- Back
    ('Deadlift', 'Back', 'Barbell', 'Strength'),
    ('Pull Up', 'Back', 'Bodyweight', 'Strength'),
    ('Single Arm Dumbbell Row', 'Back', 'Dumbbell', 'Strength'),
    ('Underhand Barbell Row', 'Back', 'Barbell', 'Strength'),
    ('T-Bar Rows', 'Back', 'Barbell', 'Strength'),
    ('Straight Arm Pull Down', 'Back', 'Cable', 'Strength'),
    ('Bent Over T-Bar Row', 'Back', 'Barbell', 'Strength'),
    ('Single Arm Dumbbell Row (chainsaws)', 'Back', 'Dumbbell', 'Strength'),
    ('Seated Cable Rows', 'Back', 'Cable', 'Strength'),
    ('Under hand Pull downs', 'Back', 'Cable', 'Strength'),
    ('Dumbbell Romanian DL', 'Back', 'Dumbbell', 'Strength'),

    -- Biceps
    ('Incline Dumbbell Curl', 'Biceps', 'Dumbbell', 'Strength'),
    ('Preacher Curl', 'Biceps', 'Barbell', 'Strength'),
    ('Dumbbell Spider Curls', 'Biceps', 'Dumbbell', 'Strength'),
    ('Barbell Curls', 'Biceps', 'Barbell', 'Strength'),
    ('Alternating Dumbbell Hammer Curls', 'Biceps', 'Dumbbell', 'Strength'),
    ('Preacher Bench Concentration Curls', 'Biceps', 'Dumbbell', 'Strength'),
    ('Finger Curls', 'Forearms', 'Barbell', 'Strength'),

    -- Legs
    ('Squats', 'Legs', 'Barbell', 'Strength'),
    ('Walking Lunges', 'Legs', 'Dumbbell', 'Strength'),
    ('Leg Press', 'Legs', 'Machine', 'Strength'),
    ('Standing Leg Curls', 'Legs', 'Machine', 'Strength'),
    ('Romanian Deadlifts', 'Legs', 'Barbell', 'Strength'),
    ('Leg Extensions', 'Legs', 'Machine', 'Strength'),
    ('Hack Squats', 'Legs', 'Machine', 'Strength'),
    ('Seated Hamstring Curls', 'Legs', 'Machine', 'Strength'),
    ('Hip Extensions (Lifts)', 'Legs', 'Machine', 'Strength'),
    ('Front Squats', 'Legs', 'Barbell', 'Strength'),
    ('Single Leg Romanian Deadlift', 'Legs', 'Dumbbell', 'Strength'),
    ('Lunges', 'Legs', 'Bodyweight', 'Strength'),
    ('Single Leg Press', 'Legs', 'Machine', 'Strength'),
    ('Adduction Machine', 'Legs', 'Machine', 'Strength'),
    ('Abduction Machine', 'Legs', 'Machine', 'Strength'),

    -- Calves
    ('Seated Calf Raises', 'Calves', 'Machine', 'Strength'),
    ('Donkey Calf Raises', 'Calves', 'Machine', 'Strength'),
    ('Standing Calf Raises', 'Calves', 'Machine', 'Strength'),

    -- Shoulders
    ('Overhead Press', 'Shoulders', 'Barbell', 'Strength'),
    ('Upright Row', 'Shoulders', 'Barbell', 'Strength'),
    ('Dumbbell Lateral Raise', 'Shoulders', 'Dumbbell', 'Strength'),
    ('Face Pulls', 'Shoulders', 'Cable', 'Strength'),
    ('Barbell Shrugs', 'Shoulders', 'Barbell', 'Strength'),
    ('Bradford Press', 'Shoulders', 'Barbell', 'Strength'),
    ('Standing Arnold Press', 'Shoulders', 'Dumbbell', 'Strength'),
    ('Single Cable Lateral Raise', 'Shoulders', 'Cable', 'Strength'),
    ('Barbell Front Raise', 'Shoulders', 'Barbell', 'Strength'),
    ('Dumbbell Shrugs', 'Shoulders', 'Dumbbell', 'Strength'),
    ('Bent Over Dumbbell Reverse Fly', 'Shoulders', 'Dumbbell', 'Strength'),
    ('Reverse Upright Row', 'Shoulders', 'Barbell', 'Strength'),
    ('Alternating Dumbbell Front Raise', 'Shoulders', 'Dumbbell', 'Strength'),
    ('Dumbbell Clean and Press', 'Shoulders', 'Dumbbell', 'Strength'),

    -- Core/Full Body/Cardio
    ('Farmer Walks', 'Full Body', 'Dumbbell', 'Strength'),
    ('Box Jumps', 'Legs', 'Bodyweight', 'Plyometrics'),
    ('Plank', 'Core', 'Bodyweight', 'Strength'),
    ('Reverse Crunch', 'Core', 'Bodyweight', 'Strength'),
    ('HIIT', 'Full Body', 'Bodyweight', 'Cardio'),
    ('Kneeling High Pulley Chops', 'Core', 'Cable', 'Strength'),
    ('Weighted Machine Crunch', 'Core', 'Machine', 'Strength')
) AS v(name, muscle_group, equipment, category)
WHERE NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.name = v.name
);
