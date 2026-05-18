'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { X, SkipForward } from 'lucide-react';

interface RestTimerProps {
  visible: boolean;
  initialSeconds?: number;
  onDismiss: () => void;
}

const PRESETS = [45, 60, 90, 120, 180];

export default function RestTimer({ visible, initialSeconds = 90, onDismiss }: RestTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [total, setTotal] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Reset whenever the timer becomes visible
  useEffect(() => {
    if (visible) {
      setSeconds(initialSeconds);
      setTotal(initialSeconds);
    } else {
      clearTimer();
    }
  }, [visible, initialSeconds, clearTimer]);

  // Countdown tick
  useEffect(() => {
    if (!visible) return;
    clearTimer();
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearTimer();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          setTimeout(onDismiss, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [visible, onDismiss, clearTimer]);

  const handlePreset = (s: number) => {
    clearTimer();
    setTotal(s);
    setSeconds(s);
    // restart tick
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearTimer();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          setTimeout(onDismiss, 600);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!visible) return null;

  const progress = total > 0 ? seconds / total : 0;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const ringColor =
    seconds <= 10 ? '#FF4545' : seconds <= 30 ? '#FF6B35' : '#C8FF00';

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : String(seconds);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 998,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
          background: '#161B22',
          borderTop: '1px solid #252B36',
          borderRadius: '24px 24px 0 0',
          padding: '20px 24px 48px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          animation: 'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', margin: 0 }}>Rest Timer</p>
            <p style={{ fontSize: '0.75rem', color: '#8A91A8', margin: 0 }}>Take a breather 💨</p>
          </div>
          <button
            onClick={onDismiss}
            style={{
              background: '#1E2430', border: '1px solid #252B36',
              borderRadius: 10, padding: 8, cursor: 'pointer',
              color: '#8A91A8', display: 'flex', alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Circular progress */}
        <div style={{ position: 'relative', width: 148, height: 148 }}>
          <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={74} cy={74} r={radius} fill="none" stroke="#1E2430" strokeWidth={9} />
            {/* Progress */}
            <circle
              cx={74} cy={74} r={radius} fill="none"
              stroke={ringColor}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <p style={{
              fontSize: '2.4rem', fontWeight: 800, color: '#fff', margin: 0,
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
            }}>
              {display}
            </p>
            <p style={{ fontSize: '0.65rem', color: '#8A91A8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {mins > 0 ? 'min' : 'sec'}
            </p>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PRESETS.map(p => {
            const active = total === p;
            return (
              <button
                key={p}
                onClick={() => handlePreset(p)}
                style={{
                  background: active ? 'rgba(200,255,0,0.12)' : '#1E2430',
                  border: `1px solid ${active ? 'rgba(200,255,0,0.4)' : '#252B36'}`,
                  color: active ? '#C8FF00' : '#8A91A8',
                  borderRadius: 99, padding: '6px 12px',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p >= 60 ? `${p / 60}m` : `${p}s`}
              </button>
            );
          })}
        </div>

        {/* Skip */}
        <button
          onClick={onDismiss}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,107,53,0.12)',
            border: '1px solid rgba(255,107,53,0.25)',
            color: '#FF6B35', borderRadius: 99,
            padding: '10px 28px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          <SkipForward size={14} /> Skip Rest
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
