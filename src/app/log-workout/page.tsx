'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { supabase } from '@/lib/supabase';
import { Routine, RoutineExercise, Exercise } from '@/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface SetEntry {
    exercise_id: string;
    exercise_name: string;
    set_number: number;
    reps: number;
    weight: number;
}

function LogWorkoutForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const routineParam = searchParams.get('routine');

    const [workoutName, setWorkoutName] = useState('');
    const [notes, setNotes] = useState('');
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [selectedRoutine, setSelectedRoutine] = useState(routineParam || '');
    const [, setRoutineExercises] = useState<RoutineExercise[]>([]);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [sets, setSets] = useState<SetEntry[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function init() {
            const [routinesRes, exercisesRes] = await Promise.all([
                supabase.from('routines').select('*').eq('user_id', DEMO_USER_ID).order('name'),
                supabase.from('exercises').select('*').order('name'),
            ]);
            if (routinesRes.data) setRoutines(routinesRes.data);
            if (exercisesRes.data) setAllExercises(exercisesRes.data);
        }
        init();
    }, []);

    useEffect(() => {
        if (!selectedRoutine) {
            setRoutineExercises([]);
            setSets([]);
            return;
        }
        async function loadRoutineExercises() {
            const { data } = await supabase
                .from('routine_exercises')
                .select('*, exercise:exercises(*)')
                .eq('routine_id', selectedRoutine)
                .order('order_index');
            if (data) {
                setRoutineExercises(data);
                const routine = routines.find((r) => r.id === selectedRoutine);
                if (routine) setWorkoutName(routine.name);
                // Pre-populate sets
                const initialSets: SetEntry[] = data.flatMap((re) =>
                    Array.from({ length: re.target_sets || 3 }, (_, i) => ({
                        exercise_id: re.exercise_id,
                        exercise_name: re.exercise?.name || '',
                        set_number: i + 1,
                        reps: re.target_reps || 10,
                        weight: re.target_weight || 0,
                    }))
                );
                setSets(initialSets);
            }
        }
        loadRoutineExercises();
    }, [selectedRoutine, routines]);

    function addSet(exerciseId: string, exerciseName: string) {
        const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
        setSets((prev) => [
            ...prev,
            {
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                set_number: exerciseSets.length + 1,
                reps: 10,
                weight: 0,
            },
        ]);
    }

    function removeSet(exerciseId: string, setNumber: number) {
        setSets((prev) =>
            prev.filter((s) => !(s.exercise_id === exerciseId && s.set_number === setNumber))
        );
    }

    function updateSet(exerciseId: string, setNumber: number, field: 'reps' | 'weight', value: number) {
        setSets((prev) =>
            prev.map((s) =>
                s.exercise_id === exerciseId && s.set_number === setNumber ? { ...s, [field]: value } : s
            )
        );
    }

    function addFreeExercise(exerciseId: string) {
        const exercise = allExercises.find((e) => e.id === exerciseId);
        if (!exercise) return;
        if (sets.some((s) => s.exercise_id === exerciseId)) return;
        setSets((prev) => [
            ...prev,
            { exercise_id: exerciseId, exercise_name: exercise.name, set_number: 1, reps: 10, weight: 0 },
        ]);
    }

    async function handleSave() {
        if (!workoutName.trim()) {
            setError('Please enter a workout name.');
            return;
        }
        setSaving(true);
        setError('');

        const { data: log, error: logErr } = await supabase
            .from('workout_logs')
            .insert({
                user_id: DEMO_USER_ID,
                routine_id: selectedRoutine || null,
                name: workoutName.trim(),
                notes: notes.trim() || null,
                started_at: new Date().toISOString(),
                finished_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (logErr || !log) {
            setError('Failed to save workout. Check your Supabase connection.');
            setSaving(false);
            return;
        }

        if (sets.length > 0) {
            await supabase.from('workout_sets').insert(
                sets.map((s) => ({
                    workout_log_id: log.id,
                    exercise_id: s.exercise_id,
                    set_number: s.set_number,
                    reps: s.reps,
                    weight: s.weight || null,
                }))
            );
        }

        setSaved(true);
        setTimeout(() => router.push('/workouts'), 1500);
    }

    // Group sets by exercise
    const exerciseIds = [...new Set(sets.map((s) => s.exercise_id))];

    return (
        <div>
            <PageHeader title="Log Workout" subtitle="Record your training session" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left panel */}
                <div className="space-y-4">
                    <div className="card p-6 space-y-4">
                        <h2 className="text-base font-semibold text-gray-200">Session Info</h2>
                        <div>
                            <label className="label">Workout Name *</label>
                            <input
                                className="input"
                                placeholder="e.g. Push Day, Morning Workout..."
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Load Routine (optional)</label>
                            <select
                                className="input"
                                value={selectedRoutine}
                                onChange={(e) => setSelectedRoutine(e.target.value)}
                            >
                                <option value="">— Select routine —</option>
                                {routines.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Notes</label>
                            <textarea
                                className="input resize-none"
                                rows={3}
                                placeholder="How did it go?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Add free exercise */}
                    {!selectedRoutine && (
                        <div className="card p-4">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Add Exercise</h3>
                            <select
                                className="input text-sm"
                                onChange={(e) => addFreeExercise(e.target.value)}
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Select exercise...
                                </option>
                                {allExercises.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Right panel - Sets */}
                <div className="lg:col-span-2 space-y-4">
                    {exerciseIds.length === 0 ? (
                        <div className="card p-10 text-center border-2 border-dashed border-gray-700">
                            <p className="text-gray-500 text-sm">
                                {selectedRoutine
                                    ? 'Loading exercises...'
                                    : 'Select a routine or add exercises manually'}
                            </p>
                        </div>
                    ) : (
                        exerciseIds.map((exerciseId) => {
                            const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
                            const exerciseName = exerciseSets[0]?.exercise_name;
                            return (
                                <div key={exerciseId} className="card p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-100">{exerciseName}</h3>
                                        <button
                                            onClick={() => addSet(exerciseId, exerciseName)}
                                            className="text-xs btn-secondary py-1.5 px-3"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Set
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-2 px-1 mb-1">
                                            <span className="col-span-2 text-xs text-gray-500">Set</span>
                                            <span className="col-span-4 text-xs text-gray-500">Reps</span>
                                            <span className="col-span-4 text-xs text-gray-500">Weight (kg)</span>
                                            <span className="col-span-2" />
                                        </div>
                                        {exerciseSets.map((set) => (
                                            <div
                                                key={`${exerciseId}-${set.set_number}`}
                                                className="grid grid-cols-12 gap-2 items-center bg-gray-800/40 rounded-lg px-2 py-1.5"
                                            >
                                                <span className="col-span-2 text-sm text-gray-400 font-medium text-center">
                                                    {set.set_number}
                                                </span>
                                                <input
                                                    type="number"
                                                    className="col-span-4 input py-1.5 text-sm text-center"
                                                    value={set.reps}
                                                    min={0}
                                                    onChange={(e) =>
                                                        updateSet(exerciseId, set.set_number, 'reps', Number(e.target.value))
                                                    }
                                                />
                                                <input
                                                    type="number"
                                                    className="col-span-4 input py-1.5 text-sm text-center"
                                                    value={set.weight}
                                                    min={0}
                                                    step={2.5}
                                                    onChange={(e) =>
                                                        updateSet(exerciseId, set.set_number, 'weight', Number(e.target.value))
                                                    }
                                                />
                                                <button
                                                    onClick={() => removeSet(exerciseId, set.set_number)}
                                                    className="col-span-2 flex justify-center text-gray-600 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {saved ? (
                        <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            Workout saved! Redirecting...
                        </div>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary w-full justify-center py-3 text-base"
                        >
                            {saving ? 'Saving...' : 'Finish & Save Workout'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LogWorkoutPage() {
    return (
        <Suspense fallback={<div className="text-gray-400 p-8">Loading...</div>}>
            <LogWorkoutForm />
        </Suspense>
    );
}
