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

    const isFreshRequest = (date) => {
        if (!date) return false;
        const created = new Date(date).getTime();
        const ageMs = Date.now() - created;
        return ageMs <= 1000 * 60 * 60 * 24 * 2;
    };

    const getPriorityGlowClass = (priority) => {
        const map = {
            low: 'shadow-[0_0_0_1px_rgba(148,163,184,0.22)]',
            medium: 'shadow-[0_0_0_1px_rgba(6,182,212,0.28),0_10px_28px_-20px_rgba(6,182,212,0.85)]',
            high: 'shadow-[0_0_0_1px_rgba(249,115,22,0.28),0_10px_28px_-20px_rgba(249,115,22,0.9)]',
            urgent: 'shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_10px_30px_-20px_rgba(239,68,68,0.9)]'
        };
        return map[priority] || map.medium;
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
            className={`relative overflow-hidden rounded-2xl border border-white/70 bg-white/65 backdrop-blur-xl p-5 sm:p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:border-sky-200/80 hover:bg-white/80 hover:shadow-[0_18px_45px_-24px_rgba(37,99,235,0.45)] ${getPriorityGlowClass(request.priority)}`}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(56,189,248,0.16),transparent_48%),radial-gradient(120%_120%_at_100%_100%,rgba(99,102,241,0.14),transparent_52%)] opacity-90" />

            {/* Header: Subject & Status */}
            <div className="relative flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isFreshRequest(request.createdAt) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100/90 border border-emerald-200 text-[10px] uppercase tracking-wide text-emerald-700 font-extrabold">
                                New
                            </span>
                        )}
                        <p className="text-[11px] font-semibold text-slate-500">
                            Posted {formatDate(request.createdAt)}
                        </p>
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-[#5b7cfa] transition-colors line-clamp-1">
                        {request.subject}
                    </h3>
                </div>
                <StatusBadge status={request.status} className="shrink-0 ml-2" />
            </div>

            {/* Description */}
            <p className="relative text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                {request.description}
            </p>

            {/* Metadata: Grade, Priority, Type */}
            <div className="relative flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100/90 border border-slate-200/90 rounded-lg text-xs font-semibold text-slate-700">
                    🎓 {getGradeLabel(request.gradeLevel)}
                </span>
                <PriorityBadge priority={request.priority} />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100/75 border border-indigo-200/75 rounded-lg text-xs font-semibold text-indigo-700">
                    {request.requestType === 'one-time' || request.requestType === 'once' ? '📅 One-time' : '🔄 Ongoing'}
                </span>
            </div>

            {/* Tutor Info or Available */}
            <div className="relative mb-4 pt-4 border-t border-white/80">
                {request.assignedTutor ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-white/80 shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#5b7cfa] to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {request.assignedTutor.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                Assigned Tutor
                            </p>
                            <p className="text-xs font-semibold text-slate-900 truncate">
                                Tutor: {request.assignedTutor.name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {request.assignedTutor.email}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-100/80 border border-sky-200/80 rounded-lg shadow-sm">
                        <span className="text-sky-700 text-xs font-semibold">🎯 Available for Tutors</span>
                    </div>
                )}
            </div>

            {/* Student Info (for tutors/admins) */}
            {request.student && (
                <div className="relative flex items-center gap-3 p-3 rounded-xl bg-white/65 border border-white/75 shadow-sm mb-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-sky-500 to-[#5b7cfa] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {request.student.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Student
                        </p>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                            {request.student.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                            {request.student.email}
                        </p>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {showActions && (
                <div className="relative flex gap-2 pt-3 border-t border-white/80">
                    <Link
                        to={`/request/${request._id}`}
                        className="flex-1 text-center px-3 py-2 bg-gradient-to-r from-[#5b7cfa] to-indigo-600 text-white rounded-lg font-semibold text-xs hover:brightness-105 transition-all shadow-sm"
                    >
                        View Details
                    </Link>
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(request);
                            }}
                            className="flex-1 px-3 py-2 bg-white/80 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-white transition-colors"
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
                            className="flex-1 px-3 py-2 bg-rose-100/85 border border-rose-200 text-rose-700 rounded-lg font-semibold text-xs hover:bg-rose-200/90 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}

            {customActions && (
                <div
                    className="relative pt-3 border-t border-white/80"
                    onClick={(e) => e.stopPropagation()}
                >
                    {customActions}
                </div>
            )}
        </div>
    );
};

export default RequestCard;
