-- Gym Buddy App - Supabase SQL Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Exercises table (global exercise library)
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  muscle_group text,
  equipment text,
  category text,
  created_at timestamptz default now()
);

-- Routines table
create table if not exists routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  name text not null,
  description text,
  schedule jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Routine exercises (exercises within a routine)
create table if not exists routine_exercises (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid not null references routines(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  order_index int not null default 0,
  target_sets int,
  target_reps int,
  target_weight numeric(6,2),
  created_at timestamptz default now()
);

-- Workout logs
create table if not exists workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  routine_id uuid references routines(id) on delete set null,
  name text not null,
  notes text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- Workout sets (individual sets within a workout)
create table if not exists workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  set_number int not null default 1,
  reps int,
  weight numeric(6,2),
  notes text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_routines_user on routines(user_id);
create index if not exists idx_workout_logs_user on workout_logs(user_id);
create index if not exists idx_workout_logs_started on workout_logs(started_at desc);
create index if not exists idx_workout_sets_log on workout_sets(workout_log_id);
create index if not exists idx_workout_sets_exercise on workout_sets(exercise_id);

-- ────────────────────────────────────────────────────────────
-- NOTE: For exercise seed data, run supabase/seed_exercises.sql
-- ────────────────────────────────────────────────────────────
