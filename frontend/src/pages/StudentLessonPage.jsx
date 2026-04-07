import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents, getSubjectPdfWindowUrl } from '../services/subjectContentApi';
import { studentModulePath, formatLessonDateTime } from '../utils/subjectModules';
import StudentLessonResources from '../components/student/StudentLessonResources';
import { getLessonPdfDisplayList } from '../utils/lessonPdfs';
import { isLessonCompleted, setLessonCompleted } from '../utils/progressStorage';

const StudentLessonPage = () => {
    const { user } = useContext(AuthContext);
    const { lessonId } = useParams();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [completed, setCompleted] = useState(false);

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

    useEffect(() => {
        if (lesson && lesson._id) {
            setCompleted(isLessonCompleted(lesson._id, user?._id));
        }
    }, [lesson, user]);

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
    const resources = lesson?.resources || {};
    const hasExtraResources =
        pdfButtons.length > 0 ||
        Boolean(resources.quizFormLink || resources.worksheetLink || resources.answerSheetLink || resources.meetingLink) ||
        (Array.isArray(resources.referenceLinks) && resources.referenceLinks.some(Boolean)) ||
        (Array.isArray(resources.videoLinks) && resources.videoLinks.some(Boolean));

    return (
        <div className="min-h-screen relative overflow-hidden bg-[linear-gradient(180deg,#f8fcff_0%,#eef8ff_45%,#f8fbff_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_20%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.08),transparent_22%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(14,116,144,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <Link
                    to={moduleHref}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-xs font-bold text-sky-700 shadow-sm backdrop-blur hover:border-cyan-300 hover:text-cyan-700"
                >
                    ← Back to module
                </Link>

                {loading ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-16 text-center text-sm font-medium text-slate-500 shadow-sm backdrop-blur animate-pulse">
                        Opening week…
                    </div>
                ) : !lesson ? (
                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                        {error}
                        <div className="mt-3">
                            <Link to="/student-dashboard" className="font-bold text-sky-700 hover:text-cyan-700">
                                All modules
                            </Link>
                        </div>
                    </div>
                ) : (
                    <article className="space-y-6">
                        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/85 p-6 sm:p-8 shadow-[0_30px_100px_-40px_rgba(34,211,238,0.28)] backdrop-blur-xl">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
                            <div className="relative">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 text-base font-black text-white shadow-[0_0_18px_rgba(34,211,238,0.28)]">
                                            W{lesson.weekNumber}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700/80">
                                                {lesson.subject} · {lesson.grade === 0 ? 'Course module' : `Grade ${lesson.grade}`}
                                            </p>
                                            <h1 className="mt-1 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                                                {lesson.title}
                                            </h1>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                                <span className="font-bold text-slate-900">{tutorName}</span>
                                                {lesson.lessonDate ? (
                                                    <>
                                                        <span className="text-slate-400">•</span>
                                                        {formatLessonDateTime(lesson.lessonDate, true)}
                                                    </>
                                                ) : null}
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        completed
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {completed ? 'Completed' : 'Not completed'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!lesson || !lesson._id) return;
                                            setCompleted((prev) => {
                                                const next = !prev;
                                                setLessonCompleted(lesson._id, next, user?._id);
                                                return next;
                                            });
                                        }}
                                        className={`rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
                                            completed
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                                : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_12px_28px_-12px_rgba(34,211,238,0.45)] hover:scale-[1.01]'
                                        }`}
                                    >
                                        {completed ? 'Mark as not done' : 'Mark as done'}
                                    </button>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <div className="rounded-[1.25rem] border border-cyan-100 bg-white p-4 shadow-sm">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Mentor</p>
                                        <p className="mt-2 text-base font-bold text-slate-900">{tutorName}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Schedule</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                            {lesson.lessonDate ? formatLessonDateTime(lesson.lessonDate, true) : 'Self-paced'}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-violet-100 bg-violet-50/70 p-4 shadow-sm">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Resources</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                            {pdfButtons.length ? `${pdfButtons.length} PDF file${pdfButtons.length === 1 ? '' : 's'}` : 'Use links below'}
                                        </p>
                                    </div>
                                </div>

                                {pdfButtons.length ? (
                                    <div className="mt-4 flex flex-wrap gap-2">
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
                                                className="shrink-0 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-xs font-bold text-cyan-700 shadow-sm hover:bg-cyan-100"
                                            >
                                                Open: {p.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <div className="grid gap-4">
                            {lesson.description ? (
                                <section className="rounded-[1.5rem] border border-cyan-100 bg-white/90 p-5 text-slate-700 shadow-sm backdrop-blur">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700/80">Summary</p>
                                    <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{lesson.description}</p>
                                </section>
                            ) : null}
                            {lesson.contentText ? (
                                <section className="rounded-[1.5rem] border border-fuchsia-100 bg-white/90 p-5 text-slate-700 shadow-sm backdrop-blur">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-700/80">Lesson content</p>
                                    <p className="whitespace-pre-wrap font-mono text-[13px] leading-7 text-slate-800">
                                        {lesson.contentText}
                                    </p>
                                </section>
                            ) : null}
                            {lesson.homework ? (
                                <section className="rounded-[1.5rem] border border-emerald-100 bg-white/90 p-5 text-slate-700 shadow-sm backdrop-blur">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/80">Homework</p>
                                    <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{lesson.homework}</p>
                                </section>
                            ) : null}
                            {hasExtraResources ? (
                                <section className="rounded-[1.5rem] border border-cyan-100 bg-white/90 p-5 text-slate-700 shadow-sm backdrop-blur">
                                    <div className="mb-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700/80">Extra resources</p>
                                        <p className="mt-1 text-sm text-slate-500">Open supporting links, worksheets, and study videos for this week.</p>
                                    </div>
                                    <StudentLessonResources lesson={lesson} />
                                </section>
                            ) : null}
                        </div>
                    </article>
                )}
            </div>
        </div>
    );
};

export default StudentLessonPage;
