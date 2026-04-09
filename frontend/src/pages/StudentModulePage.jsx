import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents, fetchModuleAnnouncements } from '../services/subjectContentApi';
import ModuleAIAssistant from '../components/tutor/ModuleAIAssistant';
import { formatLessonDateTime } from '../utils/subjectModules';
import { getLessonPdfDisplayList } from '../utils/lessonPdfs';
import { getCompletedLessonIds, getModuleCompletion, subscribeToLessonCompletion } from '../utils/progressStorage';
const StudentModulePage = () => {
    const { user } = useContext(AuthContext);
    const { creatorId, grade: gradeParam, subjectSlug } = useParams();

    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [meta, setMeta] = useState({ tutorName: '', subject: '', grade: null });
    const [announcements, setAnnouncements] = useState([]);
    const [annLoading, setAnnLoading] = useState(false);
    const [annError, setAnnError] = useState('');
    const [aiLessonId, setAiLessonId] = useState('');
        const [completedLessonIds, setCompletedLessonIds] = useState([]);

    const grade = Number(gradeParam);
    const subject = useMemo(() => {
        try {
            return decodeURIComponent(subjectSlug || '');
        } catch {
            return subjectSlug || '';
        }
    }, [subjectSlug]);

    const decodedCreatorId = useMemo(() => {
        try {
            return decodeURIComponent(creatorId || '');
        } catch {
            return creatorId || '';
        }
    }, [creatorId]);

    useEffect(() => {
        if (user?._id) {
            setCompletedLessonIds(getCompletedLessonIds(user._id));
        }
    }, [user]);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const rows = await fetchPublishedSubjectContents({
                grade,
                subject: subject.trim(),
            });
            const list = Array.isArray(rows) ? rows : [];
            const match = list.filter((row) => {
                const tid = String(row.createdBy?._id || row.createdBy || '');
                return tid === decodedCreatorId;
            });
            if (!match.length) {
                setLessons([]);
                setMeta({ tutorName: '', subject: '', grade: null });
            } else {
                const sorted = [...match].sort(
                    (a, b) => a.weekNumber - b.weekNumber || new Date(a.lessonDate) - new Date(b.lessonDate)
                );
                setLessons(sorted);
                const c = sorted[0].createdBy;
                setMeta({
                    tutorName: typeof c === 'object' && c?.name ? c.name : 'Tutor',
                    subject: sorted[0].subject,
                    grade: Number(sorted[0].grade),
                });
            }
        } catch {
            setError('Could not load this module.');
            setLessons([]);
        } finally {
            setLoading(false);
        }
    }, [grade, subject, decodedCreatorId]);

    const moduleType = useMemo(() => {
        if (lessons.length && lessons[0].moduleType) return lessons[0].moduleType;
        return grade === 0 ? 'course' : 'school';
    }, [lessons, grade]);

    const formatAnnouncement = (text) => {
        if (!text) return null;

        const tokens = [];
        const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|==(.*?)==)/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text))) {
            if (match.index > lastIndex) {
                tokens.push(text.slice(lastIndex, match.index));
            }
            if (match[2]) {
                tokens.push(<strong key={lastIndex}>{match[2]}</strong>);
            } else if (match[3]) {
                tokens.push(<em key={lastIndex}>{match[3]}</em>);
            } else if (match[4]) {
                tokens.push(
                    <span key={lastIndex} className="bg-yellow-100 text-yellow-900 px-1 rounded-sm font-semibold">
                        {match[4]}
                    </span>
                );
            }
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < text.length) {
            tokens.push(text.slice(lastIndex));
        }

        return tokens;
    };

    const loadAnnouncements = useCallback(async () => {
        if (Number.isNaN(grade) || !subject.trim()) return;
        setAnnLoading(true);
        setAnnError('');
        try {
            const data = await fetchModuleAnnouncements({ grade, subject, moduleType });
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch {
            setAnnError('Could not load announcements');
            setAnnouncements([]);
        } finally {
            setAnnLoading(false);
        }
    }, [grade, subject, moduleType]);

    useEffect(() => {
        if (!Number.isNaN(grade) && subject.trim() && decodedCreatorId) load();
    }, [load, grade, subject, decodedCreatorId]);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

    useEffect(() => {
        if (lessons.length && !aiLessonId) {
            setAiLessonId(lessons[0]._id);
        }
        if (!lessons.length) setAiLessonId('');
    }, [lessons, aiLessonId]);

    useEffect(() => {
            setCompletedLessonIds(getCompletedLessonIds(user?._id));
        }, [lessons.length, user]);

    useEffect(() => {
        if (!user?._id) return;
        return subscribeToLessonCompletion(user._id, setCompletedLessonIds);
    }, [user]);

    if (user && user.role !== 'student') {
        const dest = user.role === 'tutor' ? '/tutor-dashboard' : '/admin';
        return <Navigate to={dest} replace />;
    }

    if (Number.isNaN(grade) || !subject.trim() || !decodedCreatorId) {
        return <Navigate to="/student-dashboard" replace />;
    }

    const backHref = '/student-dashboard';
    const moduleProgress = getModuleCompletion(lessons, user?._id, completedLessonIds);
    const activeLesson = lessons.find((l) => l._id === aiLessonId);
    const nextLesson =
        lessons.find((lesson) => !completedLessonIds.includes(String(lesson._id))) || lessons[0] || null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-[linear-gradient(180deg,#f8fcff_0%,#eef8ff_45%,#f8fbff_100%)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_20%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.10),transparent_22%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(14,116,144,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <Link
                    to={backHref}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-xs font-bold text-sky-700 shadow-sm backdrop-blur hover:border-cyan-300 hover:text-cyan-700"
                >
                    ← All modules
                </Link>

                <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-cyan-100/80 bg-white/85 p-5 sm:p-7 shadow-[0_30px_100px_-40px_rgba(34,211,238,0.28)] backdrop-blur-xl">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_30%)]" />
                    <div className="relative grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-700">
                                    Student module
                                </span>
                                <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
                                    {moduleType === 'course' ? 'Self-paced' : 'Live weekly flow'}
                                </span>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 text-xl font-black text-white shadow-[0_0_24px_rgba(34,211,238,0.25)]">
                                    {meta.tutorName ? meta.tutorName.slice(0, 1).toUpperCase() : 'T'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                                        <span className="bg-gradient-to-r from-sky-700 via-cyan-600 to-violet-600 bg-clip-text text-transparent">
                                            {subject}
                                        </span>
                                        <span className="ml-2 text-lg font-bold text-slate-500 sm:text-xl">
                                            · {grade === 0 ? 'Course module' : `Grade ${grade}`}
                                        </span>
                                    </h1>
                                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                                        Learn with <span className="font-bold text-slate-900">{meta.tutorName || 'Tutor'}</span> through
                                        an immersive week-by-week path with notes, resources, and guided progress.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[1.25rem] border border-cyan-100 bg-white/90 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Progress</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">{moduleProgress.percent}%</p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {moduleProgress.completedCount} / {lessons.length || 0} weeks complete
                                    </p>
                                </div>
                                <div className="rounded-[1.25rem] border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Published weeks</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">{lessons.length}</p>
                                    <p className="mt-1 text-xs text-slate-600">Structured learning steps ready to open.</p>
                                </div>
                                <div className="rounded-[1.25rem] border border-violet-100 bg-violet-50/70 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Tutor</p>
                                    <p className="mt-2 text-base font-bold text-slate-900 truncate">{meta.tutorName || 'Tutor'}</p>
                                    <p className="mt-1 text-xs text-slate-600">Your guide for this learning track.</p>
                                </div>
                            </div>

                            {lessons.length ? (
                                <div>
                                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                                        <span>Module completion</span>
                                        <span>{moduleProgress.percent}%</span>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 shadow-[0_0_14px_rgba(34,211,238,0.35)]"
                                            style={{ width: `${moduleProgress.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            {nextLesson ? (
                                <Link
                                    to={`/student-dashboard/lesson/${nextLesson._id}`}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_-12px_rgba(34,211,238,0.45)] transition-transform hover:scale-[1.01]"
                                >
                                    Continue with Week {nextLesson.weekNumber}
                                    <span aria-hidden="true">→</span>
                                </Link>
                            ) : null}
                        </div>

                        <section className="rounded-[1.5rem] border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/70 p-4 sm:p-5 text-sm text-slate-700 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Announcements</h3>
                                    <p className="mt-1 text-xs text-slate-500">Latest updates for this module.</p>
                                </div>
                                <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-700">
                                    {announcements.length} posts
                                </span>
                            </div>
                            {annLoading ? (
                                <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-500">Loading announcements…</div>
                            ) : annError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{annError}</div>
                            ) : announcements.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-xs text-slate-500">No announcements yet.</div>
                            ) : (
                                <ul className="space-y-2.5">
                                    {announcements.map((a) => (
                                        <li key={a._id} className="text-xs text-slate-700">
                                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 leading-relaxed shadow-sm">
                                                {formatAnnouncement(a.message)}
                                            </div>
                                            <div className="mt-1 text-[10px] text-slate-400">
                                                by {a.createdBy?.name || 'Admin'} • {new Date(a.createdAt).toLocaleDateString()}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                </header>

                {loading ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-10 text-center text-sm font-medium text-slate-500 shadow-sm backdrop-blur animate-pulse">
                        Loading lessons…
                    </div>
                ) : error ? (
                    <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : (
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
                        <div className="flex-1 min-w-0 space-y-4">
                            {lessons.length === 0 ? (
                                <div className="rounded-[1.75rem] border border-dashed border-cyan-200 bg-white/80 p-8 text-center text-sm text-slate-600 shadow-sm backdrop-blur">
                                    No published lessons found for this module, or the link is outdated.
                                    <div className="mt-4">
                                        <Link to={backHref} className="font-bold text-sky-700 hover:text-cyan-700">
                                            Back to dashboard
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-[1.25rem] border border-cyan-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
                                        Open a week to explore notes, files, and guided resources in a larger polished study view.
                                    </div>
                                    <ul className="space-y-4">
                                        {lessons.map((lesson) => {
                                            const lessonPdfs = getLessonPdfDisplayList(lesson);
                                            const isDone = completedLessonIds.includes(String(lesson._id));
                                            return (
                                                <li key={lesson._id}>
                                                    <Link
                                                        to={`/student-dashboard/lesson/${lesson._id}`}
                                                        className="group relative block overflow-hidden rounded-[1.75rem] border border-cyan-100 bg-white/90 px-5 py-5 shadow-[0_18px_60px_-34px_rgba(34,211,238,0.35)] transition-all hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_22px_70px_-30px_rgba(99,102,241,0.20)]"
                                                    >
                                                        <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_34%)]" />
                                                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                                                            <div className="flex min-w-0 flex-1 items-start gap-4">
                                                                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 text-base font-black text-white shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-transform group-hover:scale-105">
                                                                    W{lesson.weekNumber}
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                                                        <h2 className="truncate text-xl font-bold text-slate-900 transition-colors group-hover:text-sky-700">
                                                                            {lesson.title}
                                                                        </h2>
                                                                        <span
                                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                                isDone
                                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                                    : 'bg-slate-100 text-slate-600'
                                                                            }`}
                                                                        >
                                                                            {isDone ? 'Done' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm leading-relaxed text-slate-600">
                                                                        {lesson.description
                                                                            ? lesson.description.slice(0, 120) +
                                                                              (lesson.description.length > 120 ? '…' : '')
                                                                            : 'Open this week to view the lesson summary and guided study notes.'}
                                                                    </p>
                                                                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                                                                        {lesson.lessonDate ? (
                                                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                                                                                {formatLessonDateTime(lesson.lessonDate, true)}
                                                                            </span>
                                                                        ) : null}
                                                                        {lessonPdfs.length ? (
                                                                            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-cyan-700">
                                                                                {lessonPdfs.length} PDF{lessonPdfs.length === 1 ? '' : 's'}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <span className="shrink-0 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 sm:pr-3">
                                                                View lesson →
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </div>

                        {lessons.length > 0 ? (
                            <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 lg:sticky lg:top-24 space-y-4">
                                <div className="rounded-[1.5rem] border border-cyan-100 bg-white/85 p-4 text-slate-700 shadow-sm backdrop-blur">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Your momentum</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">{moduleProgress.percent}% complete</p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {moduleProgress.completedCount} of {lessons.length} weeks finished.
                                    </p>
                                    {nextLesson ? (
                                        <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-slate-700">
                                            Next best step: <span className="font-bold text-slate-900">Week {nextLesson.weekNumber}</span>
                                        </p>
                                    ) : null}
                                </div>

                                <div className="rounded-[1.5rem] border border-cyan-100 bg-white/85 px-4 py-4 text-slate-700 shadow-sm backdrop-blur">
                                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-cyan-700">
                                        Assistant context
                                    </label>
                                    <select
                                        value={aiLessonId}
                                        onChange={(e) => setAiLessonId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                                    >
                                        {lessons.map((l) => (
                                            <option key={l._id} value={l._id}>
                                                Week {l.weekNumber}: {l.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <ModuleAIAssistant
                                    contentId={aiLessonId}
                                    contextLabel={
                                        activeLesson
                                            ? `Week ${activeLesson.weekNumber} · ${activeLesson.title}`
                                            : 'Module'
                                    }
                                    subtitle="Ask questions using your published lesson + PDF."
                                />
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentModulePage;
