import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents } from '../services/subjectContentApi';
import {
    groupPublishedByTutorModule,
    studentModulePath,
    formatLessonDateTime,
    getNearestLesson,
} from '../utils/subjectModules';
import { getCompletedLessonIds, getModuleCompletion } from '../utils/progressStorage';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [subjectQuery, setSubjectQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [completedLessonIds, setCompletedLessonIds] = useState(() => getCompletedLessonIds());

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const raw = await fetchPublishedSubjectContents();
            setModules(groupPublishedByTutorModule(Array.isArray(raw) ? raw : []));
        } catch {
            setError('Could not load tutor modules.');
            setModules([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        setCompletedLessonIds(getCompletedLessonIds());
    }, []);

    const filtered = useMemo(() => {
        const sq = subjectQuery.trim().toLowerCase();

        return modules.filter((m) => {
            if (gradeFilter === 'course') {
                if (m.grade !== 0) return false;
            } else {
                const gf = gradeFilter === '' ? null : Number(gradeFilter);
                if (gf !== null && !Number.isNaN(gf) && m.grade !== gf) return false;
            }
            if (sq && !String(m.subject).toLowerCase().includes(sq)) return false;
            return true;
        });
    }, [modules, subjectQuery, gradeFilter]);

    if (user && user.role !== 'student') {
        const dest = user.role === 'tutor' ? '/tutor-dashboard' : '/admin';
        return <Navigate to={dest} replace />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.12),transparent),radial-gradient(ellipse_60%_40%_at_100%_30%,rgba(99,102,241,0.1),transparent)]" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                <header className="mb-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Student hub</p>
                        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            Explore{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                                tutor modules
                            </span>
                        </h1>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            Published lessons from your tutors, grouped by subject and grade. Each card shows who is teaching so
                            you can follow the right pathway.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Subject</label>
                            <input
                                type="search"
                                value={subjectQuery}
                                onChange={(e) => setSubjectQuery(e.target.value)}
                                placeholder="e.g. ICT"
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Grade / type</label>
                            <select
                                value={gradeFilter}
                                onChange={(e) => setGradeFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            >
                                <option value="">All</option>
                                <option value="course">Course modules</option>
                                {Array.from({ length: 13 }, (_, i) => i + 1).map((g) => (
                                    <option key={g} value={g}>
                                        Grade {g}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur p-16 text-center text-slate-500 font-medium animate-pulse">
                        Loading published modules…
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 backdrop-blur p-12 text-center">
                        <div className="text-4xl mb-3">📖</div>
                        <h2 className="text-lg font-extrabold text-slate-900 mb-2">No modules to show yet</h2>
                        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                            {modules.length === 0
                                ? 'When tutors publish lessons, they will appear here with the tutor’s name.'
                                : 'Try adjusting your subject or grade filters.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
                        {filtered.map((mod) => {
                            const href = studentModulePath(mod.tutorId, mod.grade, mod.subject);
                            const accent = (mod.tutorId.length + mod.grade) % 4;
                            const rims = [
                                'from-sky-500 to-blue-600',
                                'from-indigo-500 to-violet-600',
                                'from-teal-500 to-emerald-600',
                                'from-amber-500 to-rose-500',
                            ];
                            return (
                                <article
                                    key={`${mod.tutorId}-${mod.subject}-${mod.grade}`}
                                    className="group rounded-3xl border border-white/60 bg-white/80 backdrop-blur-md shadow-lg shadow-slate-900/5 hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    <div className={`h-1 bg-gradient-to-r ${rims[accent]} opacity-90`} />
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-start gap-3 mb-4">
                                            {mod.tutorAvatar ? (
                                                <img
                                                    src={mod.tutorAvatar}
                                                    alt=""
                                                    className="h-12 w-12 rounded-2xl object-cover shrink-0 ring-2 ring-white shadow"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-lg font-black shrink-0">
                                                    {mod.tutorName.slice(0, 1).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-0.5">
                                                    Tutor
                                                </p>
                                                <p className="font-extrabold text-slate-900 leading-snug truncate">
                                                    {mod.tutorName}
                                                </p>
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-slate-800 mb-1">{mod.subject}</h3>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <p
                                                className={`text-xs font-bold inline-flex rounded-lg px-2.5 py-1 w-fit ${
                                                    mod.grade === 0
                                                        ? 'text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100'
                                                        : 'text-sky-700 bg-sky-50 border border-sky-100'
                                                }`}
                                            >
                                                {mod.grade === 0 ? 'Course module' : `Grade ${mod.grade}`}
                                            </p>
                                            {mod.grade === 0 ? (
                                                <span className="text-xs font-bold inline-flex rounded-lg px-2.5 py-1 text-fuchsia-700 bg-fuchsia-100/80 border border-fuchsia-200">
                                                    Recording only
                                                </span>
                                            ) : null}
                                        </div>
                                        {mod.grade !== 0 && mod.lessons.length > 0 && (() => {
                                            const nextLesson = getNearestLesson(mod.lessons);
                                            return (
                                                <p className="text-xs text-slate-600 flex-1 leading-relaxed mb-5">
                                                    Next class:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {formatLessonDateTime(nextLesson?.lessonDate, true) || 'TBA'}
                                                    </span>
                                                    <span className="text-slate-400"> · </span>
                                                    latest:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {nextLesson?.title || 'TBA'}
                                                    </span>
                                                </p>
                                            );
                                        })()}
                                        {mod.grade === 0 && (
                                            <p className="text-xs text-slate-600 flex-1 leading-relaxed mb-5">
                                                Published content without live class schedule.
                                            </p>
                                        )}
                                        {mod.lessons.length > 0 ? (
                                            <div className="mb-4">
                                                {(() => {
                                                    const progress = getModuleCompletion(mod.lessons, completedLessonIds);
                                                    return (
                                                        <>
                                                            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                                                                <span>
                                                                    {progress.completedCount} / {progress.total} lessons done
                                                                </span>
                                                                <span>{progress.percent}%</span>
                                                            </div>
                                                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full bg-indigo-600"
                                                                    style={{ width: `${progress.percent}%` }}
                                                                />
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ) : null}
                                        <Link
                                            to={href}
                                            className="mt-auto text-center rounded-xl bg-slate-900 text-white text-sm font-bold py-3 hover:bg-slate-800 transition-colors"
                                        >
                                            View module
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
