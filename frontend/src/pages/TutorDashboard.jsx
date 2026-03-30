import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createSubjectContent, fetchMySubjectContents } from '../services/subjectContentApi';
import { groupContentsByModule, modulePath } from '../utils/subjectModules';

const todayInput = () => new Date().toISOString().slice(0, 10);

const TutorDashboard = () => {
    const { user } = useContext(AuthContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState('');

    const [createOpen, setCreateOpen] = useState(false);
    const [createError, setCreateError] = useState('');
    const [creating, setCreating] = useState(false);

    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState(10);
    const [weekNumber, setWeekNumber] = useState(1);
    const [lessonDate, setLessonDate] = useState(todayInput());
    const [description, setDescription] = useState('');
    const [contentText, setContentText] = useState('');
    const [homework, setHomework] = useState('');
    const [status, setStatus] = useState('draft');
    const [pdfFile, setPdfFile] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setListError('');
        try {
            const raw = await fetchMySubjectContents();
            setModules(groupContentsByModule(raw));
        } catch {
            setListError('Could not load modules.');
            setModules([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const s = searchParams.get('subject');
        const g = searchParams.get('grade');
        const open = searchParams.get('newWeek');
        if (open && s && g) {
            setCreateOpen(true);
            setSubject(decodeURIComponent(s));
            setGrade(Number(g) || 10);
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const totalLessons = useMemo(() => modules.reduce((n, m) => n + m.lessons.length, 0), [modules]);

    const resetCreateForm = () => {
        setTitle('');
        setSubject('');
        setGrade(10);
        setWeekNumber(1);
        setLessonDate(todayInput());
        setDescription('');
        setContentText('');
        setHomework('');
        setStatus('draft');
        setPdfFile(null);
        setCreateError('');
    };

    const openCreateFresh = () => {
        resetCreateForm();
        setCreateOpen(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setCreateError('');
        try {
            const payload = {
                title,
                subject,
                grade: Number(grade),
                weekNumber: Number(weekNumber),
                lessonDate: lessonDate ? new Date(lessonDate).toISOString() : '',
                description,
                contentText,
                homework,
                status,
                resources: {
                    quizFormLink: '',
                    worksheetLink: '',
                    answerSheetLink: '',
                    meetingLink: '',
                    referenceLinks: [],
                    videoLinks: [],
                },
            };
            await createSubjectContent(payload, pdfFile || undefined);
            setCreateOpen(false);
            resetCreateForm();
            await load();
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (Array.isArray(err.response?.data?.errors) &&
                    err.response.data.errors.map((x) => x.msg || x.message).join('; ')) ||
                'Could not create lesson.';
            setCreateError(String(msg));
        } finally {
            setCreating(false);
        }
    };

    if (user && user.role !== 'tutor' && user.role !== 'admin') {
        return <Navigate to="/student-dashboard" replace />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_10%_-10%,rgba(91,124,250,0.18),transparent),radial-gradient(ellipse_70%_50%_at_90%_20%,rgba(139,92,246,0.14),transparent)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
                <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
                    <div className="space-y-3 max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Tutor workspace</p>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Teach in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">modules</span>, week by week.
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            Each module is a subject plus grade (for example <strong>AL ICT · Grade 10</strong>). Add weekly
                            lessons, lecture notes, PDFs, and links — then publish when you are ready. Your study assistant
                            is available on every module and lesson screen.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-slate-200/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                {modules.length} module{modules.length === 1 ? '' : 's'}
                            </span>
                            <span className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs font-bold">
                                {totalLessons} week{totalLessons === 1 ? '' : 's'} total
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateFresh}
                        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold px-6 py-4 shadow-xl shadow-indigo-500/30 hover:opacity-95 transition-opacity text-sm"
                    >
                        <span className="text-lg leading-none">＋</span>
                        New lesson / module
                    </button>
                </header>

                {loading ? (
                    <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur p-16 text-center text-slate-500 font-medium">
                        Loading your teaching library…
                    </div>
                ) : listError ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 text-sm">{listError}</div>
                ) : modules.length === 0 ? (
                    <div className="relative rounded-3xl overflow-hidden border border-indigo-100 bg-white/80 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 p-10 sm:p-14 text-center">
                        <div
                            className="absolute inset-0 opacity-[0.07]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="relative space-y-4 max-w-md mx-auto">
                            <div className="text-5xl">📚</div>
                            <h2 className="text-xl font-extrabold text-slate-900">Start your first module</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Create a week for any subject and grade. More weeks with the same subject and grade automatically
                                group into one module card.
                            </p>
                            <button
                                type="button"
                                onClick={openCreateFresh}
                                className="mt-2 inline-flex rounded-2xl bg-slate-900 text-white font-bold px-6 py-3 text-sm hover:bg-slate-800 transition-colors"
                            >
                                Create lesson
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                        {modules.map((mod) => {
                            const pub = mod.lessons.filter((l) => l.status === 'published').length;
                            const path = modulePath(mod.grade, mod.subject);
                            const accent = (mod.grade + mod.subject.length) % 4;
                            const borders = [
                                'from-cyan-500/90 to-blue-600/90',
                                'from-violet-500/90 to-fuchsia-600/90',
                                'from-amber-500/90 to-orange-600/90',
                                'from-emerald-500/90 to-teal-600/90',
                            ];
                            return (
                                <article
                                    key={`${mod.subject}-${mod.grade}`}
                                    className="group relative rounded-3xl border border-white/60 bg-white/75 backdrop-blur-md shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                                >
                                    <div
                                        className={`h-1.5 bg-gradient-to-r ${borders[accent]} opacity-90 group-hover:opacity-100 transition-opacity`}
                                    />
                                    <div className="p-6 flex flex-col h-full">
                                        <div className="flex justify-between items-start gap-2 mb-4">
                                            <div>
                                                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                                                    {mod.subject}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">
                                                    Grade {mod.grade}
                                                </p>
                                            </div>
                                            <span className="shrink-0 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-black px-2.5 py-1">
                                                {mod.lessons.length} wk
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 flex-1 leading-relaxed mb-5">
                                            Latest:{' '}
                                            <span className="font-semibold text-slate-800">{mod.lessons[0]?.title}</span>
                                            <span className="text-slate-400"> · Week {mod.lessons[0]?.weekNumber}</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wide mb-4">
                                            <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-100">
                                                {pub} live
                                            </span>
                                            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-amber-100">
                                                {mod.lessons.length - pub} draft
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            <Link
                                                to={path}
                                                className="flex-1 min-w-[120px] text-center rounded-xl bg-slate-900 text-white text-xs font-bold py-3 hover:bg-slate-800 transition-colors"
                                            >
                                                Open module
                                            </Link>
                                            <Link
                                                to={`/tutor-dashboard?newWeek=1&grade=${mod.grade}&subject=${encodeURIComponent(
                                                    mod.subject
                                                )}`}
                                                className="rounded-xl border-2 border-slate-200 text-slate-800 text-xs font-bold py-3 px-4 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                                            >
                                                ＋ Week
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {createOpen ? (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        aria-label="Close"
                        onClick={() => !creating && setCreateOpen(false)}
                    />
                    <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100">
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-extrabold tracking-tight">Create lesson</h2>
                                <p className="text-[11px] text-white/80 font-medium">
                                    Same subject + grade groups into one module.
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={creating}
                                onClick={() => setCreateOpen(false)}
                                className="text-white/90 hover:text-white font-bold text-sm px-2"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {createError ? (
                                <div className="rounded-xl bg-red-50 text-red-800 text-xs px-3 py-2 border border-red-100">
                                    {createError}
                                </div>
                            ) : null}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    placeholder="e.g. Introduction to databases"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Subject</label>
                                    <input
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                        placeholder="AL ICT"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Grade</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={13}
                                        required
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Week #</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={52}
                                        required
                                        value={weekNumber}
                                        onChange={(e) => setWeekNumber(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={lessonDate}
                                        onChange={(e) => setLessonDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/40"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    Short description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    Lecture notes (text)
                                </label>
                                <textarea
                                    value={contentText}
                                    onChange={(e) => setContentText(e.target.value)}
                                    rows={5}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y font-mono text-xs focus:ring-2 focus:ring-indigo-400/40"
                                    placeholder="Optional for now — you can expand on the lesson page."
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Homework</label>
                                <textarea
                                    value={homework}
                                    onChange={(e) => setHomework(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-y focus:ring-2 focus:ring-indigo-400/40"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                                    PDF notes (optional)
                                </label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                    className="text-xs w-full"
                                />
                            </div>
                            <div className="flex gap-3 pt-2 pb-6 sm:pb-2">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold py-3 text-sm disabled:opacity-60 shadow-lg shadow-indigo-500/20"
                                >
                                    {creating ? 'Creating…' : 'Create lesson'}
                                </button>
                                <button
                                    type="button"
                                    disabled={creating}
                                    onClick={() => setCreateOpen(false)}
                                    className="rounded-xl border border-slate-200 font-bold px-4 text-sm text-slate-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default TutorDashboard;
