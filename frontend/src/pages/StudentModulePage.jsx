import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { fetchPublishedSubjectContents } from '../services/subjectContentApi';
const StudentModulePage = () => {
    const { user } = useContext(AuthContext);
    const { creatorId, grade: gradeParam, subjectSlug } = useParams();

    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [meta, setMeta] = useState({ tutorName: '', subject: '', grade: null });

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

    useEffect(() => {
        if (!Number.isNaN(grade) && subject.trim() && decodedCreatorId) load();
    }, [load, grade, subject, decodedCreatorId]);

    if (user && user.role !== 'student') {
        const dest = user.role === 'tutor' ? '/tutor-dashboard' : '/admin';
        return <Navigate to={dest} replace />;
    }

    if (Number.isNaN(grade) || !subject.trim() || !decodedCreatorId) {
        return <Navigate to="/student-dashboard" replace />;
    }

    const backHref = '/student-dashboard';

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eef2f6] via-sky-50/30 to-indigo-50/40" />
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
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
                                <span className="text-slate-400 font-bold text-lg sm:text-xl ml-2">· Grade {grade}</span>
                            </h1>
                            <p className="text-sm text-slate-600 mt-2">
                                <span className="font-bold text-slate-800">{meta.tutorName || 'Tutor'}</span>
                                <span className="text-slate-400"> · </span>
                                {lessons.length} published week{lessons.length === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <p className="text-center text-slate-500 py-12 animate-pulse font-medium">Loading lessons…</p>
                ) : error ? (
                    <div className="rounded-2xl border border-red-100 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
                ) : lessons.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-slate-600 text-sm">
                        No published lessons found for this module, or the link is outdated.
                        <div className="mt-4">
                            <Link to={backHref} className="font-bold text-indigo-600">
                                Back to dashboard
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        <p className="text-xs text-slate-500 mb-1">Tap a week to open the full lesson.</p>
                        {lessons.map((lesson) => (
                            <li key={lesson._id}>
                                <Link
                                    to={`/student-dashboard/lesson/${lesson._id}`}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-sm hover:border-indigo-300 hover:shadow-md hover:bg-white transition-all group"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-black group-hover:scale-105 transition-transform">
                                            W{lesson.weekNumber}
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                                                {lesson.title}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                {lesson.lessonDate
                                                    ? new Date(lesson.lessonDate).toLocaleDateString(undefined, {
                                                          year: 'numeric',
                                                          month: 'short',
                                                          day: 'numeric',
                                                      })
                                                    : ''}
                                                {lesson.resources?.pdfUrl ? (
                                                    <span className="text-indigo-600 font-semibold"> · PDF</span>
                                                ) : null}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-indigo-600 sm:pr-2">View lesson →</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default StudentModulePage;
