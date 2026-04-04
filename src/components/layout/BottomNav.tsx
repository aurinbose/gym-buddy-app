'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dumbbell, Plus, History, TrendingUp } from 'lucide-react';

const navItems = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/workouts', label: 'Workouts', icon: Dumbbell },
    { href: '/log-workout', label: 'Log', icon: Plus, fab: true },
    { href: '/history', label: 'History', icon: History },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function BottomNav() {
    const pathname = usePathname();

    // Hide nav on auth pages
    if (pathname === '/login' || pathname === '/signup') {
        return null;
    }

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center">
            <div
                style={{
                    maxWidth: 480,
                    width: '100%',
                    background: 'rgba(22, 27, 34, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderTop: '1px solid #252B36',
                    padding: '8px 16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                }}
            >
                {navItems.map(({ href, label, icon: Icon, fab }) => {
                    const isActive = pathname === href;

                    if (fab) {
                        return (
                            <Link
                                key={href}
                                href={href}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginTop: -24,
                                }}
                            >
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: '50%',
                                        background: '#FF6B35',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 0 24px rgba(255,107,53,0.45)',
                                    }}
                                >
                                    <Icon size={24} color="#fff" />
                                </div>
                                <span style={{ fontSize: 10, color: '#FF6B35', fontWeight: 600, marginTop: 4 }}>
                                    {label}
                                </span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={href}
                            href={href}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                padding: '6px 12px',
                                borderRadius: 12,
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <Icon
                                size={22}
                                color={isActive ? '#FF6B35' : '#8A91A8'}
                                strokeWidth={isActive ? 2.5 : 1.8}
                            />
                            <span
                                style={{
                                    fontSize: 10,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#FF6B35' : '#8A91A8',
                                    lineHeight: 1,
                                }}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
