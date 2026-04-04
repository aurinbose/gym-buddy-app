'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Calendar, Dumbbell, Edit2, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface ExerciseData { name: string; }
interface SetData { id: string; set_number: number; reps: number; weight: number; exercise_id: string; exercise: ExerciseData; }
interface WorkoutLog { id: string; name: string; notes: string | null; started_at: string; finished_at: string | null; workout_sets: SetData[]; }

function WorkoutCard({ log, onDelete, deleting }: { log: WorkoutLog; onDelete: (id: string) => void; deleting: string | null }) {
    const [expanded, setExpanded] = useState(false);

    const dateStr = new Date(log.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const totalVolume = log.workout_sets?.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0) || 0;
    const exerciseGroups: Record<string, { exerciseName: string; sets: SetData[] }> = {};
    log.workout_sets?.forEach(set => {
        if (!exerciseGroups[set.exercise_id]) {
            exerciseGroups[set.exercise_id] = { exerciseName: set.exercise?.name || 'Unknown', sets: [] };
        }
        exerciseGroups[set.exercise_id].sets.push(set);
    });
    Object.values(exerciseGroups).forEach(g => g.sets.sort((a, b) => a.set_number - b.set_number));

    return (
        <div className="card" style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                        background: 'rgba(255,107,53,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Dumbbell size={20} color="#FF6B35" />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.name}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <Calendar size={12} color="#8A91A8" />
                            <span style={{ fontSize: '0.75rem', color: '#8A91A8' }}>{dateStr}</span>
                        </div>
                        {totalVolume > 0 && (
                            <span style={{
                                fontSize: '0.7rem', fontWeight: 600, color: '#FF6B35',
                                background: 'rgba(255,107,53,0.12)', padding: '2px 8px', borderRadius: 99, display: 'inline-block', marginTop: 4
                            }}>
                                {totalVolume.toLocaleString()} kg volume
                            </span>
                        )}
                    </div>
                </div>
                <div style={{ flexShrink: 0, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Link
                        href={`/log-workout?edit=${log.id}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#5A6175', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                    >
                        <Edit2 size={16} />
                    </Link>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(log.id); }}
                        disabled={deleting === log.id}
                        style={{ color: '#5A6175', border: 'none', background: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Trash2 size={16} />
                    </button>
                    <div style={{ color: '#5A6175', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #252B36' }}>
                    {log.notes && (
                        <p style={{ fontSize: '0.8rem', color: '#8A91A8', fontStyle: 'italic', padding: '12px 0 8px' }}>
                            &ldquo;{log.notes}&rdquo;
                        </p>
                    )}
                    {Object.values(exerciseGroups).length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#5A6175', textAlign: 'center', padding: '16px 0' }}>No exercises logged.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
                            {Object.values(exerciseGroups).map((group, idx) => (
                                <div key={idx}>
                                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', margin: '0 0 8px' }}>{group.exerciseName}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: '6px 0', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#5A6175', fontWeight: 600 }}>Set</span>
                                        <span style={{ color: '#5A6175', textAlign: 'center', fontWeight: 600 }}>Reps</span>
                                        <span style={{ color: '#5A6175', textAlign: 'center', fontWeight: 600 }}>Weight</span>
                                        {group.sets.map(set => (
                                            <>
                                                <span key={`s-${set.id}`} style={{ color: '#8A91A8', padding: '3px 0' }}>{set.set_number}</span>
                                                <span key={`r-${set.id}`} style={{ color: '#fff', textAlign: 'center', padding: '3px 0', fontWeight: 600 }}>{set.reps || '—'}</span>
                                                <span key={`w-${set.id}`} style={{ color: '#FF6B35', textAlign: 'center', padding: '3px 0', fontWeight: 600 }}>{set.weight ? `${set.weight}kg` : '—'}</span>
                                            </>
                                        ))}
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
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);


    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    async function handleDeleteLog(id: string) {
        setDeleting(id);
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (!error) {
            setLogs(prev => prev.filter(log => log.id !== id));
        }
        setDeleting(null);
    }

    useEffect(() => {
        async function fetchHistory() {
            if (!user) return;
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*, workout_sets(*, exercise:exercises(name))')
                .eq('user_id', user.id)
                .order('started_at', { ascending: false });
            if (data && !error) setLogs(data);
            setLoading(false);
        }
        fetchHistory();
    }, [user]);

    return (
        <div style={{ padding: '0 16px 100px' }}>
            <div style={{ paddingTop: 24, paddingBottom: 16 }}>
                <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: 0 }}>All Sessions</p>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0 }}>History</h1>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : logs.length === 0 ? (
                <EmptyState
                    title="No workouts yet"
                    description="Your workout history will appear here once you log your first session."
                    icon={<Calendar size={28} />}
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {logs.map(log => <WorkoutCard key={log.id} log={log} onDelete={handleDeleteLog} deleting={deleting} />)}
                </div>
            )}
        </div>
    );
}
