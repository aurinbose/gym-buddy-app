'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Dumbbell, TrendingUp, ClipboardList, Flame, Plus, ChevronRight } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
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
          supabase
            .from('routines')
            .select('*')
            .eq('user_id', DEMO_USER_ID)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('workout_logs')
            .select('*, routine:routines(name)')
            .eq('user_id', DEMO_USER_ID)
            .order('started_at', { ascending: false })
            .limit(5),
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
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your fitness overview."
        action={
          <Link href="/log-workout" className="btn-primary">
            <Plus className="w-4 h-4" />
            Log Workout
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Workouts"
          value={loading ? '—' : totalWorkouts}
          subtitle="All time"
          icon={Dumbbell}
          color="violet"
        />
        <StatCard
          title="This Week"
          value={loading ? '—' : thisWeekWorkouts}
          subtitle="Sessions logged"
          icon={Flame}
          color="pink"
        />
        <StatCard
          title="Routines"
          value={loading ? '—' : routines.length}
          subtitle="Created"
          icon={ClipboardList}
          color="emerald"
        />
        <StatCard
          title="Streak"
          value="0"
          subtitle="Days in a row"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Recent Workouts</h2>
            <Link href="/workouts" className="text-sm text-violet-400 hover:text-violet-300">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No workouts yet.</p>
              <Link href="/log-workout" className="text-violet-400 text-sm hover:underline">
                Log your first workout →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50"
                >
                  <div>
                    <p className="font-medium text-gray-200 text-sm">{workout.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(workout.started_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Routines */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">My Routines</h2>
            <Link href="/create-workout" className="text-sm text-violet-400 hover:text-violet-300">
              + New
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No routines created yet.</p>
              <Link href="/create-workout" className="text-violet-400 text-sm hover:underline">
                Create your first routine →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 card-hover cursor-pointer"
                >
                  <div>
                    <p className="font-medium text-gray-200 text-sm">{routine.name}</p>
                    {routine.description && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <Link href="/log-workout" className="text-xs btn-primary py-1 px-3 text-xs">
                    Start
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
