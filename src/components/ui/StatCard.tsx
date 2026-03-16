import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color?: 'orange' | 'lime' | 'blue' | 'pink';
}

const colorMap = {
    orange: { bg: 'rgba(255,107,53,0.15)', icon: '#FF6B35' },
    lime: { bg: 'rgba(200,255,0,0.12)', icon: '#C8FF00' },
    blue: { bg: 'rgba(96,165,250,0.15)', icon: '#60A5FA' },
    pink: { bg: 'rgba(244,114,182,0.15)', icon: '#F472B6' },
};

export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'orange',
}: StatCardProps) {
    const { bg, icon: iconColor } = colorMap[color];
    return (
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
                style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon size={18} color={iconColor} strokeWidth={2} />
            </div>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1, margin: '4px 0 0' }}>
                {value}
            </p>
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#8A91A8', margin: 0 }}>{title}</p>
            {subtitle && <p style={{ fontSize: '0.7rem', color: '#5A6175', margin: 0 }}>{subtitle}</p>}
        </div>
    );
}
