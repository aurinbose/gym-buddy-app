'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, TrendingUp, ClipboardList, Flame, ChevronRight, Bell } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { supabase } from '@/lib/supabase';
import { WorkoutLog, Routine } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// ── WorkoutCalendar ───────────────────────────────────────────────────
function WorkoutCalendar({ dates }: { dates: string[] }) {
  const WEEKS = 10;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count workouts per day
  const countMap: Record<string, number> = {};
  dates.forEach(d => {
    const dt = new Date(d);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    countMap[key] = (countMap[key] || 0) + 1;
  });

  // Find Monday of the week containing today
  const dayOfWeek = today.getDay(); // 0=Sun
  const daysToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMon);

  // Start WEEKS ago from thisMonday
  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - (WEEKS - 1) * 7);

  // Build WEEKS columns × 7 rows
  const weeks: { key: string; isFuture: boolean; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const col: { key: string; isFuture: boolean; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = new Date(startDate);
      cell.setDate(startDate.getDate() + w * 7 + d);
      cell.setHours(0, 0, 0, 0);
      const key = `${cell.getFullYear()}-${String(cell.getMonth() + 1).padStart(2, '0')}-${String(cell.getDate()).padStart(2, '0')}`;
      col.push({ key, isFuture: cell > today, count: countMap[key] || 0 });
    }
    weeks.push(col);
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  function cellColor(count: number, isFuture: boolean): string {
    if (isFuture) return '#0D1117';
    if (count === 0) return '#161B22';
    if (count === 1) return 'rgba(255,107,53,0.45)';
    return '#FF6B35';
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Activity</h2>
        <span style={{ fontSize: '0.75rem', color: '#5A6175' }}>Last {WEEKS} weeks</span>
      </div>
      <div className="card" style={{ padding: '14px 12px', borderRadius: 20 }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {/* Day labels column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 4 }}>
            {dayLabels.map((l, i) => (
              <div key={i} style={{ height: 12, fontSize: '0.55rem', color: '#5A6175', lineHeight: '12px', fontWeight: 600 }}>{l}</div>
            ))}
          </div>
          {/* Week columns */}
          {weeks.map((col, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
              {col.map((cell) => {
                const isToday = cell.key === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                return (
                  <div
                    key={cell.key}
                    title={`${cell.key}${cell.count > 0 ? ` · ${cell.count} workout${cell.count > 1 ? 's' : ''}` : ''}`}
                    style={{
                      height: 12, borderRadius: 3,
                      background: cellColor(cell.count, cell.isFuture),
                      outline: isToday ? '1.5px solid #FF6B35' : 'none',
                      outlineOffset: 1,
                      transition: 'background 0.15s',
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.62rem', color: '#5A6175' }}>None</span>
          {['#161B22', 'rgba(255,107,53,0.45)', '#FF6B35'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: '0.62rem', color: '#5A6175' }}>Active</span>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────
function calculateStreak(startedAts: string[]): number {
  if (startedAts.length === 0) return 0;

  // Unique calendar dates (local)
  const uniqueDates = new Set(
    startedAts.map(d => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    })
  );

  const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Streak is dead if nothing logged today or yesterday
  if (!uniqueDates.has(toKey(today)) && !uniqueDates.has(toKey(yesterday))) return 0;

  // Walk backwards from today
  let streak = 0;
  const cursor = uniqueDates.has(toKey(today)) ? new Date(today) : new Date(yesterday);

  while (uniqueDates.has(toKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
// ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [allDates, setAllDates] = useState<string[]>([]);

  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        const [routinesRes, workoutsRes, allDatesRes] = await Promise.all([
          supabase.from('routines').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('workout_logs').select('*, routine:routines(name)').eq('user_id', user.id).order('started_at', { ascending: false }).limit(5),
          // Lightweight query — only the timestamp column, all rows
          supabase.from('workout_logs').select('started_at').eq('user_id', user.id),
        ]);
        if (routinesRes.data) setRoutines(routinesRes.data);
        if (workoutsRes.data) setRecentWorkouts(workoutsRes.data);
        if (allDatesRes.data) {
          const dateStrings = allDatesRes.data.map((r: { started_at: string }) => r.started_at);
          setTotalWorkouts(dateStrings.length);
          setStreak(calculateStreak(dateStrings));
          setAllDates(dateStrings);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) {
        fetchData();
    }
  }, [user]);

  const targetWorkouts = profile?.weekly_target || 3;

  const thisWeekWorkouts = recentWorkouts.filter((w) => {
    const workoutDate = new Date(w.started_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate > weekAgo;
  }).length;

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingBottom: 8 }}>
        <div>
          <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: 0 }}>Good day,</p>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>{profile?.full_name?.split(' ')[0] || 'Athlete'} 💪</h1>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: '50%',
          background: '#1E2430', border: '1px solid #252B36',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Bell size={18} color="#8A91A8" />
        </div>
      </div>

      {/* Hero card */}
      <div
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '24px 20px',
          border: '1px solid #252B36',
          minHeight: 160,
        }}
      >
        {/* Decorative circle */}
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 140, height: 140, borderRadius: '50%',
          background: 'rgba(255,107,53,0.15)',
        }} />
        <div style={{
          position: 'absolute', right: 20, top: 20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,107,53,0.1)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em',
            color: '#FF6B35', textTransform: 'uppercase',
            background: 'rgba(255,107,53,0.15)', padding: '4px 10px', borderRadius: 99
          }}>
            Todays Goal
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: '10px 0 6px', lineHeight: 1.2 }}>
            Stay Active & <br />Hit Your Targets
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#8A91A8', margin: '0 0 16px' }}>
            {thisWeekWorkouts} / {targetWorkouts} sessions this week
          </p>
          <Link href="/log-workout" className="btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px' }}>
            Log Workout
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <StatCard
          title="Total Workouts"
          value={loading ? '—' : totalWorkouts}
          subtitle="All time"
          icon={Dumbbell}
          color="orange"
        />
        <StatCard
          title="This Week"
          value={loading ? '—' : thisWeekWorkouts}
          subtitle="Sessions"
          icon={Flame}
          color="lime"
        />
        <StatCard
          title="Routines"
          value={loading ? '—' : routines.length}
          subtitle="Created"
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Streak"
          value={loading ? '—' : streak}
          subtitle={streak === 1 ? 'Day in a row 🔥' : streak > 1 ? 'Days in a row 🔥' : 'Start your streak!'}
          icon={TrendingUp}
          color="pink"
        />
      </div>

      {/* Activity Calendar */}
      {!loading && <WorkoutCalendar dates={allDates} />}

      {/* Recent Workouts */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>Recent Workouts</h2>
          <Link href="/history" style={{ fontSize: '0.8rem', color: '#FF6B35', textDecoration: 'none' }}>
            View all
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: 68, background: '#161B22', borderRadius: 16, border: '1px solid #252B36' }} />
            ))}
          </div>
        ) : recentWorkouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#8A91A8', fontSize: '0.85rem' }}>
            <Dumbbell size={32} color="#252B36" style={{ margin: '0 auto 8px', display: 'block' }} />
            No workouts yet. <Link href="/log-workout" style={{ color: '#FF6B35' }}>Log your first →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="card"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: 'rgba(255,107,53,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Dumbbell size={18} color="#FF6B35" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', margin: 0 }}>{workout.name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#8A91A8', margin: 0 }}>
                      {new Date(workout.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} color="#252B36" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Routines */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>My Routines</h2>
          <Link href="/workouts" style={{ fontSize: '0.8rem', color: '#FF6B35', textDecoration: 'none' }}>
            View all
          </Link>
        </div>

        {loading ? (
          <div style={{ height: 68, background: '#161B22', borderRadius: 16, border: '1px solid #252B36' }} />
        ) : routines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8A91A8', fontSize: '0.85rem' }}>
            <Link href="/create-workout" style={{ color: '#FF6B35' }}>Create your first routine →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {routines.map((routine) => (
              <div
                key={routine.id}
                className="card"
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16 }}
              >
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', margin: 0 }}>{routine.name}</p>
                  {routine.description && (
                    <p style={{ fontSize: '0.75rem', color: '#8A91A8', margin: 0, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {routine.description}
                    </p>
                  )}
                </div>
                <Link
                  href="/log-workout"
                  style={{
                    fontSize: '0.75rem', fontWeight: 600, color: '#FF6B35',
                    background: 'rgba(255,107,53,0.12)', padding: '6px 14px',
                    borderRadius: 999, textDecoration: 'none'
                  }}
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
