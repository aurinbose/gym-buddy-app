'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, GripVertical, Search } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface RoutineExerciseForm {
    exercise_id: string;
    exercise_name: string;
    target_sets: number;
    target_reps: number;
    target_weight: number;
}

function SortableExerciseItem({
    ex,
    updateExercise,
    removeExercise,
}: {
    ex: RoutineExerciseForm;
    updateExercise: (id: string, field: keyof RoutineExerciseForm, value: number) => void;
    removeExercise: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: ex.exercise_id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-grab hover:text-white touch-none">
                        <GripVertical className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-medium text-gray-200 text-sm">{ex.exercise_name}</span>
                </div>
                <button
                    onClick={() => removeExercise(ex.exercise_id)}
                    className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Sets</label>
                    <input
                        type="number"
                        className="input text-sm py-1.5 text-center"
                        value={ex.target_sets}
                        min={1}
                        onChange={(e) =>
                            updateExercise(ex.exercise_id, 'target_sets', Number(e.target.value))
                        }
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                    <input
                        type="number"
                        className="input text-sm py-1.5 text-center"
                        value={ex.target_reps}
                        min={1}
                        onChange={(e) =>
                            updateExercise(ex.exercise_id, 'target_reps', Number(e.target.value))
                        }
                    />
                </div>
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Weight (kg)</label>
                    <input
                        type="number"
                        className="input text-sm py-1.5 text-center"
                        value={ex.target_weight}
                        min={0}
                        step={2.5}
                        onChange={(e) =>
                            updateExercise(ex.exercise_id, 'target_weight', Number(e.target.value))
                        }
                    />
                </div>
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
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.muscle_group?.toLowerCase().includes(search.toLowerCase())
    );

    function addExercise(exercise: Exercise) {
        if (selectedExercises.find((e) => e.exercise_id === exercise.id)) return;
        setSelectedExercises((prev) => [
            ...prev,
            {
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                target_sets: 3,
                target_reps: 10,
                target_weight: 0,
            },
        ]);
    }

    function removeExercise(id: string) {
        setSelectedExercises((prev) => prev.filter((e) => e.exercise_id !== id));
    }

    function updateExercise(id: string, field: keyof RoutineExerciseForm, value: number) {
        setSelectedExercises((prev) =>
            prev.map((e) => (e.exercise_id === id ? { ...e, [field]: value } : e))
        );
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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
        if (!name.trim()) {
            setError('Please enter a routine name.');
            return;
        }
        if (selectedExercises.length === 0) {
            setError('Please add at least one exercise.');
            return;
        }

        setSaving(true);
        setError('');

        // Create routine
        const { data: routine, error: routineErr } = await supabase
            .from('routines')
            .insert({ user_id: DEMO_USER_ID, name: name.trim(), description: description.trim() })
            .select()
            .single();

        if (routineErr || !routine) {
            setError('Failed to create routine. Check your Supabase connection.');
            setSaving(false);
            return;
        }

        // Insert routine exercises
        const routineExercises = selectedExercises.map((e, index) => ({
            routine_id: routine.id,
            exercise_id: e.exercise_id,
            order_index: index,
            target_sets: e.target_sets,
            target_reps: e.target_reps,
            target_weight: e.target_weight || null,
        }));

        await supabase.from('routine_exercises').insert(routineExercises);

        router.push('/workouts');
    }

    return (
        <div>
            <PageHeader
                title="Create Routine"
                subtitle="Build a new workout routine with your exercises"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Routine details + exercise picker */}
                <div className="space-y-6">
                    {/* Routine info */}
                    <div className="card p-6 space-y-4">
                        <h2 className="text-base font-semibold text-gray-200">Routine Details</h2>
                        <div>
                            <label className="label">Routine Name *</label>
                            <input
                                className="input"
                                placeholder="e.g. Push Day, Leg Day..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="label">Description (optional)</label>
                            <textarea
                                className="input resize-none"
                                rows={3}
                                placeholder="Describe your routine..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Exercise picker */}
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-200 mb-4">Exercise Library</h2>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                className="input pl-10"
                                placeholder="Search exercises..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5 max-h-72 overflow-y-auto">
                            {loading ? (
                                <p className="text-sm text-gray-500 text-center py-4">Loading exercises...</p>
                            ) : filteredExercises.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No exercises found.</p>
                            ) : (
                                filteredExercises.map((exercise) => {
                                    const isAdded = selectedExercises.some((e) => e.exercise_id === exercise.id);
                                    return (
                                        <button
                                            key={exercise.id}
                                            onClick={() => addExercise(exercise)}
                                            disabled={isAdded}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${isAdded
                                                ? 'bg-violet-600/10 border border-violet-500/30 text-violet-300 cursor-not-allowed'
                                                : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:border-violet-500/50 hover:text-gray-100'
                                                }`}
                                        >
                                            <span className="font-medium">{exercise.name}</span>
                                            <div className="flex items-center gap-2">
                                                {exercise.muscle_group && (
                                                    <span className="text-xs text-gray-500">{exercise.muscle_group}</span>
                                                )}
                                                {isAdded ? (
                                                    <span className="text-xs text-violet-400">Added</span>
                                                ) : (
                                                    <Plus className="w-4 h-4 text-gray-500" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right - Selected exercises */}
                <div className="space-y-6">
                    <div className="card p-6">
                        <h2 className="text-base font-semibold text-gray-200 mb-4">
                            Routine Exercises
                            {selectedExercises.length > 0 && (
                                <span className="ml-2 badge badge text-violet-400 bg-violet-400/10">
                                    {selectedExercises.length}
                                </span>
                            )}
                        </h2>

                        {selectedExercises.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-gray-700 rounded-lg">
                                <p className="text-gray-500 text-sm">Add exercises from the library</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={selectedExercises.map((e) => e.exercise_id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {selectedExercises.map((ex) => (
                                            <SortableExerciseItem
                                                key={ex.exercise_id}
                                                ex={ex}
                                                updateExercise={updateExercise}
                                                removeExercise={removeExercise}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary w-full justify-center py-3 text-base"
                    >
                        {saving ? 'Saving...' : 'Save Routine'}
                    </button>
                </div>
            </div>
        </div>
    );
}
