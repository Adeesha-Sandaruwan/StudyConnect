/**
 * StatusBadge Component
 * Visual status indicators with color-coded badges
 * Statuses: open, in-progress, completed, rejected
 */

const StatusBadge = ({ status, className = '' }) => {
    const statusConfig = {
        open: {
            bg: 'bg-blue-100/80',
            text: 'text-blue-700',
            border: 'border-blue-200/80',
            dot: 'bg-blue-500',
            label: 'Open'
        },
        'in-progress': {
            bg: 'bg-amber-100/80',
            text: 'text-amber-700',
            border: 'border-amber-200/80',
            dot: 'bg-amber-500',
            label: 'In Progress'
        },
        completed: {
            bg: 'bg-emerald-100/80',
            text: 'text-emerald-700',
            border: 'border-emerald-200/80',
            dot: 'bg-emerald-500',
            label: 'Completed'
        },
        rejected: {
            bg: 'bg-red-100/80',
            text: 'text-red-700',
            border: 'border-red-200/80',
            dot: 'bg-red-500',
            label: 'Rejected'
        },
        cancelled: {
            bg: 'bg-red-100/80',
            text: 'text-red-700',
            border: 'border-red-200/80',
            dot: 'bg-red-500',
            label: 'Rejected'
        }
    };

    const config = statusConfig[status] || statusConfig.open;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-xs backdrop-blur-sm shadow-sm ${config.bg} ${config.text} ${config.border} ${className}`}>
            <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`}></span>
            {config.label}
        </span>
    );
};

export default StatusBadge;
