'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Dumbbell,
    PlusSquare,
    ClipboardList,
    TrendingUp,
    Activity,
    History,
    Copy,
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/workouts', label: 'Workouts', icon: Dumbbell },
    { href: '/history', label: 'History', icon: History },
    { href: '/create-workout', label: 'Create Routine', icon: PlusSquare },
    { href: '/templates', label: 'Templates', icon: Copy },
    { href: '/log-workout', label: 'Log Workout', icon: ClipboardList },
    { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 border-r border-gray-800 z-50 flex flex-col">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-800">
                <div className="p-2 bg-violet-600/20 rounded-lg">
                    <Activity className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-lg font-bold gradient-text">Gym Buddy</h1>
                    <p className="text-xs text-gray-500">Fitness Tracker</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : ''}`} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-800">
                <p className="text-xs text-gray-600">MVP v1.0</p>
            </div>
        </aside>
    );
}
