import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    back?: string;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div style={{ padding: '24px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.2 }}>
                    {title}
                </h1>
                {subtitle && (
                    <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: '4px 0 0', lineHeight: 1.4 }}>
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div style={{ flexShrink: 0, marginLeft: 12 }}>{action}</div>}
        </div>
    );
}
