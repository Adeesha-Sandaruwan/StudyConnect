import { useState, useEffect, useCallback } from 'react';
import { fetchMySubjectContents } from '../../services/subjectContentApi';
import { shareLesson, removeSharedLesson } from '../../services/studentRequestApi';

/**
 * TutorResourcePanel
 * Shown inside the tutor's request detail view.
 * Lets the assigned tutor browse their lessons and attach/detach them
 * from the student request so the student can see the resources.
 *
 * Props:
 *  - requestId        {String}  – the student request _id
 *  - requestSubject   {String}  – e.g. "Mathematics"
 *  - requestGrade     {String}  – e.g. "Grade 10" | "University"
 *  - linkedLessons    {Array}   – currently linked lesson objects (populated)
 *  - onUpdate         {Function} – called after share/remove so parent can refresh
 */
const TutorResourcePanel = ({ requestId, requestSubject, requestGrade, linkedLessons = [], onUpdate }) => {
    const [myLessons, setMyLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // lessonId being toggled
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showLinkedOnly, setShowLinkedOnly] = useState(false);

    // Convert gradeLevel string → number for matching SubjectContent.grade
    const gradeNum = useCallback(() => {
        if (!requestGrade) return null;
        if (requestGrade === 'University') return 0;
        const m = requestGrade.match(/Grade (\d+)/);
        return m ? parseInt(m[1], 10) : null;
    }, [requestGrade]);

    const linkedIds = new Set((linkedLessons || []).map((l) => (l._id || l).toString()));

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchMySubjectContents();
                // Accept array or {contents:[]}
                const all = Array.isArray(data) ? data : (data.contents || []);
                setMyLessons(all);
            } catch (err) {
                setError('Could not load your lessons.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const isRelevant = (lesson) => {
        const gradeMatch = gradeNum() !== null && lesson.grade === gradeNum();
        const subjectMatch =
            requestSubject &&
            lesson.subject?.toLowerCase().includes(requestSubject.toLowerCase());
        return gradeMatch && subjectMatch;
    };

    const filtered = myLessons.filter((lesson) => {
        if (showLinkedOnly && !linkedIds.has(lesson._id?.toString())) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (
                !lesson.title?.toLowerCase().includes(q) &&
                !lesson.subject?.toLowerCase().includes(q)
            ) {
                return false;
            }
        }
        return true;
    });

    const handleToggle = async (lesson) => {
        const lessonId = lesson._id;
        setActionLoading(lessonId);
        try {
            if (linkedIds.has(lessonId.toString())) {
                await removeSharedLesson(requestId, lessonId);
            } else {
                await shareLesson(requestId, lessonId);
            }
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err?.response?.data?.message || 'Action failed. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const relevantCount = myLessons.filter(isRelevant).length;

    return (
        <div className="flex flex-col h-full">
            {/* Panel heading */}
            <div className="pb-3 border-b border-slate-100 mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-0.5">
                    Module Integration
                </p>
                <h3 className="text-base font-extrabold text-slate-900">Send Resources to Student</h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Attach lessons from your modules. The student will see them on their request.
                </p>
                {relevantCount > 0 && (
                    <span className="inline-flex mt-1.5 items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                        ✅ {relevantCount} lesson{relevantCount !== 1 ? 's' : ''} match {requestSubject} · {requestGrade}
                    </span>
                )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    placeholder="Search lessons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
                />
                <button
                    onClick={() => setShowLinkedOnly((v) => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                        showLinkedOnly
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                >
                    Shared only
                </button>
            </div>

            {error && (
                <p className="text-xs text-red-600 font-semibold mb-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    ⚠️ {error}
                </p>
            )}

            {/* Lesson list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="text-xs text-slate-500">Loading lessons…</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-2xl mb-1">📭</p>
                        <p className="text-xs font-semibold">
                            {myLessons.length === 0
                                ? 'You have no lessons yet.'
                                : 'No lessons match your search.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((lesson) => {
                        const isLinked = linkedIds.has(lesson._id?.toString());
                        const relevant = isRelevant(lesson);
                        const isActing = actionLoading === lesson._id;
                        return (
                            <div
                                key={lesson._id}
                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                    isLinked
                                        ? 'bg-indigo-50 border-indigo-300'
                                        : relevant
                                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-400'
                                        : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {/* Lesson info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-bold text-slate-900 truncate">{lesson.title}</p>
                                        {relevant && !isLinked && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                                Match
                                            </span>
                                        )}
                                        {isLinked && (
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                                Shared
                                            </span>
                                        )}
                                        {lesson.status === 'draft' && (
                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                                                Draft
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {lesson.subject} · {lesson.grade === 0 ? 'University' : `Grade ${lesson.grade}`} · Week {lesson.weekNumber}
                                    </p>
                                    {lesson.description && (
                                        <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">
                                            {lesson.description}
                                        </p>
                                    )}
                                    {/* Quick resource preview */}
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {lesson.resources?.pdfFiles?.length > 0 && (
                                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold">
                                                📄 {lesson.resources.pdfFiles.length} PDF
                                            </span>
                                        )}
                                        {lesson.resources?.videoLinks?.filter(Boolean).length > 0 && (
                                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-semibold">
                                                ▶ {lesson.resources.videoLinks.filter(Boolean).length} Video
                                            </span>
                                        )}
                                        {lesson.resources?.referenceLinks?.filter(Boolean).length > 0 && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
                                                🔗 {lesson.resources.referenceLinks.filter(Boolean).length} Ref
                                            </span>
                                        )}
                                        {lesson.resources?.quizFormLink && (
                                            <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-semibold">
                                                📝 Quiz
                                            </span>
                                        )}
                                        {lesson.resources?.meetingLink && (
                                            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-semibold">
                                                🎥 Meeting
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action button */}
                                <button
                                    onClick={() => handleToggle(lesson)}
                                    disabled={isActing}
                                    className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-60 ${
                                        isLinked
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                                >
                                    {isActing ? (
                                        <span className="flex items-center gap-1">
                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        </span>
                                    ) : isLinked ? (
                                        'Remove'
                                    ) : (
                                        'Share'
                                    )}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default TutorResourcePanel;
