import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

/**
 * RequestCard Component
 * Individual request display card with summary info
 * Shows: subject, grade level, priority, status, tutor info, student details
 */

const RequestCard = ({ request, onClick, showActions = false, onEdit, onDelete, customActions = null }) => {
    const getGradeLabel = (grade) => {
        if (grade === 0) return 'Course';
        return `Grade ${grade}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#5b7cfa] transition-all p-5 cursor-pointer group"
        >
            {/* Header: Subject & Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-[#5b7cfa] transition-colors line-clamp-1">
                        {request.subject}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Posted {formatDate(request.createdAt)}
                    </p>
                </div>
                <StatusBadge status={request.status} className="shrink-0 ml-2" />
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {request.description}
            </p>

            {/* Metadata: Grade, Priority, Type */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
                    🎓 {getGradeLabel(request.gradeLevel)}
                </span>
                <PriorityBadge priority={request.priority} />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700">
                    {request.requestType === 'once' ? '📅 One-time' : '🔄 Ongoing'}
                </span>
            </div>

            {/* Tutor Info or Available */}
            <div className="mb-4 pb-4 border-t border-gray-100 pt-4">
                {request.assignedTutor ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5b7cfa] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {request.assignedTutor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                                Tutor: {request.assignedTutor.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {request.assignedTutor.email}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-blue-600 text-xs font-semibold">🎯 Available for Tutors</span>
                    </div>
                )}
            </div>

            {/* Student Info (for tutors/admins) */}
            {request.student && (
                <div className="flex items-center gap-3 pb-4 border-t border-gray-100 pt-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-[#5b7cfa] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {request.student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                            {request.student.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                            {request.student.email}
                        </p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {showActions && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                        to={`/request/${request._id}`}
                        className="flex-1 text-center px-3 py-2 bg-[#5b7cfa] text-white rounded-lg font-semibold text-xs hover:bg-[#4a6be0] transition-colors"
                    >
                        View Details
                    </Link>
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(request);
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-xs hover:bg-gray-300 transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(request._id);
                            }}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-xs hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}

            {customActions && (
                <div
                    className="pt-3 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {customActions}
                </div>
            )}
        </div>
    );
};

export default RequestCard;
