/**
 * RequestFilters Component
 * Advanced filtering UI for student requests
 * Filters: subject, gradeLevel, priority, status
 */

const RequestFilters = ({ filters, onFiltersChange, onClear }) => {
    const SUBJECTS = [
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 
        'Computer Science', 'Languages', 'Business', 'History',
        'English Literature', 'Economics', 'Psychology', 'Other'
    ];

    const STATUSES = [
        { value: 'open', label: 'Open', icon: '🔵' },
        { value: 'in-progress', label: 'In Progress', icon: '🟡' },
        { value: 'completed', label: 'Completed', icon: '🟢' },
        { value: 'cancelled', label: 'Cancelled', icon: '🔴' }
    ];

    const PRIORITIES = [
        { value: 'low', label: 'Low', icon: '📍' },
        { value: 'medium', label: 'Medium', icon: '📌' },
        { value: 'high', label: 'High', icon: '🔺' },
        { value: 'urgent', label: 'Urgent', icon: '🚨' }
    ];

    const handleFilterChange = (filterName, value) => {
        onFiltersChange({
            ...filters,
            [filterName]: value
        });
    };

    const toggleMultiSelect = (filterName, value) => {
        const currentValues = filters[filterName] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        
        handleFilterChange(filterName, newValues);
    };

    const hasActiveFilters = Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== ''));

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>🔍</span> Filters
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="text-xs font-bold text-[#5b7cfa] hover:text-[#4a6be0] transition-colors"
                    >
                        Clear All ✕
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {/* Subject Filter */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Subject
                    </label>
                    <select
                        value={filters.subject || ''}
                        onChange={(e) => handleFilterChange('subject', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 font-semibold text-sm outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Subjects</option>
                        {SUBJECTS.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>

                {/* Grade Level Filter */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Grade Level
                    </label>
                    <select
                        value={filters.gradeLevel || ''}
                        onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 font-semibold text-sm outline-none focus:ring-2 focus:ring-[#5b7cfa] transition-all appearance-none cursor-pointer"
                    >
                        <option value="">All Grades</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                            <option key={grade} value={grade}>Grade {grade}</option>
                        ))}
                        <option value="0">Course/University</option>
                    </select>
                </div>

                {/* Priority Filter (Multi-select) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Priority
                    </label>
                    <div className="space-y-2">
                        {PRIORITIES.map(priority => (
                            <label key={priority.value} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={(filters.priority || []).includes(priority.value)}
                                    onChange={() => toggleMultiSelect('priority', priority.value)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5b7cfa] focus:ring-[#5b7cfa] cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#5b7cfa] transition-colors">
                                    {priority.icon} {priority.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Status Filter (Multi-select) */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2.5">
                        Status
                    </label>
                    <div className="space-y-2">
                        {STATUSES.map(status => (
                            <label key={status.value} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={(filters.status || []).includes(status.value)}
                                    onChange={() => toggleMultiSelect('status', status.value)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#5b7cfa] focus:ring-[#5b7cfa] cursor-pointer"
                                />
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#5b7cfa] transition-colors">
                                    {status.icon} {status.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-600 font-semibold">
                        🎯 {Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : v !== '')).length} active filter{Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : v !== '')).length !== 1 ? 's' : ''}
                    </p>
                </div>
            )}
        </div>
    );
};

export default RequestFilters;
