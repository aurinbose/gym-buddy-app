'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Dumbbell, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { Exercise } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ProgressEntry { workout_date: string; max_weight: number; total_volume: number; total_reps: number; sets_count: number; est_1rm: number; }
interface ExerciseProgress { exercise: Exercise; entries: ProgressEntry[]; bestWeight: number; totalVolume: number; best1RM: number; }

type ChartMetric = 'weight' | 'volume' | '1rm';

export default function ProgressPage() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExercise, setSelectedExercise] = useState('');
    const [progress, setProgress] = useState<ExerciseProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [metric, setMetric] = useState<ChartMetric>('weight');
    const { user, loading: authLoading, profile } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchExercises() {
            if (!user) return;
            const { data: logsData } = await supabase.from('workout_logs').select('id').eq('user_id', user.id);
            const logIds = logsData?.map((l) => l.id) || [];
            if (logIds.length > 0) {
                const { data: setsData } = await supabase.from('workout_sets').select('exercise_id').in('workout_log_id', logIds);
                const usedIds = [...new Set(setsData?.map((s) => s.exercise_id) || [])];
                if (usedIds.length > 0) {
                    const { data: exData } = await supabase.from('exercises').select('*').in('id', usedIds).order('name');
                    if (exData) setExercises(exData);
                }
            }
            setLoading(false);
        }
        if (user) fetchExercises();
    }, [user]);

    async function loadProgress(exerciseId: string) {
        if (!exerciseId || !user) return;
        setLoadingProgress(true);
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return;

        const { data: logsData } = await supabase.from('workout_logs').select('id, started_at').eq('user_id', user.id).order('started_at', { ascending: true });
        const logIds = logsData?.map((l) => l.id) || [];
        if (logIds.length === 0) { setProgress({ exercise, entries: [], bestWeight: 0, totalVolume: 0, best1RM: 0 }); setLoadingProgress(false); return; }

        const { data: setsData } = await supabase.from('workout_sets').select('*').eq('exercise_id', exerciseId).in('workout_log_id', logIds);
        const byLog: Record<string, { maxWeight: number; totalReps: number; totalVolume: number; setsCount: number; est1rm: number }> = {};

        logsData?.forEach((log) => {
            const logSets = setsData?.filter((s: { workout_log_id: string; exercise_id: string; set_number: number; reps: number | null; weight: number | null }) => s.workout_log_id === log.id) || [];
            if (logSets.length === 0) return;
            const date = new Date(log.started_at).toISOString().split('T')[0];
            const best1rmInSession = Math.max(...logSets.map((s) => {
                const w = Number(s.weight) || 0;
                const r = Number(s.reps) || 0;
                return r > 0 ? w * (1 + r / 30) : 0;
            }));
            byLog[date] = {
                maxWeight: Math.max(...logSets.map((s) => Number(s.weight) || 0)),
                totalReps: logSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0),
                totalVolume: logSets.reduce((sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0),
                setsCount: logSets.length,
                est1rm: Math.round(best1rmInSession * 10) / 10,
            };
        });

        const entries: ProgressEntry[] = Object.entries(byLog).map(([date, data]) => ({
            workout_date: date, max_weight: data.maxWeight, total_volume: data.totalVolume,
            total_reps: data.totalReps, sets_count: data.setsCount, est_1rm: data.est1rm,
        }));
        const best1RM = Math.max(...entries.map((e) => e.est_1rm), 0);
        setProgress({ exercise, entries, bestWeight: Math.max(...entries.map((e) => e.max_weight), 0), totalVolume: entries.reduce((sum, e) => sum + e.total_volume, 0), best1RM });
        setLoadingProgress(false);
    }

    const unit = profile?.weight_unit || 'kg';
    const metricColor: Record<ChartMetric, string> = { weight: '#FF6B35', volume: '#C8FF00', '1rm': '#A78BFA' };
    const metricLabel: Record<ChartMetric, string> = { weight: 'Max Weight', volume: 'Volume', '1rm': 'Est. 1RM' };
    const chartData = progress?.entries.map((e: ProgressEntry) => ({
        date: new Date(e.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: metric === 'weight' ? e.max_weight : metric === 'volume' ? e.total_volume : e.est_1rm,
    })) ?? [];

    return (
        <div style={{ padding: '0 16px 100px' }}>
            <div style={{ paddingTop: 24, paddingBottom: 16 }}>
                <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: 0 }}>Track Your Gains</p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0 }}>Progress</h1>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Exercise selector */}
                    <div className="card" style={{ padding: 16, borderRadius: 20 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Select Exercise</p>
                        {exercises.length === 0 ? (
                            <EmptyState title="No data yet" description="Log some workouts first to track your progress." icon={<TrendingUp size={28} />} />
                        ) : (
                            <select
                                style={{ background: '#1E2430', border: '1px solid #252B36', borderRadius: 14, padding: '12px 16px', color: '#fff', fontSize: '0.9rem', outline: 'none', width: '100%', appearance: 'none' }}
                                value={selectedExercise}
                                onChange={(e) => { setSelectedExercise(e.target.value); loadProgress(e.target.value); }}
                            >
                                <option value="">— Choose an exercise —</option>
                                {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        )}
                    </div>

                    {loadingProgress ? <LoadingSpinner /> : progress ? (
                        <>
                            {/* Stats row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Best Weight', value: progress.bestWeight > 0 ? `${progress.bestWeight}${profile?.weight_unit || 'kg'}` : '—', icon: TrendingUp, color: '#FF6B35' },
                                    { label: 'Est. 1RM', value: progress.best1RM > 0 ? `${progress.best1RM}${profile?.weight_unit || 'kg'}` : '—', icon: BarChart3, color: '#C8FF00' },
                                    { label: 'Sessions', value: progress.entries.length, icon: Dumbbell, color: '#60A5FA' },
                                ].map(({ label, value, icon: Icon, color }) => (
                                    <div key={label} className="card" style={{ padding: '14px 12px', borderRadius: 18, textAlign: 'center' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                            <Icon size={16} color={color} />
                                        </div>
                                        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{value}</p>
                                        <p style={{ fontSize: '0.65rem', color: '#8A91A8', margin: 0, fontWeight: 500 }}>{label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Metric switcher */}
                            <div style={{ display: 'flex', background: '#161B22', borderRadius: 14, padding: 4, gap: 4, border: '1px solid #252B36' }}>
                                {([
                                    { key: 'weight' as ChartMetric, label: 'Max Weight' },
                                    { key: 'volume' as ChartMetric, label: 'Volume' },
                                    { key: '1rm' as ChartMetric, label: 'Est. 1RM' },
                                ] as { key: ChartMetric; label: string }[]).map(({ key, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setMetric(key)}
                                        style={{
                                            flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                            background: metric === key ? '#FF6B35' : 'transparent',
                                            color: metric === key ? '#fff' : '#8A91A8',
                                            transition: 'all 0.18s',
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Chart */}
                            {progress.entries.length > 0 ? (
                                    <div className="card" style={{ padding: 16, borderRadius: 20 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 4px' }}>{metricLabel[metric]} Progression</p>
                                        <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: '0 0 16px' }}>{progress.exercise.name}</p>
                                        <div style={{ height: 200, width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#252B36" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#5A6175" tick={{ fill: '#8A91A8', fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#5A6175" tick={{ fill: '#8A91A8', fontSize: 11 }} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1E2430', border: '1px solid #252B36', borderRadius: 12, color: '#fff' }}
                                                        itemStyle={{ color: metricColor[metric], fontWeight: 600 }}
                                                        labelStyle={{ color: '#fff', marginBottom: 4 }}
                                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                        formatter={(value: any) => [`${value} ${unit}`, metricLabel[metric]]}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke={metricColor[metric]} strokeWidth={2.5}
                                                        dot={{ fill: '#0D1117', stroke: metricColor[metric], strokeWidth: 2, r: 4 }}
                                                        activeDot={{ r: 6, fill: metricColor[metric], stroke: '#0D1117', strokeWidth: 2 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                            ) : (
                                <div className="card" style={{ padding: 24, borderRadius: 20, textAlign: 'center' }}>
                                    <p style={{ color: '#8A91A8', fontSize: '0.85rem' }}>No sets logged for this exercise yet.</p>
                                </div>
                            )}

                            {/* History table */}
                            {progress.entries.length > 0 && (
                                <div className="card" style={{ padding: 16, borderRadius: 20 }}>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: '0 0 14px' }}>Session History</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 12px', paddingBottom: 8, borderBottom: '1px solid #252B36', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600, textTransform: 'uppercase' }}>Date</span>
                                            <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Max Wt</span>
                                            <span style={{ fontSize: '0.7rem', color: '#5A6175', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Volume</span>
                                        </div>
                                        {progress.entries.map((entry, i) => (
                                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 12px', padding: '8px 0', borderBottom: i < progress.entries.length - 1 ? '1px solid #1E2430' : 'none' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#8A91A8' }}>
                                                    {new Date(entry.workout_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF6B35', textAlign: 'right' }}>{entry.max_weight}{profile?.weight_unit || 'kg'}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#8A91A8', textAlign: 'right' }}>{entry.total_volume.toLocaleString()}{profile?.weight_unit || 'kg'}</span>
                                            </div>
                                        ))}
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
