/**
 * PriorityBadge Component
 * Priority indicators with visual styling
 * Priorities: low, medium, high, urgent
 */

const PriorityBadge = ({ priority, className = '' }) => {
    const priorityConfig = {
        low: {
            bg: 'bg-gray-100',
            text: 'text-gray-700',
            border: 'border-gray-200',
            icon: '📍',
            label: 'Low'
        },
        medium: {
            bg: 'bg-cyan-100',
            text: 'text-cyan-700',
            border: 'border-cyan-200',
            icon: '📌',
            label: 'Medium'
        },
        high: {
            bg: 'bg-orange-100',
            text: 'text-orange-700',
            border: 'border-orange-200',
            icon: '🔺',
            label: 'High'
        },
        urgent: {
            bg: 'bg-red-100',
            text: 'text-red-700',
            border: 'border-red-200',
            icon: '🚨',
            label: 'Urgent'
        }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs ${config.bg} ${config.text} ${config.border} ${className}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
};

export default PriorityBadge;
