/**
 * StatusBadge Component
 * Visual status indicators with color-coded badges
 * Statuses: open, in-progress, completed, cancelled
 */

const StatusBadge = ({ status, className = '' }) => {
    const statusConfig = {
        open: {
            bg: 'bg-blue-100',
            text: 'text-blue-700',
            border: 'border-blue-200',
            dot: 'bg-blue-500',
            label: 'Open'
        },
        'in-progress': {
            bg: 'bg-amber-100',
            text: 'text-amber-700',
            border: 'border-amber-200',
            dot: 'bg-amber-500',
            label: 'In Progress'
        },
        completed: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
            label: 'Completed'
        },
        cancelled: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            dot: 'bg-red-500',
            label: 'Cancelled'
        }
    };

    const config = statusConfig[status] || statusConfig.open;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs ${config.bg} ${config.text} ${config.border} ${className}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></span>
            {config.label}
        </span>
    );
};

export default StatusBadge;
