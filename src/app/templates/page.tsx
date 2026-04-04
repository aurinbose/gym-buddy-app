'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, CheckCircle, Database } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';


interface TemplateExercise { name: string; target_sets: number; target_reps: string | number; }
interface WorkoutTemplate { id: string; name: string; description: string; tag: string; exercises: TemplateExercise[]; }

const templates: WorkoutTemplate[] = [
    {
        id: 'beginner-a', name: 'Beginner Full Body A', tag: 'Beginner',
        description: 'A beginner-friendly full body workout focusing on compound movements.',
        exercises: [
            { name: 'Barbell Squat', target_sets: 3, target_reps: 5 },
            { name: 'Bench Press', target_sets: 3, target_reps: 5 },
            { name: 'Barbell Row', target_sets: 3, target_reps: 5 },
        ]
    },
    {
        id: 'beginner-b', name: 'Beginner Full Body B', tag: 'Beginner',
        description: 'The second day of the beginner full body program.',
        exercises: [
            { name: 'Deadlift', target_sets: 1, target_reps: 5 },
            { name: 'Overhead Press', target_sets: 3, target_reps: 5 },
            { name: 'Pull Up', target_sets: 3, target_reps: 8 },
        ]
    },
    {
        id: 'upper-body', name: 'Upper Body Strength', tag: 'Intermediate',
        description: 'A comprehensive upper body strength routine.',
        exercises: [
            { name: 'Bench Press', target_sets: 4, target_reps: 8 },
            { name: 'Barbell Row', target_sets: 4, target_reps: 8 },
            { name: 'Overhead Press', target_sets: 3, target_reps: 10 },
            { name: 'Pull Up', target_sets: 3, target_reps: 10 },
        ]
    },
    {
        id: 'lower-body', name: 'Lower Body Power', tag: 'Intermediate',
        description: 'A strong lower body routine targeting legs and glutes.',
        exercises: [
            { name: 'Barbell Squat', target_sets: 4, target_reps: 8 },
            { name: 'Romanian Deadlift', target_sets: 3, target_reps: 10 },
            { name: 'Leg Press', target_sets: 3, target_reps: 12 },
            { name: 'Calf Raise', target_sets: 4, target_reps: 15 },
        ]
    },
];

const tagColors: Record<string, { bg: string; text: string }> = {
    Beginner: { bg: 'rgba(200,255,0,0.12)', text: '#C8FF00' },
    Intermediate: { bg: 'rgba(255,107,53,0.12)', text: '#FF6B35' },
};

export default function TemplatesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);


    const [importingId, setImportingId] = useState<string | null>(null);
    const [importedId, setImportedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleImport(template: WorkoutTemplate) {
        setImportingId(template.id); setError(null);
        try {
            const { data: dbExercises, error: exError } = await supabase.from('exercises').select('id, name');
            if (exError || !dbExercises) throw new Error('Failed to load exercises.');

            const exerciseMap = new Map(dbExercises.map(ex => [ex.name.toLowerCase(), ex.id]));

            const { data: routine, error: routineErr } = await supabase.from('routines').insert({
                user_id: user?.id, name: template.name, description: template.description
            }).select().single();

            if (routineErr || !routine) throw new Error('Failed to create routine.');

            const routineExercises = template.exercises
                .map((ex, index) => {
                    const exerciseId = exerciseMap.get(ex.name.toLowerCase());
                    if (!exerciseId) return null;
                    return { routine_id: routine.id, exercise_id: exerciseId, order_index: index, target_sets: ex.target_sets, target_reps: String(ex.target_reps), target_weight: null };
                })
                .filter(Boolean);

            if (routineExercises.length > 0) {
                const { error: insertErr } = await supabase.from('routine_exercises').insert(routineExercises);
                if (insertErr) throw new Error('Failed to insert exercises.');
            }

            setImportedId(template.id);
            setTimeout(() => router.push('/workouts'), 1000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setImportingId(null);
        }
    }

    return (
        <div style={{ padding: '0 16px 100px' }}>
            <div style={{ paddingTop: 24, paddingBottom: 16 }}>
                <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: 0 }}>Ready-made Plans</p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0 }}>Templates</h1>
            </div>

            {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(255,69,69,0.1)', border: '1px solid rgba(255,69,69,0.25)', borderRadius: 14, marginBottom: 14, fontSize: '0.85rem', color: '#FF4545' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {templates.map((template) => {
                    const tagStyle = tagColors[template.tag] || tagColors.Beginner;
                    return (
                        <div key={template.id} className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
                            {/* Header */}
                            <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #252B36' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, flex: 1, marginRight: 12 }}>{template.name}</h3>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', padding: '4px 10px', borderRadius: 99, background: tagStyle.bg, color: tagStyle.text, flexShrink: 0 }}>
                                        {template.tag}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: 0, lineHeight: 1.5 }}>{template.description}</p>
                            </div>

                            {/* Exercise list */}
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                    <Database size={13} color="#FF6B35" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#8A91A8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {template.exercises.length} Exercises
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {template.exercises.map((ex, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>{ex.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#8A91A8', background: '#1E2430', padding: '3px 10px', borderRadius: 99, fontFamily: 'monospace' }}>
                                                {ex.target_sets}×{ex.target_reps}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CTA */}
                            <div style={{ padding: '0 16px 16px' }}>
                                <button
                                    onClick={() => handleImport(template)}
                                    disabled={importingId !== null || importedId !== null}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        background: importedId === template.id ? 'rgba(200,255,0,0.12)' : '#FF6B35',
                                        color: importedId === template.id ? '#C8FF00' : '#fff',
                                        border: importedId === template.id ? '1px solid rgba(200,255,0,0.25)' : 'none',
                                        borderRadius: 999, padding: '12px', fontWeight: 600, fontSize: '0.9rem', cursor: importingId !== null || importedId !== null ? 'not-allowed' : 'pointer',
                                        opacity: importingId !== null && importingId !== template.id ? 0.5 : 1,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {importingId === template.id ? 'Importing...' : importedId === template.id ? (
                                        <><CheckCircle size={16} /> Imported!</>
                                    ) : (
                                        <><Copy size={15} /> Import Template</>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
