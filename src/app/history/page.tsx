'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Clock, Dumbbell } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface ExerciseData {
    name: string;
}

interface SetData {
    id: string;
    set_number: number;
    reps: number;
    weight: number;
    exercise_id: string;
    exercise: ExerciseData;
}

interface WorkoutLog {
    id: string;
    name: string;
    notes: string | null;
    started_at: string;
    finished_at: string | null;
    workout_sets: SetData[];
}

function ExpandableWorkoutCard({ log }: { log: WorkoutLog }) {
    const [expanded, setExpanded] = useState(false);

    const dateStr = new Date(log.started_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const timeStr = new Date(log.started_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });

    // Group sets by exercise
    const exerciseGroups: Record<string, { exerciseName: string, sets: SetData[] }> = {};
    log.workout_sets?.forEach(set => {
        if (!exerciseGroups[set.exercise_id]) {
            exerciseGroups[set.exercise_id] = {
                exerciseName: set.exercise?.name || 'Unknown Exercise',
                sets: []
            };
        }
        exerciseGroups[set.exercise_id].sets.push(set);
    });

    // Sort sets by set_number
    Object.values(exerciseGroups).forEach(group => {
        group.sets.sort((a, b) => a.set_number - b.set_number);
    });

    const totalVolume = log.workout_sets?.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0) || 0;

    return (
        <div className="card w-full mb-4 overflow-hidden">
            <div
                className="p-5 flex items-start sm:items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-lg font-bold text-gray-100 mb-1">{log.name}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {dateStr}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {timeStr}
                        </div>
                        <div className="flex items-center gap-1.5 text-violet-400">
                            <Dumbbell className="w-4 h-4" />
                            {totalVolume.toLocaleString()} kg volume
                        </div>
                    </div>
                </div>
                <div className="p-2 text-gray-500">
                    {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </div>

            {expanded && (
                <div className="p-5 border-t border-gray-800 bg-gray-900/30">
                    {log.notes && (
                        <p className="text-sm text-gray-400 mb-6 italic">&quot;{log.notes}&quot;</p>
                    )}

                    {Object.values(exerciseGroups).length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No exercises logged.</p>
                    ) : (
                        <div className="space-y-6">
                            {Object.values(exerciseGroups).map((group, idx) => (
                                <div key={idx}>
                                    <h4 className="font-semibold text-gray-200 mb-3">{group.exerciseName}</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-800">
                                                    <th className="text-center text-gray-500 font-medium pb-2 w-16">Set</th>
                                                    <th className="text-center text-gray-500 font-medium pb-2">Reps</th>
                                                    <th className="text-center text-gray-500 font-medium pb-2">Weight (kg)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/50">
                                                {group.sets.map((set) => (
                                                    <tr key={set.id} className="hover:bg-gray-800/20">
                                                        <td className="py-2.5 text-center text-gray-400 font-medium">{set.set_number}</td>
                                                        <td className="py-2.5 text-center text-gray-300">{set.reps || '-'}</td>
                                                        <td className="py-2.5 text-center text-violet-300 font-medium">{set.weight || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function HistoryPage() {
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*, workout_sets(*, exercise:exercises(name))')
                .eq('user_id', DEMO_USER_ID)
                .order('started_at', { ascending: false });

            if (data && !error) {
                setLogs(data);
            }
            setLoading(false);
        }

        fetchHistory();
    }, []);

    return (
        <div>
            <PageHeader
                title="Workout History"
                subtitle="Review your past training sessions"
            />

            {loading ? (
                <LoadingSpinner />
            ) : logs.length === 0 ? (
                <EmptyState
                    title="No workouts yet"
                    description="Your workout history will appear here once you log your first session."
                    icon={<Calendar className="w-12 h-12" />}
                />
            ) : (
                <div className="max-w-4xl mx-auto">
                    {logs.map(log => (
                        <ExpandableWorkoutCard key={log.id} log={log} />
                    ))}
                </div>
            )}
        </div>
    );
}
