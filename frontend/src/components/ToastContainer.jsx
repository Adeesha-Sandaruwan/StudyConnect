/**
 * ToastContainer Component
 * Displays toast notifications with auto-dismiss
 * Supports multiple toast types: success, error, warning, info
 */

const ToastContainer = ({ toasts, onRemove }) => {
    const toastConfig = {
        success: {
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            icon: '✅',
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            icon: '❌',
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            icon: '⚠️',
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            icon: 'ℹ️',
        },
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
            {toasts.map(toast => {
                const config = toastConfig[toast.type] || toastConfig.info;

                return (
                    <div
                        key={toast.id}
                        className={`${config.bg} ${config.border} ${config.text} border rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 animate-slide-in-right pointer-events-auto`}
                    >
                        <span className="text-lg shrink-0">{config.icon}</span>
                        <p className="font-semibold text-sm">{toast.message}</p>
                        <button
                            onClick={() => onRemove(toast.id)}
                            className="ml-auto text-lg hover:opacity-70 transition-opacity shrink-0"
                        >
                            ✕
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
