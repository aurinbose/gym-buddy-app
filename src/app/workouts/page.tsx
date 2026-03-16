'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell, Trash2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function WorkoutsPage() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        fetchRoutines();
    }, []);

    async function fetchRoutines() {
        const { data } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', DEMO_USER_ID)
            .order('created_at', { ascending: false });
        if (data) setRoutines(data);
        setLoading(false);
    }

    async function deleteRoutine(id: string) {
        setDeleting(id);
        await supabase.from('routines').delete().eq('id', id);
        setRoutines((prev) => prev.filter((r) => r.id !== id));
        setDeleting(null);
    }

    return (
        <div>
            <PageHeader
                title="Workouts"
                subtitle="Manage your training routines"
                action={
                    <Link href="/create-workout" className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Create Routine
                    </Link>
                }
            />

            {loading ? (
                <LoadingSpinner />
            ) : routines.length === 0 ? (
                <EmptyState
                    title="No routines yet"
                    description="Create your first workout routine to get started with structured training."
                    icon={<Dumbbell className="w-12 h-12" />}
                    action={
                        <Link href="/create-workout" className="btn-primary">
                            <Plus className="w-4 h-4" />
                            Create Routine
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {routines.map((routine) => (
                        <div key={routine.id} className="card card-hover p-6 flex flex-col gap-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-100 truncate">{routine.name}</h3>
                                    {routine.description && (
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                            {routine.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => deleteRoutine(routine.id)}
                                    disabled={deleting === routine.id}
                                    className="ml-3 p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="text-xs text-gray-500">
                                Created {new Date(routine.created_at).toLocaleDateString()}
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <Link
                                    href={`/log-workout?routine=${routine.id}`}
                                    className="btn-primary flex-1 justify-center text-sm py-2"
                                >
                                    Start Workout
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
