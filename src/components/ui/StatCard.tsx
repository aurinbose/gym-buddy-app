import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color?: 'violet' | 'pink' | 'emerald' | 'amber';
}

const colorMap = {
    violet: 'text-violet-400 bg-violet-600/10 border-violet-500/20',
    pink: 'text-pink-400 bg-pink-600/10 border-pink-500/20',
    emerald: 'text-emerald-400 bg-emerald-600/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-600/10 border-amber-500/20',
};

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'violet',
}: StatCardProps) {
    const colors = colorMap[color];
    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">{title}</p>
                <div className={`p-2 rounded-lg border ${colors}`}>
                    <Icon className={`w-5 h-5 ${colors.split(' ')[0]}`} />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-100">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
