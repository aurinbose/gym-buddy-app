'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Dumbbell, Trash2, Play } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
import { Routine } from '@/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function WorkoutsPage() {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => { fetchRoutines(); }, []);

    async function fetchRoutines() {
        const { data } = await supabase.from('routines').select('*').eq('user_id', DEMO_USER_ID).order('created_at', { ascending: false });
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
                    {routines.map((routine) => (
                        <div
                            key={routine.id}
                            className="card"
                            style={{ padding: '18px', borderRadius: 20, overflow: 'hidden', position: 'relative' }}
                        >
                            {/* Orange accent bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#FF6B35', borderRadius: '20px 0 0 20px' }} />

                            <div style={{ paddingLeft: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {routine.name}
                                    </h3>
                                    {routine.description ? (
                                        <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: '0 0 12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {routine.description}
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '0.75rem', color: '#5A6175', margin: '0 0 12px' }}>
                                            {new Date(routine.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: 8 }}>
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
                                    </div>
                                </div>
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
                    ))}
                </div>
            )}
        </div>
    );
}
