'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) throw signInError;

            // Wait a moment before redirect to ensure auth context catches up
            setTimeout(() => {
                router.push('/');
            }, 500);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
            setError(errorMessage);
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        background: '#161B22',
        border: '1px solid #252B36',
        borderRadius: 12,
        padding: '14px 16px 14px 44px',
        color: '#fff',
        fontSize: '0.95rem',
        boxSizing: 'border-box' as const,
        outline: 'none',
        transition: 'border-color 0.2s',
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '0 24px', justifyContent: 'center' }}>
            <div style={{ paddingBottom: 40, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <LogIn size={32} color="#FF6B35" />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>Welcome Back</h1>
                <p style={{ color: '#8A91A8', fontSize: '0.95rem', margin: 0 }}>Enter your details to sign in</p>
            </div>

            {error && (
                <div style={{ background: 'rgba(255, 69, 69, 0.1)', border: '1px solid rgba(255, 69, 69, 0.2)', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
                    <AlertCircle size={18} color="#FF4545" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, color: '#FF4545', fontSize: '0.85rem', lineHeight: 1.4 }}>{error}</p>
                </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                    <Mail size={18} color="#5A6175" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={inputStyle}
                        required
                    />
                </div>
                
                <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#5A6175" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={inputStyle}
                        required
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Link href="#" style={{ color: '#FF6B35', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                        Forgot Password?
                    </Link>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{ 
                        background: '#FF6B35', color: '#fff', border: 'none', borderRadius: 12, 
                        padding: '16px', fontSize: '1rem', fontWeight: 700, marginTop: 12,
                        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(255,107,53,0.3)'
                    }}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <p style={{ color: '#8A91A8', fontSize: '0.9rem' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" style={{ color: '#FF6B35', fontWeight: 600, textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}
