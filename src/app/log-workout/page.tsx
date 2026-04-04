'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Routine, RoutineExercise, Exercise } from '@/types';


interface SetEntry { exercise_id: string; exercise_name: string; set_number: number; reps: number; weight: number; }

function parseTargetValue(targetValue: string | number | undefined | null, setIndex: number, defaultValue: number): number {
    if (!targetValue) return defaultValue;
    if (typeof targetValue === 'number') return targetValue;
    
    const parts = String(targetValue).split(',').map(p => p.trim());
    const part = parts[setIndex] || parts[0];
    const match = part.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : defaultValue;
}

function LogWorkoutForm() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const searchParams = useSearchParams();
    const routineParam = searchParams.get('routine');
    const editId = searchParams.get('edit');

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
            if (!user) return;
            const [routinesRes, exercisesRes] = await Promise.all([
                supabase.from('routines').select('*').eq('user_id', user.id).order('name'),
                supabase.from('exercises').select('*').order('name'),
            ]);
            if (routinesRes.data) setRoutines(routinesRes.data);
            if (exercisesRes.data) setAllExercises(exercisesRes.data);

            if (editId) {
                const { data: logData } = await supabase.from('workout_logs').select('*').eq('id', editId).single();
                if (logData) {
                    setWorkoutName(logData.name);
                    setNotes(logData.notes || '');
                    if (logData.routine_id) setSelectedRoutine(logData.routine_id);
                    
                    const { data: setsData } = await supabase.from('workout_sets').select('*, exercise:exercises(name)').eq('workout_log_id', editId).order('set_number');
                    if (setsData) {
                        setSets(setsData.map(s => ({
                            exercise_id: s.exercise_id,
                            exercise_name: s.exercise?.name || 'Unknown',
                            set_number: s.set_number,
                            reps: s.reps || 0,
                            weight: s.weight || 0
                        })));
                    }
                }
            }
        }
        init();
    }, [editId]);

    useEffect(() => {
        if (!selectedRoutine || editId) { setRoutineExercises([]); return; }
        async function loadRoutineExercises() {
            const { data } = await supabase.from('routine_exercises').select('*, exercise:exercises(*)').eq('routine_id', selectedRoutine).order('order_index');
            if (data) {
                setRoutineExercises(data);
                const routine = routines.find((r) => r.id === selectedRoutine);
                if (routine) setWorkoutName(routine.name);
                const initialSets: SetEntry[] = data.flatMap((re) =>
                    Array.from({ length: re.target_sets || 3 }, (_, i) => ({
                        exercise_id: re.exercise_id, exercise_name: re.exercise?.name || '',
                        set_number: i + 1, 
                        reps: parseTargetValue(re.target_reps, i, 10), 
                        weight: parseTargetValue(re.target_weight, i, 0),
                    }))
                );
                setSets(initialSets);
            }
        }
        loadRoutineExercises();
    }, [selectedRoutine, routines, editId]);

    function addSet(exerciseId: string, exerciseName: string) {
        const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
        setSets((prev) => [...prev, { exercise_id: exerciseId, exercise_name: exerciseName, set_number: exerciseSets.length + 1, reps: 10, weight: 0 }]);
    }

    function removeSet(exerciseId: string, setNumber: number) {
        setSets((prev) => prev.filter((s) => !(s.exercise_id === exerciseId && s.set_number === setNumber)));
    }

    function updateSet(exerciseId: string, setNumber: number, field: 'reps' | 'weight', value: number) {
        setSets((prev) => prev.map((s) => s.exercise_id === exerciseId && s.set_number === setNumber ? { ...s, [field]: value } : s));
    }

    function addFreeExercise(exerciseId: string) {
        const exercise = allExercises.find((e) => e.id === exerciseId);
        if (!exercise) return;
        if (sets.some((s) => s.exercise_id === exerciseId)) return;
        setSets((prev) => [...prev, { exercise_id: exerciseId, exercise_name: exercise.name, set_number: 1, reps: 10, weight: 0 }]);
    }

    async function handleSave() {
        if (!workoutName.trim()) { setError('Please enter a workout name.'); return; }
        setSaving(true); setError('');

        let logId = editId;

        if (editId) {
            const { error: logErr } = await supabase.from('workout_logs').update({
                name: workoutName.trim(), notes: notes.trim() || null,
                routine_id: selectedRoutine || null
            }).eq('id', editId);
            if (logErr) { setError('Failed to update workout.'); setSaving(false); return; }
            
            await supabase.from('workout_sets').delete().eq('workout_log_id', editId);
        } else {
            const { data: log, error: logErr } = await supabase.from('workout_logs').insert({
                user_id: user?.id, routine_id: selectedRoutine || null,
                name: workoutName.trim(), notes: notes.trim() || null,
                started_at: new Date().toISOString(), finished_at: new Date().toISOString(),
            }).select().single();
            if (logErr || !log) { setError('Failed to save workout.'); setSaving(false); return; }
            logId = log.id;
        }

        if (sets.length > 0 && logId) {
            await supabase.from('workout_sets').insert(sets.map((s) => ({
                workout_log_id: logId, exercise_id: s.exercise_id,
                set_number: s.set_number, reps: s.reps, weight: s.weight || null,
            })));
        }
        setSaved(true);
        setTimeout(() => router.push('/history'), 1500);
    }

    const exerciseIds = [...new Set(sets.map((s) => s.exercise_id))];
    const inputStyle: React.CSSProperties = { background: '#1E2430', border: '1px solid #252B36', borderRadius: 14, padding: '12px 16px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ padding: '0 16px 100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24, paddingBottom: 16 }}>
                <button onClick={() => router.back()} style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {editId ? 'Edit Workout' : 'Log Workout'}
                    </h1>
                    <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: 0 }}>
                        {editId ? 'Update your session' : 'Record your session'}
                    </p>
                </div>
            </div>

            {/* Session info */}
            <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 20 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Session Info</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label className="label">Workout Name *</label>
                        <input style={inputStyle} placeholder="e.g. Push Day, Morning Workout..." value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Load Routine (optional)</label>
                        <select disabled={!!editId} style={{ ...inputStyle, appearance: 'none', opacity: editId ? 0.6 : 1 }} value={selectedRoutine} onChange={(e) => setSelectedRoutine(e.target.value)}>
                            <option value="">— Select routine —</option>
                            {routines.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} placeholder="How did it go?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Add exercise (free mode) */}
            {!selectedRoutine && (
                <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 20 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Add Exercise</p>
                    <select style={{ ...inputStyle, appearance: 'none' }} onChange={(e) => addFreeExercise(e.target.value)} defaultValue="">
                        <option value="" disabled>Select exercise...</option>
                        {allExercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                </div>
            )}

            {/* Sets */}
            {exerciseIds.length === 0 ? (
                <div style={{ border: '2px dashed #252B36', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
                    <p style={{ color: '#8A91A8', fontSize: '0.85rem', margin: 0 }}>
                        {selectedRoutine ? 'Loading exercises...' : 'Select a routine or add exercises manually'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {exerciseIds.map((exerciseId) => {
                        const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
                        const exerciseName = exerciseSets[0]?.exercise_name;
                        return (
                            <div key={exerciseId} className="card" style={{ padding: 16, borderRadius: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: 0 }}>{exerciseName}</p>
                                    <button
                                        onClick={() => addSet(exerciseId, exerciseName)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,107,53,0.12)', border: 'none', borderRadius: 99, padding: '6px 12px', cursor: 'pointer', color: '#FF6B35', fontWeight: 600, fontSize: '0.75rem' }}
                                    >
                                        <Plus size={12} /> Set
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr 32px', gap: '6px 8px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600 }}>#</span>
                                    <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600, textAlign: 'center' }}>Reps</span>
                                    <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600, textAlign: 'center' }}>Weight (kg)</span>
                                    <span />
                                    {exerciseSets.map((set) => (
                                        <>
                                            <span key={`n-${exerciseId}-${set.set_number}`} style={{ fontSize: '0.85rem', color: '#8A91A8', fontWeight: 600, textAlign: 'left' }}>{set.set_number}</span>
                                            <input
                                                key={`r-${exerciseId}-${set.set_number}`}
                                                type="number"
                                                style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 10, padding: '8px 4px', color: '#fff', fontSize: '0.85rem', textAlign: 'center', outline: 'none' }}
                                                value={set.reps} min={0}
                                                onChange={(e) => updateSet(exerciseId, set.set_number, 'reps', Number(e.target.value))}
                                            />
                                            <input
                                                key={`w-${exerciseId}-${set.set_number}`}
                                                type="number"
                                                style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 10, padding: '8px 4px', color: '#FF6B35', fontSize: '0.85rem', textAlign: 'center', outline: 'none', fontWeight: 600 }}
                                                value={set.weight} min={0} step={2.5}
                                                onChange={(e) => updateSet(exerciseId, set.set_number, 'weight', Number(e.target.value))}
                                            />
                                            <button
                                                key={`d-${exerciseId}-${set.set_number}`}
                                                onClick={() => removeSet(exerciseId, set.set_number)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6175', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {error && (
                <div style={{ margin: '14px 0', padding: '12px 16px', background: 'rgba(255,69,69,0.1)', border: '1px solid rgba(255,69,69,0.25)', borderRadius: 14, fontSize: '0.85rem', color: '#FF4545' }}>
                    {error}
                </div>
            )}

            <div style={{ marginTop: 16 }}>
                {saved ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', borderRadius: 16, color: '#C8FF00', fontWeight: 600 }}>
                        <CheckCircle size={20} /> Workout saved! Redirecting...
                    </div>
                ) : (
                    <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
                        {saving ? 'Saving...' : 'Finish & Save Workout'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function LogWorkoutPage() {

    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#8A91A8' }}>Loading...</div>}>
            <LogWorkoutForm />
        </Suspense>
    );
}
