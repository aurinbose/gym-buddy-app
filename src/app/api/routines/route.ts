import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET() {
    const { data, error } = await supabase
        .from('routines')
        .select('*, routine_exercises(*, exercise:exercises(*))')
        .eq('user_id', DEMO_USER_ID)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { name, description, exercises = [] } = body;

    if (!name?.trim()) {
        return NextResponse.json({ error: 'Routine name is required' }, { status: 400 });
    }

    const { data: routine, error: routineErr } = await supabase
        .from('routines')
        .insert({ user_id: DEMO_USER_ID, name, description })
        .select()
        .single();

    if (routineErr) return NextResponse.json({ error: routineErr.message }, { status: 500 });

    if (exercises.length > 0) {
        const routineExercises = exercises.map((ex: { exercise_id: string; target_sets?: number; target_reps?: number; target_weight?: number }, i: number) => ({
            routine_id: routine.id,
            exercise_id: ex.exercise_id,
            order_index: i,
            target_sets: ex.target_sets ?? 3,
            target_reps: ex.target_reps ?? 10,
            target_weight: ex.target_weight ?? null,
        }));
        await supabase.from('routine_exercises').insert(routineExercises);
    }

    return NextResponse.json(routine, { status: 201 });
}
