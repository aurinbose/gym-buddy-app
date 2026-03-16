'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Dumbbell, BarChart3 } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

interface ProgressEntry {
    workout_date: string;
    max_weight: number;
    total_volume: number;
    total_reps: number;
    sets_count: number;
}

interface ExerciseProgress {
    exercise: Exercise;
    entries: ProgressEntry[];
    bestWeight: number;
    totalVolume: number;
}

export default function ProgressPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [progress, setProgress] = useState<ExerciseProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(false);

    useEffect(() => {
        async function fetchExercises() {
            // Get exercises that have been used in workout sets for this user
            const { data: logsData } = await supabase
                .from('workout_logs')
                .select('id')
                .eq('user_id', DEMO_USER_ID);

            const logIds = logsData?.map((l) => l.id) || [];

            if (logIds.length > 0) {
                const { data: setsData } = await supabase
                    .from('workout_sets')
                    .select('exercise_id')
                    .in('workout_log_id', logIds);

                const usedIds = [...new Set(setsData?.map((s) => s.exercise_id) || [])];

                if (usedIds.length > 0) {
                    const { data: exData } = await supabase
                        .from('exercises')
                        .select('*')
                        .in('id', usedIds)
                        .order('name');
                    if (exData) setExercises(exData);
                }
            }
            setLoading(false);
        }
        fetchExercises();
    }, []);

    async function loadProgress(exerciseId: string) {
        if (!exerciseId) return;
        setLoadingProgress(true);

        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return;

        // Get all workout sets for this exercise by this user
        const { data: logsData } = await supabase
            .from('workout_logs')
            .select('id, started_at')
            .eq('user_id', DEMO_USER_ID)
            .order('started_at', { ascending: true });

        const logIds = logsData?.map((l) => l.id) || [];
        if (logIds.length === 0) {
            setProgress({ exercise, entries: [], bestWeight: 0, totalVolume: 0 });
            setLoadingProgress(false);
            return;
        }

        const { data: setsData } = await supabase
            .from('workout_sets')
            .select('*')
            .eq('exercise_id', exerciseId)
            .in('workout_log_id', logIds);

        // Group by workout date
        const byLog: Record<string, { maxWeight: number; totalReps: number; totalVolume: number; setsCount: number }> =
            {};

        logsData?.forEach((log) => {
            const logSets = setsData?.filter((s) => s.workout_log_id === log.id) || [];
            if (logSets.length === 0) return;

            const date = new Date(log.started_at).toISOString().split('T')[0];
            const maxWeight = Math.max(...logSets.map((s) => Number(s.weight) || 0));
            const totalReps = logSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0);
            const totalVolume = logSets.reduce(
                (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
                0
            );

            byLog[date] = {
                maxWeight,
                totalReps,
                totalVolume,
                setsCount: logSets.length,
            };
        });

        const entries: ProgressEntry[] = Object.entries(byLog).map(([date, data]) => ({
            workout_date: date,
            max_weight: data.maxWeight,
            total_volume: data.totalVolume,
            total_reps: data.totalReps,
            sets_count: data.setsCount,
        }));

        const bestWeight = Math.max(...entries.map((e) => e.max_weight), 0);
        const totalVolume = entries.reduce((sum, e) => sum + e.total_volume, 0);

        setProgress({ exercise, entries, bestWeight, totalVolume });
        setLoadingProgress(false);
    }

    return (
        <div>
            <PageHeader
                title="Progress"
                subtitle="Track your strength gains over time"
            />

            {loading ? (
                <LoadingSpinner />
            ) : (
                <div className="space-y-6">
                    {/* Exercise Selector */}
                    <div className="card p-6">
                        <label className="label">Select Exercise to Track</label>
                        {exercises.length === 0 ? (
                            <p className="text-gray-500 text-sm mt-2">
                                No workout data yet. Log some workouts first to see your progress.
                            </p>
                        ) : (
                            <select
                                className="input max-w-md"
                                value={selectedExercise}
                                onChange={(e) => {
                                    setSelectedExercise(e.target.value);
                                    loadProgress(e.target.value);
                                }}
                            >
                                <option value="">— Choose an exercise —</option>
                                {exercises.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {loadingProgress ? (
                        <LoadingSpinner />
                    ) : progress ? (
                        <>
                            {/* Summary stats */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="card p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4 text-violet-400" />
                                        <span className="text-sm text-gray-400">Best Weight</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-100">
                                        {progress.bestWeight > 0 ? `${progress.bestWeight} kg` : '—'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Personal Record</p>
                                </div>
                                <div className="card p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 className="w-4 h-4 text-pink-400" />
                                        <span className="text-sm text-gray-400">Total Volume</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-100">
                                        {progress.totalVolume > 0 ? `${progress.totalVolume.toLocaleString()} kg` : '—'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Across all sessions</p>
                                </div>
                                <div className="card p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                                        <span className="text-sm text-gray-400">Sessions</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-100">{progress.entries.length}</p>
                                    <p className="text-xs text-gray-500 mt-1">Times performed</p>
                                </div>
                            </div>

                            {/* Progress Chart (visual bar chart) */}
                            {progress.entries.length > 0 ? (
                                <div className="card p-6">
                                    <h3 className="text-base font-semibold text-gray-200 mb-6">
                                        Weight Progression — {progress.exercise.name}
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={progress.entries.map(e => ({
                                                    date: new Date(e.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                                    weight: e.max_weight
                                                }))}
                                                margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#e5e7eb' }}
                                                    itemStyle={{ color: '#c4b5fd', fontWeight: 600 }}
                                                    labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }}
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    formatter={(value: any) => [`${value} kg`, 'Max Weight']}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="weight"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#1f2937', stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                                    activeDot={{ r: 6, fill: '#ec4899', stroke: '#1f2937', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : (
                                <div className="card p-8 text-center">
                                    <p className="text-gray-500">No sets logged for this exercise yet.</p>
                                </div>
                            )}

                            {/* Session history table */}
                            {progress.entries.length > 0 && (
                                <div className="card p-6">
                                    <h3 className="text-base font-semibold text-gray-200 mb-4">Session History</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-800">
                                                    <th className="text-left text-gray-500 font-medium pb-3">Date</th>
                                                    <th className="text-right text-gray-500 font-medium pb-3">Max Weight</th>
                                                    <th className="text-right text-gray-500 font-medium pb-3">Total Reps</th>
                                                    <th className="text-right text-gray-500 font-medium pb-3">Volume</th>
                                                    <th className="text-right text-gray-500 font-medium pb-3">Sets</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/50">
                                                {progress.entries.map((entry, i) => (
                                                    <tr key={i} className="hover:bg-gray-800/20">
                                                        <td className="py-3 text-gray-300">
                                                            {new Date(entry.workout_date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <span className="font-semibold text-violet-300">{entry.max_weight} kg</span>
                                                        </td>
                                                        <td className="py-3 text-right text-gray-300">{entry.total_reps}</td>
                                                        <td className="py-3 text-right text-gray-300">
                                                            {entry.total_volume.toLocaleString()} kg
                                                        </td>
                                                        <td className="py-3 text-right text-gray-400">{entry.sets_count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}
