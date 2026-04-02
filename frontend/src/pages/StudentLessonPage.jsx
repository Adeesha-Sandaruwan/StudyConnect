import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents, getSubjectPdfWindowUrl } from '../services/subjectContentApi';
import { studentModulePath } from '../utils/subjectModules';
import StudentLessonResources from '../components/student/StudentLessonResources';
import { getLessonPdfDisplayList } from '../utils/lessonPdfs';

const StudentLessonPage = () => {
    const { user } = useContext(AuthContext);
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await fetchPublishedSubjectContents();
            const list = Array.isArray(rows) ? rows : [];
            const found = list.find((row) => String(row._id) === String(lessonId));
            setLesson(found || null);
            if (!found) setError('This lesson is not available or is not published.');
        } catch {
            setError('Could not load lesson.');
            setLesson(null);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId) load();
    }, [lessonId, load]);

    if (user && user.role !== 'student') {
        const dest = user.role === 'tutor' ? '/tutor-dashboard' : '/admin';
        return <Navigate to={dest} replace />;
    }

    if (!lessonId) {
        return <Navigate to="/student-dashboard" replace />;
    }

    const tid = lesson ? String(lesson.createdBy?._id || lesson.createdBy || '') : '';
    const tutorName =
        lesson && typeof lesson.createdBy === 'object' && lesson.createdBy?.name ? lesson.createdBy.name : 'Tutor';
    const moduleHref =
        lesson && tid
            ? studentModulePath(tid, lesson.grade, lesson.subject)
            : '/student-dashboard';

    const pdfButtons = lesson ? getLessonPdfDisplayList(lesson) : [];

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eef2f6] via-sky-50/30 to-indigo-50/40" />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <Link to={moduleHref} className="inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-500 mb-4">
                    ← Back to module
                </Link>

                {loading ? (
                    <p className="text-center text-slate-500 py-16 animate-pulse font-medium">Opening week…</p>
                ) : !lesson ? (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 text-amber-900 px-4 py-4 text-sm">
                        {error}
                        <div className="mt-3">
                            <Link to="/student-dashboard" className="font-bold text-indigo-600">
                                All modules
                            </Link>
                        </div>
                    </div>
                ) : (
                    <article className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur-md shadow-xl shadow-indigo-500/10 overflow-hidden">
                        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 bg-gradient-to-br from-slate-50/80 to-white">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white text-base font-black">
                                        W{lesson.weekNumber}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                            {lesson.subject} · {lesson.grade === 0 ? 'Course module' : `Grade ${lesson.grade}`}
                                        </p>
                                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                                            {lesson.title}
                                        </h1>
                                        <p className="text-sm text-slate-600 mt-2">
                                            <span className="font-bold text-slate-800">{tutorName}</span>
                                            {lesson.lessonDate ? (
                                                <>
                                                    <span className="text-slate-400"> · </span>
                                                    {new Date(lesson.lessonDate).toLocaleDateString(undefined, {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </>
                                            ) : null}
                                        </p>
                                    </div>
                                </div>
                                {pdfButtons.length ? (
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        {pdfButtons.map((p) => (
                                            <button
                                                key={p.index}
                                                type="button"
                                                onClick={() =>
                                                    window.open(
                                                        getSubjectPdfWindowUrl(lesson._id, p.index),
                                                        '_blank',
                                                        'noopener,noreferrer'
                                                    )
                                                }
                                                className="shrink-0 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl shadow-md shadow-indigo-500/20"
                                            >
                                                Open: {p.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="px-6 sm:px-8 py-6 space-y-5 text-sm text-slate-700">
                            {lesson.description ? (
                                <section>
                                    <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Summary</p>
                                    <p className="leading-relaxed whitespace-pre-wrap">{lesson.description}</p>
                                </section>
                            ) : null}
                            {lesson.contentText ? (
                                <section>
                                    <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Lesson content</p>
                                    <p className="leading-relaxed whitespace-pre-wrap font-mono text-xs text-slate-800">
                                        {lesson.contentText}
                                    </p>
                                </section>
                            ) : null}
                            {lesson.homework ? (
                                <section>
                                    <p className="text-[11px] font-bold uppercase text-slate-400 mb-2">Homework</p>
                                    <p className="leading-relaxed whitespace-pre-wrap">{lesson.homework}</p>
                                </section>
                            ) : null}
                            <StudentLessonResources lesson={lesson} />
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
};

export default StudentLessonPage;
