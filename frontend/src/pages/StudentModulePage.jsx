import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents, fetchModuleAnnouncements } from '../services/subjectContentApi';
import ModuleAIAssistant from '../components/tutor/ModuleAIAssistant';
import { formatLessonDateTime } from '../utils/subjectModules';
import { getLessonPdfDisplayList } from '../utils/lessonPdfs';
import { getCompletedLessonIds, getModuleCompletion } from '../utils/progressStorage';
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
    const [completedLessonIds, setCompletedLessonIds] = useState(() => getCompletedLessonIds());

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
        setCompletedLessonIds(getCompletedLessonIds());
    }, [lessons.length]);

    if (user && user.role !== 'student') {
        const dest = user.role === 'tutor' ? '/tutor-dashboard' : '/admin';
        return <Navigate to={dest} replace />;
    }

    if (Number.isNaN(grade) || !subject.trim() || !decodedCreatorId) {
        return <Navigate to="/student-dashboard" replace />;
    }

    const backHref = '/student-dashboard';

    const activeLesson = lessons.find((l) => l._id === aiLessonId);

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eef2f6] via-sky-50/30 to-indigo-50/40" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <Link to={backHref} className="inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-500 mb-4">
                    ← All modules
                </Link>

                <header className="rounded-3xl border border-white/70 bg-white/80 backdrop-blur-md shadow-lg shadow-indigo-500/5 p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center text-xl font-black shrink-0">
                            {meta.tutorName ? meta.tutorName.slice(0, 1).toUpperCase() : 'T'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                {subject}
                                <span className="text-slate-400 font-bold text-lg sm:text-xl ml-2">
                                    · {grade === 0 ? 'Course module' : `Grade ${grade}`}
                                </span>
                            </h1>
                            <p className="text-sm text-slate-600 mt-2">
                                <span className="font-bold text-slate-800">{meta.tutorName || 'Tutor'}</span>
                                <span className="text-slate-400"> · </span>
                                {lessons.length} published week{lessons.length === 1 ? '' : 's'}
                            </p>
                            {lessons.length ? (
                                <div className="mt-4 text-sm">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                        <span>
                                            {getModuleCompletion(lessons, completedLessonIds).completedCount} / {lessons.length} done
                                        </span>
                                        <span>{getModuleCompletion(lessons, completedLessonIds).percent}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-indigo-600"
                                            style={{ width: `${getModuleCompletion(lessons, completedLessonIds).percent}%` }}
                                        />
                                    </div>
                                </div>
                            ) : null}

                            <section className="mt-5 px-3 py-3 border border-indigo-100 bg-indigo-50 rounded-2xl">
                                <h3 className="text-sm font-bold text-indigo-900 mb-1">Announcements</h3>
                                {annLoading ? (
                                    <div className="text-xs text-slate-500">Loading announcements…</div>
                                ) : annError ? (
                                    <div className="text-xs text-red-700">{annError}</div>
                                ) : announcements.length === 0 ? (
                                    <div className="text-xs text-slate-500">No announcements yet.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {announcements.map((a) => (
                                            <li key={a._id} className="text-xs text-indigo-900">
                                                <div className="rounded-md border border-indigo-200 bg-white px-2 py-1">
                                                    {formatAnnouncement(a.message)}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    by {a.createdBy?.name || 'Admin'} • {new Date(a.createdAt).toLocaleDateString()}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>                    </div>
                </header>

                {loading ? (
                    <p className="text-center text-slate-500 py-12 animate-pulse font-medium">Loading lessons…</p>
                ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
                ) : (
                    <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                        <div className="flex-1 min-w-0 space-y-3">
                            {lessons.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-slate-600 text-sm">
                                    No published lessons found for this module, or the link is outdated.
                                    <div className="mt-4">
                                        <Link to={backHref} className="font-bold text-indigo-600">
                                            Back to dashboard
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-500 mb-1">Tap a week to open the full lesson.</p>
                                    <ul className="space-y-3">
                                        {lessons.map((lesson) => {
                                            const lessonPdfs = getLessonPdfDisplayList(lesson);
                                            return (
                                                <li key={lesson._id}>
                                                    <Link
                                                        to={`/student-dashboard/lesson/${lesson._id}`}
                                                        className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 sm:px-6 py-5 rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-sm shadow-sm hover:border-indigo-300 hover:shadow-lg hover:bg-white transition-all group"
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                                            <span className="shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-600 text-white text-base font-black group-hover:scale-105 transition-transform">
                                                                W{lesson.weekNumber}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h2 className="font-bold text-slate-900 text-lg truncate group-hover:text-indigo-700 transition-colors">
                                                                        {lesson.title}
                                                                    </h2>
                                                                    <span
                                                                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                                            completedLessonIds.includes(String(lesson._id))
                                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                                : 'bg-slate-100 text-slate-600'
                                                                        }`}
                                                                    >
                                                                        {completedLessonIds.includes(String(lesson._id)) ? 'Done' : 'Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-slate-500">
                                                                    {lesson.lessonDate ? formatLessonDateTime(lesson.lessonDate, true) : ''}
                                                                    {lessonPdfs.length ? (
                                                                        <span className="text-indigo-600 font-semibold">
                                                                            {' '}
                                                                            · {lessonPdfs.length} PDF
                                                                            {lessonPdfs.length === 1 ? '' : 's'}
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="shrink-0 text-xs font-bold text-indigo-600 sm:pr-2">
                                                            View lesson →
                                                        </span>
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
                                <div className="rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur px-4 py-4 shadow-sm">
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                        Assistant context
                                    </label>
                                    <select
                                        value={aiLessonId}
                                        onChange={(e) => setAiLessonId(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white text-sm text-slate-800 px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
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
