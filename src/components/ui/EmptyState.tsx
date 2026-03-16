import { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
                border: '2px dashed #252B36',
                borderRadius: 20,
                textAlign: 'center',
            }}
        >
            {icon && (
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        background: 'rgba(255,107,53,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        color: '#FF6B35',
                    }}
                >
                    {icon}
                </div>
            )}
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#fff', margin: '0 0 6px' }}>{title}</p>
            {description && (
                <p style={{ fontSize: '0.85rem', color: '#8A91A8', margin: '0 0 20px', maxWidth: 260, lineHeight: 1.5 }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
