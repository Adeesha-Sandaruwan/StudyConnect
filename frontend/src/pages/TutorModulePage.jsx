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

                            <section className="text-sm mt-6">
                                <h3 className="font-bold text-slate-800 text-base mb-2">Module announcements</h3>
                                {annLoading ? (
                                    <div className="rounded-lg p-3 bg-slate-100 text-slate-500 text-xs">Loading announcements…</div>
                                ) : annError ? (
                                    <div className="rounded-lg p-3 bg-red-100 text-red-800 text-xs">{annError}</div>
                                ) : announcements.length === 0 ? (
                                    <div className="rounded-lg p-3 bg-slate-50 text-slate-500 text-xs">No announcements yet.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {announcements.map((a) => {
                                            const isOwner = user && (user.role === 'admin' || user.role === 'tutor');
                                            const isEditing = editingAnnouncementId === a._id;

                                            if (isEditing) {
                                                return (
                                                    <li key={a._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                                                        <textarea
                                                            value={editingAnnouncementText}
                                                            onChange={(e) => setEditingAnnouncementText(e.target.value)}
                                                            rows={3}
                                                            className="w-full rounded-md border border-indigo-200 p-2 text-sm"
                                                        />
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleSaveEdit}
                                                                className="text-xs font-bold text-indigo-700"
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
                                                <li key={a._id} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed">
                                                    <p className="text-slate-700">{formatAnnouncement(a.message)}</p>
                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                        by {a.createdBy?.name || 'Admin'} • {new Date(a.createdAt).toLocaleString()}
                                                    </p>
                                                    {isOwner ? (
                                                        <div className="mt-1 flex gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditStart(a)}
                                                                className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(a._id)}
                                                                className="text-[11px] font-bold text-red-600 hover:text-red-700"
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
                                    <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                                        <p className="text-xs text-slate-500 mb-1">Use **bold**, *italic*, ==highlight==</p>
                                        <textarea
                                            value={newAnnouncement}
                                            onChange={(e) => setNewAnnouncement(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            placeholder="Type announcement text here..."
                                        />
                                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                                            <button
                                                type="button"
                                                onClick={handleCreateAnnouncement}
                                                disabled={savingAnnouncement}
                                                className="rounded-lg bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {savingAnnouncement ? 'Saving…' : 'Post announcement'}
                                            </button>
                                            <span className="text-xs text-slate-500">Tutor/Admin</span>
                                        </div>
                                    </div>
                                ) : null}
                            </section>
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
