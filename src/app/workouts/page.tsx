'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell, Trash2, Play, ChevronDown, ChevronUp, Calendar, Edit2, Download } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Routine, RoutineDay } from '@/types';
import { downloadRoutinePDF } from '@/lib/pdfGenerator';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function WorkoutsPage() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => { 
        if (user) fetchRoutines(); 
    }, [user]);

    async function fetchRoutines() {
        if (!user) return;
        const { data } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (data) setRoutines(data as Routine[]);
        setLoading(false);
    }

    async function deleteRoutine(id: string) {
        setDeleting(id);
        await supabase.from('routines').delete().eq('id', id);
        setRoutines((prev) => prev.filter((r) => r.id !== id));
        setDeleting(null);
    }

    function toggleExpand(id: string) {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }

    return (
        <div style={{ padding: '0 16px 100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 24, paddingBottom: 16 }}>
                <div>
                    <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: 0 }}>Your Training</p>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0 }}>Routines</h1>
                </div>
                <Link
                    href="/create-workout"
                    style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#FF6B35',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 0 16px rgba(255,107,53,0.4)'
                    }}
                >
                    <Plus size={20} color="#fff" />
                </Link>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : routines.length === 0 ? (
                <EmptyState
                    title="No routines yet"
                    description="Create your first workout routine to get started."
                    icon={<Dumbbell size={28} />}
                    action={
                        <Link href="/create-workout" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '10px 20px' }}>
                            <Plus size={16} /> Create Routine
                        </Link>
                    }
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {routines.map((routine) => {
                        const schedule: RoutineDay[] | undefined = routine.schedule;
                        const activeDays = schedule?.filter(d => d.name !== 'Rest');
                        const isExpanded = expanded.has(routine.id);

                        return (
                            <div
                                key={routine.id}
                                className="card"
                                style={{ borderRadius: 20, overflow: 'hidden', position: 'relative' }}
                            >
                                {/* Color bar */}
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#FF6B35', borderRadius: '20px 0 0 20px' }} />

                                <div style={{ padding: '18px 18px 14px 22px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {routine.name}
                                            </h3>
                                            {routine.description && (
                                                <p style={{ fontSize: '0.78rem', color: '#8A91A8', margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {routine.description}
                                                </p>
                                            )}

                                            {/* Weekly schedule preview pills */}
                                            {schedule && activeDays && activeDays.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                                                    {activeDays.map(d => (
                                                        <span
                                                            key={d.day}
                                                            style={{
                                                                fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px',
                                                                borderRadius: 99, background: d.color + '22',
                                                                color: d.color, border: `1px solid ${d.color}44`,
                                                            }}
                                                        >
                                                            {d.day} · {d.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Action row */}
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <Link
                                                    href={`/log-workout?routine=${routine.id}`}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                                        background: '#FF6B35', color: '#fff', fontWeight: 600,
                                                        fontSize: '0.8rem', padding: '8px 16px', borderRadius: 999,
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    <Play size={12} fill="#fff" /> Start
                                                </Link>

                                                {/* Expand schedule details */}
                                                {schedule && schedule.length > 0 && (
                                                    <button
                                                        onClick={() => toggleExpand(routine.id)}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: 4,
                                                            background: '#161B22', border: '1px solid #252B36',
                                                            color: '#8A91A8', fontSize: '0.72rem', fontWeight: 600,
                                                            padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
                                                        }}
                                                    >
                                                        <Calendar size={11} />
                                                        Schedule
                                                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => downloadRoutinePDF(routine)}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 4,
                                                        background: 'none', border: 'none',
                                                        color: '#8A91A8', fontSize: '0.72rem', fontWeight: 600,
                                                        padding: '7px 12px', cursor: 'pointer',
                                                    }}
                                                >
                                                    <Download size={11} />
                                                    Export PDF
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <Link
                                                href={`/create-workout?edit=${routine.id}`}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: 8, borderRadius: 10,
                                                    color: '#5A6175', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </Link>
                                            <button
                                                onClick={() => deleteRoutine(routine.id)}
                                                disabled={deleting === routine.id}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: 8, borderRadius: 10,
                                                    color: '#5A6175', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded weekly schedule */}
                                    {isExpanded && schedule && (
                                        <div style={{ marginTop: 14, borderTop: '1px solid #252B36', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {schedule.map(d => (
                                                <div
                                                    key={d.day}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                                                >
                                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: d.color, width: 30, flexShrink: 0 }}>{d.day}</span>
                                                    <div style={{
                                                        flex: 1, height: 1,
                                                        background: d.name === 'Rest' ? '#252B36' : d.color + '44'
                                                    }} />
                                                    <span style={{
                                                        fontSize: '0.75rem', fontWeight: 600,
                                                        color: d.name === 'Rest' ? '#5A6175' : d.color,
                                                        padding: '3px 10px', borderRadius: 99,
                                                        background: d.name === 'Rest' ? '#161B22' : d.color + '1A',
                                                    }}>
                                                        {d.name}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
