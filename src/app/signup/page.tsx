'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import DrumPicker from '@/components/ui/DrumPicker';

// Generate number ranges
function range(start: number, end: number, step = 1) {
    const out = [];
    for (let i = start; i <= end; i += step) out.push(i);
    return out;
}

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    // Step 1: Account
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    // Step 2: Preferences
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
    const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
    const [weeklyTarget, setWeeklyTarget] = useState<number>(3);

    // Step 3: Metrics — drum picker values
    const [heightVal, setHeightVal] = useState(170);
    const [heightIn, setHeightIn] = useState(68); // inches
    const [currentWeightKg, setCurrentWeightKg] = useState(75);
    const [currentWeightLbs, setCurrentWeightLbs] = useState(165);
    const [goalWeightKg, setGoalWeightKg] = useState(70);
    const [goalWeightLbs, setGoalWeightLbs] = useState(154);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Drum picker value ranges
    const heightCmValues = useMemo(() => range(130, 230), []);
    const heightInValues = useMemo(() => range(50, 90), []);
    const weightKgValues = useMemo(() => range(30, 200), []);
    const weightLbsValues = useMemo(() => range(66, 440), []);

    const getMetrics = () => {
        if (heightUnit === 'cm') {
            return {
                height: heightVal,
                currentWeight: weightUnit === 'kg' ? currentWeightKg : currentWeightLbs,
                goalWeight: weightUnit === 'kg' ? goalWeightKg : goalWeightLbs,
            };
        } else {
            return {
                height: heightIn,
                currentWeight: weightUnit === 'kg' ? currentWeightKg : currentWeightLbs,
                goalWeight: weightUnit === 'kg' ? goalWeightKg : goalWeightLbs,
            };
        }
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } }
            });

            if (signUpError) throw signUpError;
            if (!authData.user) throw new Error('Failed to create account');

            const { height, currentWeight, goalWeight } = getMetrics();

            if (authData.session) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await supabase.from('profiles').update({
                    height_cm: height,
                    current_weight_kg: currentWeight,
                    goal_weight_kg: goalWeight,
                    weight_unit: weightUnit,
                    height_unit: heightUnit,
                    weekly_target: weeklyTarget
                }).eq('id', authData.user.id);
                router.push('/');
            } else {
                setSuccess(true);
                setLoading(false);
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to sign up';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const nextStep = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (step === 1 && (!email || !password || !fullName)) {
            setError('Please fill in all fields');
            return;
        }
        if (step < 3) setStep(step + 1);
        else handleSignup();
    };

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '15px 16px',
        color: '#fff',
        fontSize: '0.95rem',
        boxSizing: 'border-box' as const,
        outline: 'none',
    };
    const inputWithIconStyle = { ...inputStyle, paddingLeft: 46 };
    const labelStyle = {
        display: 'block', fontSize: '0.7rem', fontWeight: 700,
        color: '#5A6175', textTransform: 'uppercase' as const,
        letterSpacing: '0.08em', marginBottom: 8
    };

    const unitBtnStyle = (active: boolean) => ({
        flex: 1, padding: '13px 8px', borderRadius: 12, border: 'none',
        cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
        background: active ? '#FF6B35' : 'rgba(255,255,255,0.05)',
        color: active ? '#fff' : '#8A91A8',
        transition: 'all 0.2s ease',
        boxShadow: active ? '0 4px 12px rgba(255,107,53,0.3)' : 'none',
    });

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center', gap: 20 }}>
                <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(200,255,0,0.08)', border: '1px solid rgba(200,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <CheckCircle2 size={40} color="#C8FF00" />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>Check Your Email</h1>
                <p style={{ color: '#8A91A8', fontSize: '0.95rem', margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
                    We sent a confirmation link to <br /><strong style={{ color: '#fff' }}>{email}</strong>
                </p>
                <p style={{ color: '#5A6175', fontSize: '0.82rem', margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
                    Click the link in the email to activate your account, then sign in.
                </p>
                <Link href="/login" style={{ marginTop: 8, background: '#FF6B35', color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}>
                    Go to Sign In
                </Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 20px', paddingTop: 52 }}>
            {/* Back + Progress */}
            <div style={{ marginBottom: 28 }}>
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        style={{ background: 'none', border: 'none', color: '#8A91A8', padding: '0 0 16px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back
                    </button>
                )}
                <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 99,
                            background: i < step ? '#FF6B35' : i === step ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                            opacity: i === step ? 1 : i < step ? 0.5 : 1,
                            transition: 'all 0.4s ease'
                        }} />
                    ))}
                </div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FF6B35', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                    Step {step} of 3
                </p>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    {step === 1 && 'Create Account'}
                    {step === 2 && 'Your Preferences'}
                    {step === 3 && 'Body Metrics'}
                </h1>
                <p style={{ color: '#5A6175', fontSize: '0.88rem', margin: 0 }}>
                    {step === 1 && "Let's get you started"}
                    {step === 2 && 'How you want to track progress'}
                    {step === 3 && 'Set your baseline — scroll to pick'}
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255,69,69,0.08)', border: '1px solid rgba(255,69,69,0.2)', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
                    <AlertCircle size={17} color="#FF4545" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, color: '#FF4545', fontSize: '0.83rem', lineHeight: 1.5 }}>{error}</p>
                </div>
            )}

            <form onSubmit={nextStep} style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>

                {/* ── Step 1: Account ── */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ position: 'relative' }}>
                            <UserIcon size={17} color="#5A6175" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} style={inputWithIconStyle} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Mail size={17} color="#5A6175" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} style={inputWithIconStyle} required />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={17} color="#5A6175" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            <input type="password" placeholder="Password (min. 6 chars)" value={password} onChange={e => setPassword(e.target.value)} style={inputWithIconStyle} required minLength={6} />
                        </div>
                    </div>
                )}

                {/* ── Step 2: Preferences ── */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        <div>
                            <label style={labelStyle}>Weight Unit</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setWeightUnit('kg')} style={unitBtnStyle(weightUnit === 'kg')}>Kilograms (kg)</button>
                                <button type="button" onClick={() => setWeightUnit('lbs')} style={unitBtnStyle(weightUnit === 'lbs')}>Pounds (lbs)</button>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Height Unit</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button type="button" onClick={() => setHeightUnit('cm')} style={unitBtnStyle(heightUnit === 'cm')}>Centimeters (cm)</button>
                                <button type="button" onClick={() => setHeightUnit('in')} style={unitBtnStyle(heightUnit === 'in')}>Inches (in)</button>
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Weekly Workout Target</label>
                            <p style={{ fontSize: '0.8rem', color: '#5A6175', margin: '0 0 14px' }}>How many days a week do you plan to train?</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <input
                                    type="range" min={1} max={7} value={weeklyTarget}
                                    onChange={e => setWeeklyTarget(Number(e.target.value))}
                                    style={{ flex: 1, accentColor: '#FF6B35', height: 4 }}
                                />
                                <div style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 10, padding: '6px 14px', minWidth: 60, textAlign: 'center' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FF6B35' }}>{weeklyTarget}</span>
                                    <span style={{ fontSize: '0.65rem', color: '#FF6B35', display: 'block', opacity: 0.8 }}>days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Body Metrics Drum Pickers ── */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* Height picker */}
                        <div>
                            <label style={labelStyle}>Height ({heightUnit})</label>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', padding: '0 16px' }}>
                                <DrumPicker
                                    values={heightUnit === 'cm' ? heightCmValues : heightInValues}
                                    selected={heightUnit === 'cm' ? heightVal : heightIn}
                                    onChange={v => heightUnit === 'cm' ? setHeightVal(Number(v)) : setHeightIn(Number(v))}
                                    unit={heightUnit}
                                    visibleCount={5}
                                    itemHeight={44}
                                />
                            </div>
                        </div>

                        {/* Weight pickers side by side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Current ({weightUnit})</label>
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', padding: '0 8px' }}>
                                    <DrumPicker
                                        values={weightUnit === 'kg' ? weightKgValues : weightLbsValues}
                                        selected={weightUnit === 'kg' ? currentWeightKg : currentWeightLbs}
                                        onChange={v => weightUnit === 'kg' ? setCurrentWeightKg(Number(v)) : setCurrentWeightLbs(Number(v))}
                                        unit={weightUnit}
                                        visibleCount={5}
                                        itemHeight={44}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Goal ({weightUnit})</label>
                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden', padding: '0 8px' }}>
                                    <DrumPicker
                                        values={weightUnit === 'kg' ? weightKgValues : weightLbsValues}
                                        selected={weightUnit === 'kg' ? goalWeightKg : goalWeightLbs}
                                        onChange={v => weightUnit === 'kg' ? setGoalWeightKg(Number(v)) : setGoalWeightLbs(Number(v))}
                                        unit={weightUnit}
                                        visibleCount={5}
                                        itemHeight={44}
                                    />
                                </div>
                            </div>
                        </div>

                        <p style={{ textAlign: 'center', color: '#5A6175', fontSize: '0.8rem', margin: 0 }}>
                            Scroll up/down to select your values
                        </p>
                    </div>
                )}

                {/* CTA */}
                <div style={{ marginTop: 'auto', paddingBottom: 36, paddingTop: 28 }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', background: loading ? '#2A2F3A' : '#FF6B35',
                            color: '#fff', border: 'none', borderRadius: 14,
                            padding: '16px', fontSize: '1rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.35)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {loading ? 'Processing...' : step < 3 ? 'Continue' : 'Complete Setup'}
                        {!loading && step < 3 && <ArrowRight size={18} />}
                    </button>

                    {step === 1 && (
                        <p style={{ color: '#5A6175', fontSize: '0.88rem', textAlign: 'center', marginTop: 20 }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none' }}>
                                Sign In
                            </Link>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
