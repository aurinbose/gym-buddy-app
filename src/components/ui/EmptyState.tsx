interface EmptyStateProps {
    title: string;
    description: string;
    action?: React.ReactNode;
    icon?: React.ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
    return (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
            {icon && <div className="mb-4 text-gray-600">{icon}</div>}
            <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
