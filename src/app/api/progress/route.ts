import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exercise_id');

    if (!exerciseId) {
        return NextResponse.json({ error: 'exercise_id query param required' }, { status: 400 });
    }

    // Get all workout logs for this user
    const { data: logs } = await supabase
        .from('workout_logs')
        .select('id, started_at')
        .eq('user_id', DEMO_USER_ID)
        .order('started_at', { ascending: true });

    const logIds = logs?.map((l) => l.id) || [];
    if (logIds.length === 0) return NextResponse.json([]);

    const { data: sets, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('exercise_id', exerciseId)
        .in('workout_log_id', logIds);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Aggregate by date
    const byLog: Record<
        string,
        { date: string; maxWeight: number; totalReps: number; totalVolume: number; setsCount: number }
    > = {};

    logs?.forEach((log) => {
        const logSets = sets?.filter((s) => s.workout_log_id === log.id) || [];
        if (logSets.length === 0) return;
        const date = new Date(log.started_at).toISOString().split('T')[0];
        byLog[log.id] = {
            date,
            maxWeight: Math.max(...logSets.map((s) => Number(s.weight) || 0)),
            totalReps: logSets.reduce((sum, s) => sum + (Number(s.reps) || 0), 0),
            totalVolume: logSets.reduce(
                (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
                0
            ),
            setsCount: logSets.length,
        };
    });

    const result = Object.values(byLog).map((entry) => ({
        workout_date: entry.date,
        max_weight: entry.maxWeight,
        total_reps: entry.totalReps,
        total_volume: entry.totalVolume,
        sets_count: entry.setsCount,
    }));

    return NextResponse.json(result);
}
