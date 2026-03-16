'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface RoutineExerciseForm {
    exercise_id: string; exercise_name: string; target_sets: number; target_reps: number; target_weight: number;
}

function SortableExerciseItem({ ex, updateExercise, removeExercise }: {
    ex: RoutineExerciseForm;
    updateExercise: (id: string, field: keyof RoutineExerciseForm, value: number) => void;
    removeExercise: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ex.exercise_id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={{ ...style, background: '#1E2430', borderRadius: 16, padding: '14px', border: '1px solid #252B36' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div {...attributes} {...listeners} style={{ cursor: 'grab', color: '#5A6175', touchAction: 'none', display: 'flex' }}>
                        <GripVertical size={16} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{ex.exercise_name}</span>
                </div>
                <button onClick={() => removeExercise(ex.exercise_id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6175', padding: 4, display: 'flex' }}>
                    <Trash2 size={15} />
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                    { label: 'Sets', field: 'target_sets' as const, value: ex.target_sets },
                    { label: 'Reps', field: 'target_reps' as const, value: ex.target_reps },
                    { label: 'Weight (kg)', field: 'target_weight' as const, value: ex.target_weight, step: 2.5 },
                ].map(({ label, field, value, step }) => (
                    <div key={field}>
                        <p style={{ fontSize: '0.65rem', color: '#8A91A8', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</p>
                        <input
                            type="number" className="input"
                            style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', borderRadius: 10 }}
                            value={value} min={0} step={step || 1}
                            onChange={(e) => updateExercise(ex.exercise_id, field, Number(e.target.value))}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function CreateWorkoutPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<RoutineExerciseForm[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchExercises() {
            setLoading(true);
            const { data } = await supabase.from('exercises').select('*').order('name');
            if (data) setExercises(data);
            setLoading(false);
        }
        fetchExercises();
    }, []);

    const filteredExercises = exercises.filter(
        (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.muscle_group?.toLowerCase().includes(search.toLowerCase())
    );

    function addExercise(exercise: Exercise) {
        if (selectedExercises.find((e) => e.exercise_id === exercise.id)) return;
        setSelectedExercises((prev) => [...prev, { exercise_id: exercise.id, exercise_name: exercise.name, target_sets: 3, target_reps: 10, target_weight: 0 }]);
    }

    function removeExercise(id: string) { setSelectedExercises((prev) => prev.filter((e) => e.exercise_id !== id)); }
    function updateExercise(id: string, field: keyof RoutineExerciseForm, value: number) {
        setSelectedExercises((prev) => prev.map((e) => (e.exercise_id === id ? { ...e, [field]: value } : e)));
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setSelectedExercises((items) => {
                const oldIndex = items.findIndex((i) => i.exercise_id === active.id);
                const newIndex = items.findIndex((i) => i.exercise_id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    async function handleSave() {
        if (!name.trim()) { setError('Please enter a routine name.'); return; }
        if (selectedExercises.length === 0) { setError('Please add at least one exercise.'); return; }
        setSaving(true); setError('');

        const { data: routine, error: routineErr } = await supabase
            .from('routines').insert({ user_id: DEMO_USER_ID, name: name.trim(), description: description.trim() }).select().single();

        if (routineErr || !routine) { setError('Failed to create routine.'); setSaving(false); return; }

        const routineExercises = selectedExercises.map((e, index) => ({
            routine_id: routine.id, exercise_id: e.exercise_id, order_index: index,
            target_sets: e.target_sets, target_reps: e.target_reps, target_weight: e.target_weight || null,
        }));
        await supabase.from('routine_exercises').insert(routineExercises);
        router.push('/workouts');
    }

    const inputStyle: React.CSSProperties = { background: '#1E2430', border: '1px solid #252B36', borderRadius: 14, padding: '12px 16px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ padding: '0 16px 100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24, paddingBottom: 16 }}>
                <button onClick={() => router.back()} style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 12, padding: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}>
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create Routine</h1>
                    <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: 0 }}>Build your workout plan</p>
                </div>
            </div>

            {/* Routine details */}
            <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 20 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Details</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label className="label">Routine Name *</label>
                        <input style={inputStyle} placeholder="e.g. Push Day, Leg Day..." value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} placeholder="Describe your routine..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Exercise picker */}
            <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 20 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Exercise Library</p>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                    <Search size={16} color="#8A91A8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                    <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Search exercises..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#8A91A8', fontSize: '0.85rem', padding: 16 }}>Loading...</p>
                    ) : filteredExercises.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#8A91A8', fontSize: '0.85rem', padding: 16 }}>No exercises found</p>
                    ) : filteredExercises.map((exercise) => {
                        const isAdded = selectedExercises.some((e) => e.exercise_id === exercise.id);
                        return (
                            <button
                                key={exercise.id}
                                onClick={() => addExercise(exercise)}
                                disabled={isAdded}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 12px', borderRadius: 12, cursor: isAdded ? 'not-allowed' : 'pointer',
                                    background: isAdded ? 'rgba(255,107,53,0.08)' : '#1E2430',
                                    border: `1px solid ${isAdded ? 'rgba(255,107,53,0.3)' : '#252B36'}`,
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: isAdded ? '#FF6B35' : '#fff' }}>{exercise.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {exercise.muscle_group && <span style={{ fontSize: '0.7rem', color: '#5A6175' }}>{exercise.muscle_group}</span>}
                                    {isAdded ? <span style={{ fontSize: '0.7rem', color: '#FF6B35', fontWeight: 600 }}>Added</span> : <Plus size={14} color="#5A6175" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected exercises */}
            {selectedExercises.length > 0 && (
                <div className="card" style={{ padding: 16, marginBottom: 16, borderRadius: 20 }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                        Routine ({selectedExercises.length} exercise{selectedExercises.length !== 1 ? 's' : ''})
                    </p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={selectedExercises.map((e) => e.exercise_id)} strategy={verticalListSortingStrategy}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {selectedExercises.map((ex) => (
                                    <SortableExerciseItem key={ex.exercise_id} ex={ex} updateExercise={updateExercise} removeExercise={removeExercise} />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,69,69,0.1)', border: '1px solid rgba(255,69,69,0.25)', borderRadius: 14, marginBottom: 12, fontSize: '0.85rem', color: '#FF4545' }}>
                    {error}
                </div>
            )}

            <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '0.95rem' }}>
                {saving ? 'Saving...' : 'Save Routine'}
            </button>
        </div>
    );
}
