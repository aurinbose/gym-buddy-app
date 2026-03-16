export default function LoadingSpinner() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px',
            }}
        >
            <div
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '3px solid #252B36',
                    borderTopColor: '#FF6B35',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
