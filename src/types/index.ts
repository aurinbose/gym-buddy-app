// Database types for Gym Buddy App

export interface Routine {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    schedule?: RoutineDay[];
    created_at: string;
    updated_at: string;
}

export interface RoutineDay {
    day: string;      // "Mon", "Tue", etc.
    label: string;    // "Day 1", "Day 2", etc.
    name: string;     // "Push", "Pull", "Legs", "Rest"
    color: string;    // hex color for UI accent
    exercises?: RoutineDayExercise[];
}

export interface RoutineDayExercise {
    exercise_id: string;
    exercise_name: string;
    target_sets: number;
    target_reps: string | number;
    target_weight: string | number;
}

export interface Exercise {
    id: string;
    name: string;
    muscle_group?: string;
    equipment?: string;
    category?: string;
    created_at: string;
}

export interface RoutineExercise {
    id: string;
    routine_id: string;
    exercise_id: string;
    order_index: number;
    target_sets?: number;
    target_reps?: string | number;
    target_weight?: string | number;
    exercise?: Exercise;
}

export interface WorkoutLog {
    id: string;
    user_id: string;
    routine_id?: string;
    name: string;
    notes?: string;
    started_at: string;
    finished_at?: string;
    created_at: string;
    routine?: Routine;
    workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
    id: string;
    workout_log_id: string;
    exercise_id: string;
    set_number: number;
    reps?: number;
    weight?: number;
    notes?: string;
    created_at: string;
    exercise?: Exercise;
}

export interface ExerciseProgress {
    exercise_id: string;
    exercise_name: string;
    date: string;
    max_weight: number;
    total_volume: number;
    total_reps: number;
}

// Form types
export interface CreateRoutineForm {
    name: string;
    description?: string;
    exercises: {
        exercise_id: string;
        target_sets?: number;
        target_reps?: string | number;
        target_weight?: string | number;
    }[];
}

export interface LogWorkoutForm {
    name: string;
    routine_id?: string;
    notes?: string;
    sets: {
        exercise_id: string;
        set_number: number;
        reps?: number;
        weight?: number;
    }[];
}
