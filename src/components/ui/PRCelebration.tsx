'use client';

import { Trophy, ArrowRight } from 'lucide-react';

export interface PREntry {
  exerciseName: string;
  newWeight: number;
  prevBest: number;
  unit: string;
}

interface PRCelebrationProps {
  prs: PREntry[];
  onDismiss: () => void;
}

export default function PRCelebration({ prs, onDismiss }: PRCelebrationProps) {
  if (prs.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 360,
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
            border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 28,
            padding: '28px 24px',
            boxShadow: '0 0 60px rgba(255,200,0,0.15)',
            animation: 'prPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            textAlign: 'center',
          }}
        >
          {/* Trophy icon */}
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255,200,0,0.2), rgba(255,150,0,0.1))',
              border: '2px solid rgba(255,200,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'trophyPulse 1.5s ease-in-out infinite',
            }}
          >
            <Trophy size={36} color="#FFD700" fill="rgba(255,215,0,0.3)" />
          </div>

          {/* Headline */}
          <p
            style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em',
              color: '#FFD700', textTransform: 'uppercase', margin: '0 0 6px',
            }}
          >
            {prs.length === 1 ? 'New Personal Record' : `${prs.length} New Personal Records`}
          </p>
          <h2
            style={{
              fontSize: '1.6rem', fontWeight: 800, color: '#fff',
              margin: '0 0 20px', lineHeight: 1.1,
            }}
          >
            You crushed it! 💪
          </h2>

          {/* PR list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {prs.map((pr, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,215,0,0.06)',
                  border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: 16, padding: '14px 16px',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  {pr.exerciseName}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {pr.prevBest > 0 && (
                    <>
                      <span style={{ fontSize: '0.8rem', color: '#8A91A8' }}>
                        {pr.prevBest}{pr.unit}
                      </span>
                      <ArrowRight size={12} color="#8A91A8" />
                    </>
                  )}
                  <span
                    style={{
                      fontSize: '1rem', fontWeight: 800, color: '#FFD700',
                    }}
                  >
                    {pr.newWeight}{pr.unit}
                  </span>
                  {pr.prevBest > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem', fontWeight: 700,
                        background: 'rgba(200,255,0,0.12)',
                        color: '#C8FF00', borderRadius: 99,
                        padding: '2px 8px',
                      }}
                    >
                      +{(pr.newWeight - pr.prevBest).toFixed(pr.newWeight % 1 !== 0 ? 1 : 0)}{pr.unit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={onDismiss}
            style={{
              width: '100%', padding: '14px',
              background: '#FFD700', color: '#0D1117',
              fontWeight: 700, fontSize: '0.95rem',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            View History 🏅
          </button>
        </div>
      </div>

      <style>{`
        @keyframes prPop {
          from { transform: scale(0.8) translateY(20px); opacity: 0; }
          to   { transform: scale(1)   translateY(0);    opacity: 1; }
        }
        @keyframes trophyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.3); }
          50%       { box-shadow: 0 0 0 12px rgba(255,215,0,0); }
        }
      `}</style>
    </>
  );
}
