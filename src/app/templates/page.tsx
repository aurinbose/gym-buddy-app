'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle, Database } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { supabase } from '@/lib/supabase';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface TemplateExercise {
    name: string;
    target_sets: number;
    target_reps: number;
}

interface WorkoutTemplate {
    id: string;
    name: string;
    description: string;
    exercises: TemplateExercise[];
}

const templates: WorkoutTemplate[] = [
    {
        id: 'beginner-a',
        name: 'Beginner Full Body - Day A',
        description: 'A beginner-friendly full body workout focusing on compound movements.',
        exercises: [
            { name: 'Barbell Squat', target_sets: 3, target_reps: 5 },
            { name: 'Bench Press', target_sets: 3, target_reps: 5 },
            { name: 'Barbell Row', target_sets: 3, target_reps: 5 }
        ]
    },
    {
        id: 'beginner-b',
        name: 'Beginner Full Body - Day B',
        description: 'The second day of the beginner full body program.',
        exercises: [
            { name: 'Deadlift', target_sets: 1, target_reps: 5 },
            { name: 'Overhead Press', target_sets: 3, target_reps: 5 },
            { name: 'Pull Up', target_sets: 3, target_reps: 8 }
        ]
    },
    {
        id: 'upper-body',
        name: 'Upper Body Focus',
        description: 'A comprehensive upper body routine.',
        exercises: [
            { name: 'Bench Press', target_sets: 4, target_reps: 8 },
            { name: 'Barbell Row', target_sets: 4, target_reps: 8 },
            { name: 'Overhead Press', target_sets: 3, target_reps: 10 },
            { name: 'Pull Up', target_sets: 3, target_reps: 10 }
        ]
    },
    {
        id: 'lower-body',
        name: 'Lower Body Focus',
        description: 'A strong lower body routine.',
        exercises: [
            { name: 'Barbell Squat', target_sets: 4, target_reps: 8 },
            { name: 'Romanian Deadlift', target_sets: 3, target_reps: 10 },
            { name: 'Leg Press', target_sets: 3, target_reps: 12 },
            { name: 'Calf Raise', target_sets: 4, target_reps: 15 }
        ]
    }
];

export default function TemplatesPage() {
    const router = useRouter();
    const [importingId, setImportingId] = useState<string | null>(null);
    const [importedId, setImportedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleImport(template: WorkoutTemplate) {
        setImportingId(template.id);
        setError(null);

        try {
            // 1. Fetch all exercises to match IDs by name
            const { data: dbExercises, error: exError } = await supabase
                .from('exercises')
                .select('id, name');

            if (exError || !dbExercises) throw new Error('Failed to load global exercises map.');

            // Create a map for quick lookup
            const exerciseMap = new Map(dbExercises.map(ex => [ex.name.toLowerCase(), ex.id]));

            // 2. Create the routine
            const { data: routine, error: routineErr } = await supabase
                .from('routines')
                .insert({
                    user_id: DEMO_USER_ID,
                    name: template.name,
                    description: template.description
                })
                .select()
                .single();

            if (routineErr || !routine) throw new Error('Failed to create new routine.');

            // 3. Map template exercises to valid IDs and prepare for insertion
            const routineExercises = template.exercises
                .map((ex, index) => {
                    const exerciseId = exerciseMap.get(ex.name.toLowerCase());
                    if (!exerciseId) return null; // Skip if we don't have this exercise in the DB
                    return {
                        routine_id: routine.id,
                        exercise_id: exerciseId,
                        order_index: index,
                        target_sets: ex.target_sets,
                        target_reps: ex.target_reps,
                        target_weight: null,
                    };
                })
                .filter(Boolean); // Remove nulls

            if (routineExercises.length > 0) {
                const { error: insertErr } = await supabase
                    .from('routine_exercises')
                    .insert(routineExercises);

                if (insertErr) throw new Error('Failed to insert exercises into routine.');
            }

            setImportedId(template.id);
            setTimeout(() => {
                router.push('/workouts');
            }, 1000);

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during import.';
            setError(errorMessage);
            setImportingId(null);
        }
    }

    return (
        <div>
            <PageHeader
                title="Workout Templates"
                subtitle="Import pre-built routines to kickstart your training"
            />

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {templates.map((template) => (
                    <div key={template.id} className="card p-6 flex flex-col h-full">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-gray-100 mb-2">{template.name}</h3>
                            <p className="text-sm text-gray-400">{template.description}</p>
                        </div>

                        <div className="flex-1 bg-gray-800/30 rounded-lg p-4 mb-6">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                                <Database className="w-4 h-4 text-violet-400" />
                                Exercises
                            </h4>
                            <ul className="space-y-2">
                                {template.exercises.map((ex, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-300">{ex.name}</span>
                                        <span className="text-gray-500 font-mono text-xs bg-gray-900 px-2 py-1 rounded">
                                            {ex.target_sets} × {ex.target_reps}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => handleImport(template)}
                            disabled={importingId !== null || importedId !== null}
                            className={`btn-primary w-full justify-center py-2.5 transition-all ${importedId === template.id
                                ? 'bg-emerald-600 hover:bg-emerald-600 border-emerald-500 text-white'
                                : ''
                                }`}
                        >
                            {importingId === template.id ? (
                                'Importing...'
                            ) : importedId === template.id ? (
                                <>
                                    <CheckCircle className="w-5 h-5 mr-1" />
                                    Imported!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4 mr-1" />
                                    Import Template
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
