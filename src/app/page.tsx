'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, TrendingUp, ClipboardList, Flame, ChevronRight, Bell } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { supabase } from '@/lib/supabase';
import { WorkoutLog, Routine } from '@/types';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function DashboardPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [routinesRes, workoutsRes] = await Promise.all([
          supabase.from('routines').select('*').eq('user_id', DEMO_USER_ID).order('created_at', { ascending: false }).limit(3),
          supabase.from('workout_logs').select('*, routine:routines(name)').eq('user_id', DEMO_USER_ID).order('started_at', { ascending: false }).limit(5),
        ]);
        if (routinesRes.data) setRoutines(routinesRes.data);
        if (workoutsRes.data) {
          setRecentWorkouts(workoutsRes.data);
          setTotalWorkouts(workoutsRes.data.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>Athlete 💪</h1>
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
            {thisWeekWorkouts} session{thisWeekWorkouts !== 1 ? 's' : ''} this week
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
          value="—"
          subtitle="Days in a row"
          icon={TrendingUp}
          color="pink"
        />
      </div>

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
