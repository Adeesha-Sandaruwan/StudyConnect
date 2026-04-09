import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    fetchMySubjectContents,
    fetchModuleAnnouncements,
    createModuleAnnouncement,
    updateModuleAnnouncement,
    deleteModuleAnnouncement,
    deleteSubjectContent,
} from '../services/subjectContentApi';
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
    const [deletingModule, setDeletingModule] = useState(false);

    const [announcements, setAnnouncements] = useState([]);
    const [annLoading, setAnnLoading] = useState(false);
    const [annError, setAnnError] = useState('');
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [savingAnnouncement, setSavingAnnouncement] = useState(false);
    const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
    const [editingAnnouncementText, setEditingAnnouncementText] = useState('');

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

    const moduleType = useMemo(
        () => lessons?.[0]?.moduleType || (grade === 0 ? 'course' : 'school'),
        [lessons, grade]
    );

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
        } catch (error) {
            setAnnError('Could not load announcements');
            setAnnouncements([]);
        } finally {
            setAnnLoading(false);
        }
    }, [grade, subject, moduleType]);

    useEffect(() => {
        loadAnnouncements();
    }, [loadAnnouncements]);

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

    const handleCreateAnnouncement = async () => {
        const trimmed = newAnnouncement.trim();
        if (!trimmed) {
            setAnnError('Announcement cannot be empty');
            return;
        }

        setSavingAnnouncement(true);
        setAnnError('');
        try {
            await createModuleAnnouncement({
                grade,
                subject,
                moduleType,
                message: trimmed,
            });
            setNewAnnouncement('');
            await loadAnnouncements();
        } catch (error) {
            const errMsg =
                error?.response?.data?.message ||
                error?.message ||
                'Could not save announcement';
            setAnnError(errMsg);
        } finally {
            setSavingAnnouncement(false);
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;
        try {
            await deleteModuleAnnouncement(id);
            await loadAnnouncements();
        } catch {
            setAnnError('Could not delete announcement');
        }
    };

    const handleEditStart = (announcement) => {
        setEditingAnnouncementId(announcement._id);
        setEditingAnnouncementText(announcement.message || '');
        setAnnError('');
    };

    const handleEditCancel = () => {
        setEditingAnnouncementId(null);
        setEditingAnnouncementText('');
        setAnnError('');
    };

    const handleSaveEdit = async () => {
        if (!editingAnnouncementId) return;
        const trimmed = editingAnnouncementText.trim();
        if (!trimmed) {
            setAnnError('Announcement text cannot be empty');
            return;
        }

        try {
            await updateModuleAnnouncement(editingAnnouncementId, { message: trimmed });
            setEditingAnnouncementId(null);
            setEditingAnnouncementText('');
            await loadAnnouncements();
        } catch {
            setAnnError('Could not update announcement');
        }
    };

    const handleDeleteModule = async () => {
        const lessonIds = lessons.map((lesson) => lesson?._id).filter(Boolean);
        const announcementIds = announcements.map((announcement) => announcement?._id).filter(Boolean);

        if (!lessonIds.length || deletingModule) return;

        const confirmed = window.confirm(
            `Delete the entire ${subject} module?\n\nThis will permanently remove ${lessonIds.length} week${
                lessonIds.length === 1 ? '' : 's'
            }${announcementIds.length ? ` and ${announcementIds.length} announcement${announcementIds.length === 1 ? '' : 's'}` : ''}.`
        );

        if (!confirmed) return;

        setDeletingModule(true);
        setLoadError('');
        setAnnError('');

        try {
            const results = await Promise.allSettled([
                ...lessonIds.map((lessonId) => deleteSubjectContent(lessonId)),
                ...announcementIds.map((announcementId) => deleteModuleAnnouncement(announcementId)),
            ]);
            const failed = results.filter((result) => result.status === 'rejected');

            if (failed.length) {
                setLoadError('Could not fully delete this module. Please try again.');
                await load();
                await loadAnnouncements();
                return;
            }

            navigate('/tutor-dashboard');
        } catch {
            setLoadError('Could not delete this module.');
        } finally {
            setDeletingModule(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.22),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(168,85,247,0.12),transparent)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    <div className="flex-1 min-w-0 space-y-6">
                        <header className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-5 sm:p-6 shadow-xl shadow-indigo-500/10 backdrop-blur-xl">
                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_32%)]" />
                            <div className="relative space-y-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-2">
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
                                        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                                            Your module groups every week you teach this subject. Open a week to edit notes and
                                            files, or ask the assistant using any week as context.
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 pt-1">
                                            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                                                {lessons.length} week{lessons.length === 1 ? '' : 's'}
                                            </span>
                                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                {publishedCount} published
                                            </span>
                                            <Link
                                                to={`/tutor-dashboard?newWeek=1&grade=${grade}&subject=${encodeURIComponent(subject)}`}
                                                className="ml-1 inline-flex rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-500"
                                            >
                                                ＋ Add week to this module
                                            </Link>
                                            {lessons.length > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={handleDeleteModule}
                                                    disabled={deletingModule}
                                                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {deletingModule ? 'Deleting module…' : 'Delete module'}
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-indigo-100 bg-white/85 px-4 py-3 text-sm text-slate-600 shadow-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">
                                            Teaching focus
                                        </p>
                                        <p className="mt-2 max-w-xs leading-relaxed">
                                            Keep lessons, announcements, and AI support together in one polished space for this
                                            subject.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-[1.25rem] border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Weeks</p>
                                        <p className="mt-2 text-2xl font-black text-slate-900">{lessons.length}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Published</p>
                                        <p className="mt-2 text-2xl font-black text-emerald-900">{publishedCount}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-amber-100 bg-amber-50/80 p-4 shadow-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Drafts</p>
                                        <p className="mt-2 text-2xl font-black text-amber-900">{lessons.length - publishedCount}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-violet-100 bg-violet-50/80 p-4 shadow-sm">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">Announcements</p>
                                        <p className="mt-2 text-2xl font-black text-violet-900">{announcements.length}</p>
                                    </div>
                                </div>

                                <section className="rounded-[1.5rem] border border-indigo-100/80 bg-gradient-to-br from-white to-indigo-50/70 p-4 sm:p-5 text-sm shadow-sm">
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-800">Module announcements</h3>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Share reminders and updates with students following this module.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                                            {announcements.length} posted
                                        </span>
                                    </div>
                                    {annLoading ? (
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-xs text-slate-500">
                                            Loading announcements…
                                        </div>
                                    ) : annError ? (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                                            {annError}
                                        </div>
                                    ) : announcements.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-200 bg-white/70 p-3 text-xs text-slate-500">
                                            No announcements yet.
                                        </div>
                                    ) : (
                                        <ul className="space-y-2.5">
                                            {announcements.map((a) => {
                                                const isOwner = user && (user.role === 'admin' || user.role === 'tutor');
                                                const isEditing = editingAnnouncementId === a._id;

                                                if (isEditing) {
                                                    return (
                                                        <li key={a._id} className="rounded-[1.25rem] border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm">
                                                            <textarea
                                                                value={editingAnnouncementText}
                                                                onChange={(e) => setEditingAnnouncementText(e.target.value)}
                                                                rows={3}
                                                                className="w-full rounded-xl border border-indigo-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                            />
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={handleSaveEdit}
                                                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white"
                                                                >
                                                                    Save
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleEditCancel}
                                                                    className="text-xs font-semibold text-slate-500"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                }

                                                return (
                                                    <li key={a._id} className="rounded-[1.25rem] border border-slate-200 bg-white px-3 py-3 text-sm leading-relaxed shadow-sm">
                                                        <p className="text-slate-700">{formatAnnouncement(a.message)}</p>
                                                        <p className="mt-1 text-[11px] text-slate-400">
                                                            by {a.createdBy?.name || 'Admin'} • {new Date(a.createdAt).toLocaleString()}
                                                        </p>
                                                        {isOwner ? (
                                                            <div className="mt-2 flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditStart(a)}
                                                                    className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(a._id)}
                                                                    className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        ) : null}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}

                                    {user?.role === 'admin' || user?.role === 'tutor' ? (
                                        <div className="mt-4 rounded-[1.25rem] border border-indigo-200 bg-white/80 p-3 shadow-sm">
                                            <p className="mb-1 text-xs text-slate-500">Use **bold**, *italic*, ==highlight==</p>
                                            <textarea
                                                value={newAnnouncement}
                                                onChange={(e) => setNewAnnouncement(e.target.value)}
                                                rows={3}
                                                className="w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                                placeholder="Type announcement text here..."
                                            />
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleCreateAnnouncement}
                                                    disabled={savingAnnouncement}
                                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    {savingAnnouncement ? 'Saving…' : 'Post announcement'}
                                                </button>
                                                <span className="text-xs text-slate-500">Tutor/Admin</span>
                                            </div>
                                        </div>
                                    ) : null}
                                </section>
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
                                    const lessonDateLabel = lesson.lessonDate
                                        ? new Date(lesson.lessonDate).toLocaleDateString()
                                        : 'Date pending';

                                    return (
                                        <li
                                            key={lesson._id}
                                            className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/90 shadow-lg shadow-slate-900/5 transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-indigo-500/10"
                                        >
                                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 opacity-90" />
                                            <div className="flex flex-col gap-4 p-5 sm:p-6">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="flex min-w-0 flex-1 items-start gap-4">
                                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-black text-white shadow-lg shadow-indigo-500/20">
                                                            W{lesson.weekNumber}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h2 className="truncate text-lg font-bold text-slate-900">{lesson.title}</h2>
                                                            <p className="mt-1 text-sm text-slate-500">
                                                                {lesson.description
                                                                    ? lesson.description.slice(0, 110) +
                                                                      (lesson.description.length > 110 ? '…' : '')
                                                                    : 'No short description yet'}
                                                            </p>
                                                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide">
                                                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                                                                    {lessonDateLabel}
                                                                </span>
                                                                {tutorPdfs.length ? (
                                                                    <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-indigo-700">
                                                                        {tutorPdfs.length} PDF{tutorPdfs.length === 1 ? '' : 's'}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                                                            lesson.status === 'published'
                                                                ? 'bg-emerald-100 text-emerald-800'
                                                                : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        {lesson.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (lesson._id) {
                                                                navigate(`/tutor-dashboard/lesson/${String(lesson._id)}`);
                                                            }
                                                        }}
                                                        className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:from-slate-800 hover:to-slate-700"
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
                        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Module insights</p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-slate-50 px-2 py-3">
                                    <p className="text-[10px] font-semibold text-slate-500">Weeks</p>
                                    <p className="mt-1 text-lg font-black text-slate-900">{lessons.length}</p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 px-2 py-3">
                                    <p className="text-[10px] font-semibold text-emerald-700">Live</p>
                                    <p className="mt-1 text-lg font-black text-emerald-900">{publishedCount}</p>
                                </div>
                                <div className="rounded-xl bg-violet-50 px-2 py-3">
                                    <p className="text-[10px] font-semibold text-violet-700">Posts</p>
                                    <p className="mt-1 text-lg font-black text-violet-900">{announcements.length}</p>
                                </div>
                            </div>
                        </div>
                        {lessons.length > 0 ? (
                            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
                                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
                                    Assistant context
                                </label>
                                <select
                                    value={aiLessonId}
                                    onChange={(e) => setAiLessonId(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
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
