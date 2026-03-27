-- ============================================================
-- GYM BUDDY APP – Feature: Rep Ranges Migration
-- Run this script in the Supabase SQL Editor
-- ============================================================

-- Alter the routine_exercises table to change the target_reps column from INT to TEXT.
-- This allows users to store string-based ranges like "10,8,6,4" or "8-12".

ALTER TABLE routine_exercises
ALTER COLUMN target_reps TYPE TEXT USING target_reps::TEXT;

-- Done!
