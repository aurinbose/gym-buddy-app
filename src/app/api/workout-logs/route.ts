import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
    const { data, error } = await supabase
        .from('workout_logs')
        .select('*, routine:routines(name), workout_sets(*, exercise:exercises(name))')
        .eq('user_id', DEMO_USER_ID)
        .order('started_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { name, routine_id, notes, sets = [] } = body;

    if (!name?.trim()) {
        return NextResponse.json({ error: 'Workout name is required' }, { status: 400 });
    }

    const { data: log, error: logErr } = await supabase
        .from('workout_logs')
        .insert({
            user_id: DEMO_USER_ID,
            routine_id: routine_id || null,
            name,
            notes: notes || null,
            started_at: new Date().toISOString(),
            finished_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (logErr) return NextResponse.json({ error: logErr.message }, { status: 500 });

    if (sets.length > 0) {
        const workoutSets = sets.map((s: { exercise_id: string; set_number: number; reps?: number; weight?: number; notes?: string }) => ({
            workout_log_id: log.id,
            exercise_id: s.exercise_id,
            set_number: s.set_number,
            reps: s.reps ?? null,
            weight: s.weight ?? null,
            notes: s.notes ?? null,
        }));
        await supabase.from('workout_sets').insert(workoutSets);
    }

    return NextResponse.json(log, { status: 201 });
}
