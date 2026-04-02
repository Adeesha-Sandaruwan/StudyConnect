import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchMySubjectContents } from '../services/subjectContentApi';
import ModuleAIAssistant from '../components/tutor/ModuleAIAssistant';
import { getLessonPdfDisplayList } from '../utils/lessonPdfs';
const TutorModulePage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const { grade: gradeParam, subjectSlug } = useParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [aiLessonId, setAiLessonId] = useState('');

    const grade = Number(gradeParam);
    const subject = useMemo(() => {
        try {
            return decodeURIComponent(subjectSlug || '');
        } catch {
            return subjectSlug || '';
        }
    }, [subjectSlug]);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError('');
        try {
            const all = await fetchMySubjectContents();
            setItems(Array.isArray(all) ? all : []);
        } catch {
            setLoadError('Could not load your subject content.');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const lessons = useMemo(() => {
        return items
            .filter(
                (x) =>
                    Number(x.grade) === grade &&
                    String(x.subject).trim().toLowerCase() === subject.trim().toLowerCase()
            )
            .sort((a, b) => a.weekNumber - b.weekNumber);
    }, [items, grade, subject]);

    useEffect(() => {
        if (lessons.length && !lessons.some((l) => l._id === aiLessonId)) {
            setAiLessonId(lessons[0]._id);
        }
        if (!lessons.length) setAiLessonId('');
    }, [lessons, aiLessonId]);

    if (user && user.role !== 'tutor' && user.role !== 'admin') {
        return <Navigate to="/student-dashboard" replace />;
    }

    if (Number.isNaN(grade) || !subject.trim()) {
        return <Navigate to="/tutor-dashboard" replace />;
    }

    const activeLesson = lessons.find((l) => l._id === aiLessonId);
    const publishedCount = lessons.filter((l) => l.status === 'published').length;

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.22),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(168,85,247,0.12),transparent)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    <div className="flex-1 min-w-0 space-y-6">
                        <header className="space-y-2">
                            <Link
                                to="/tutor-dashboard"
                                className="inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                            >
                                ← Back to tutor hub
                            </Link>
                            <div className="flex flex-wrap items-end gap-3">
                                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                    {subject}
                                </h1>
                                <span className="mb-1.5 inline-flex items-center rounded-full bg-slate-900 text-white text-xs font-bold px-3 py-1">
                                    {grade === 0 ? 'Course module' : `Grade ${grade}`}
                                </span>
                            </div>
                            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                                Your module groups every week you teach this subject. Open a week to edit notes and files, or
                                ask the assistant using any week as context.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1 items-center">
                                <span className="text-xs font-semibold text-slate-600 bg-white/80 border border-slate-200/80 rounded-full px-3 py-1">
                                    {lessons.length} week{lessons.length === 1 ? '' : 's'}
                                </span>
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
                                    {publishedCount} published
                                </span>
                                <Link
                                    to={`/tutor-dashboard?newWeek=1&grade=${grade}&subject=${encodeURIComponent(subject)}`}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 ml-1"
                                >
                                    ＋ Add week to this module
                                </Link>
                            </div>
                        </header>

                        {loading ? (
                            <div className="rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur p-10 text-center text-slate-500 text-sm font-medium animate-pulse">
                                Loading module…
                            </div>
                        ) : loadError ? (
                            <div className="rounded-2xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800">
                                {loadError}
                            </div>
                        ) : lessons.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-8 text-center">
                                <p className="text-slate-600 text-sm mb-4">No lessons in this module yet.</p>
                                <Link
                                    to="/tutor-dashboard"
                                    className="inline-flex rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white text-sm font-bold px-5 py-2.5 shadow-lg shadow-indigo-500/20"
                                >
                                    Create your first week
                                </Link>
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {lessons.map((lesson) => {
                                    const tutorPdfs = getLessonPdfDisplayList(lesson);
                                    return (
                                    <li
                                        key={lesson._id}
                                        className="group rounded-3xl border border-white/70 bg-white/90 backdrop-blur-md shadow-sm hover:shadow-lg hover:border-indigo-200/80 transition-all overflow-hidden"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6">
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="shrink-0 h-16 w-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-base font-black">
                                                    W{lesson.weekNumber}
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="font-bold text-slate-900 text-lg truncate">{lesson.title}</h2>
                                                    <p className="text-sm text-slate-500 truncate">
                                                        {lesson.description
                                                            ? lesson.description.slice(0, 80) +
                                                              (lesson.description.length > 80 ? '…' : '')
                                                            : 'No short description yet'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                <span
                                                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg ${
                                                        lesson.status === 'published'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {lesson.status}
                                                </span>
                                                {tutorPdfs.length ? (
                                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                                                        {tutorPdfs.length} PDF
                                                        {tutorPdfs.length === 1 ? '' : 's'}
                                                    </span>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (lesson._id) {
                                                            navigate(`/tutor-dashboard/lesson/${String(lesson._id)}`);
                                                        }
                                                    }}
                                                    className="rounded-xl bg-slate-900 text-white text-xs font-bold px-4 py-2 hover:bg-slate-800 transition-colors"
                                                >
                                                    Edit week
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 space-y-4">
                        {lessons.length > 0 ? (
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
                        ) : null}
                        <ModuleAIAssistant
                            contentId={aiLessonId}
                            contextLabel={activeLesson ? `Week ${activeLesson.weekNumber} · ${activeLesson.title}` : 'Module'}
                            subtitle={
                                activeLesson
                                    ? 'Uses description, lesson text, and PDF for this week.'
                                    : 'Add a week to unlock the assistant.'
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorModulePage;
