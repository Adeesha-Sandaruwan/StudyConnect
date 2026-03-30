import { useContext, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
    deleteSubjectContent,
    fetchSubjectContentById,
    getSubjectPdfWindowUrl,
    updateSubjectContent,
    uploadSubjectPdf,
} from '../services/subjectContentApi';
import ModuleAIAssistant from '../components/tutor/ModuleAIAssistant';
import { modulePath } from '../utils/subjectModules';

const emptyResources = {
    quizFormLink: '',
    worksheetLink: '',
    answerSheetLink: '',
    meetingLink: '',
    referenceLinks: [],
    videoLinks: [],
};

function toDateInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

function splitLinks(text) {
    if (!text || !String(text).trim()) return [];
    const lines = String(text)
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    return lines;
}

const TutorLessonPage = () => {
    const { user } = useContext(AuthContext);
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [pdfFile, setPdfFile] = useState(null);
    const [onlyPdf, setOnlyPdf] = useState(null);

    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState(10);
    const [weekNumber, setWeekNumber] = useState(1);
    const [lessonDate, setLessonDate] = useState('');
    const [description, setDescription] = useState('');
    const [contentText, setContentText] = useState('');
    const [homework, setHomework] = useState('');
    const [status, setStatus] = useState('draft');

    const [quizFormLink, setQuizFormLink] = useState('');
    const [worksheetLink, setWorksheetLink] = useState('');
    const [answerSheetLink, setAnswerSheetLink] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [referenceText, setReferenceText] = useState('');
    const [videoText, setVideoText] = useState('');
    const [hasPdfUrl, setHasPdfUrl] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError('');
            try {
                const data = await fetchSubjectContentById(id);
                if (cancelled) return;
                setTitle(data.title || '');
                setSubject(data.subject || '');
                setGrade(Number(data.grade) || 10);
                setWeekNumber(Number(data.weekNumber) || 1);
                setLessonDate(toDateInput(data.lessonDate));
                setDescription(data.description || '');
                setContentText(data.contentText || '');
                setHomework(data.homework || '');
                setStatus(data.status || 'draft');
                const r = data.resources || {};
                setQuizFormLink(r.quizFormLink || '');
                setWorksheetLink(r.worksheetLink || '');
                setAnswerSheetLink(r.answerSheetLink || '');
                setMeetingLink(r.meetingLink || '');
                setReferenceText((r.referenceLinks || []).join('\n'));
                setVideoText((r.videoLinks || []).join('\n'));
                setHasPdfUrl(Boolean(r.pdfUrl));
            } catch {
                if (!cancelled) setError('Lesson not found or you do not have access.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (id) run();
        return () => {
            cancelled = true;
        };
    }, [id]);

    if (user && user.role !== 'tutor' && user.role !== 'admin') {
        return <Navigate to="/student-dashboard" replace />;
    }

    const buildPayload = () => ({
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
            ...emptyResources,
            quizFormLink,
            worksheetLink,
            answerSheetLink,
            meetingLink,
            referenceLinks: splitLinks(referenceText),
            videoLinks: splitLinks(videoText),
        },
    });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await updateSubjectContent(id, buildPayload(), pdfFile || undefined);
            setPdfFile(null);
            setHasPdfUrl(true);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (Array.isArray(err.response?.data?.errors) &&
                    err.response.data.errors.map((x) => x.msg || x.message).join('; ')) ||
                'Save failed.';
            setError(String(msg));
        } finally {
            setSaving(false);
        }
    };

    const handlePdfOnly = async () => {
        if (!onlyPdf) return;
        setSaving(true);
        setError('');
        try {
            await uploadSubjectPdf(id, onlyPdf);
            setOnlyPdf(null);
            setHasPdfUrl(true);
        } catch (err) {
            const msg = err.response?.data?.message || 'PDF upload failed.';
            setError(String(msg));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this week permanently? This cannot be undone.')) return;
        try {
            await deleteSubjectContent(id);
            navigate('/tutor-dashboard');
        } catch {
            setError('Could not delete.');
        }
    };

    const openPdf = () => {
        window.open(getSubjectPdfWindowUrl(id), '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#eef2f6]">
                <p className="text-slate-500 font-medium animate-pulse">Loading lesson…</p>
            </div>
        );
    }

    if (error && !title) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[#eef2f6]">
                <p className="text-red-700 font-medium">{error}</p>
                <Link to="/tutor-dashboard" className="text-indigo-600 font-bold">
                    Return to dashboard
                </Link>
            </div>
        );
    }

    const backToModule = modulePath(grade, subject);

    return (
        <div className="min-h-screen relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#eef2f6] via-violet-50/40 to-indigo-50/50" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                    <div className="flex-1 min-w-0 space-y-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <Link
                                    to={backToModule}
                                    className="inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-500 mb-2"
                                >
                                    ← {subject} · Grade {grade}
                                </Link>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                    Week {weekNumber}
                                </h1>
                                <p className="text-sm text-slate-600 mt-1">Edit lecture notes, links, and visibility.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl border border-red-100"
                            >
                                Delete week
                            </button>
                        </div>

                        {error ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
                                {error}
                            </div>
                        ) : null}

                        <form
                            onSubmit={handleSave}
                            className="rounded-3xl border border-white/60 bg-white/85 backdrop-blur-lg shadow-xl shadow-indigo-500/5 p-6 sm:p-8 space-y-6"
                        >
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lesson title</label>
                                    <input
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                                    <input
                                        required
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Grade</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={13}
                                        required
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Week number</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={52}
                                        required
                                        value={weekNumber}
                                        onChange={(e) => setWeekNumber(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lesson date</label>
                                    <input
                                        type="date"
                                        required
                                        value={lessonDate}
                                        onChange={(e) => setLessonDate(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Summary</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none resize-y"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Lecture notes (text)
                                </label>
                                <textarea
                                    value={contentText}
                                    onChange={(e) => setContentText(e.target.value)}
                                    rows={8}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none resize-y font-mono text-slate-800"
                                    placeholder="Main teaching points, definitions, examples…"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Homework</label>
                                <textarea
                                    value={homework}
                                    onChange={(e) => setHomework(e.target.value)}
                                    rows={2}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400/50 outline-none resize-y"
                                />
                            </div>

                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h3 className="text-sm font-extrabold text-slate-800">Resources & links</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Attach PDF with main form save
                                        </label>
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                            className="text-xs w-full"
                                        />
                                        {pdfFile ? (
                                            <p className="text-[11px] text-indigo-600 mt-1 font-medium">
                                                New file: {pdfFile.name} (uploads when you save)
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="sm:col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1 text-xs text-slate-600">
                                            {hasPdfUrl ? (
                                                <span className="font-semibold text-emerald-700">PDF attached.</span>
                                            ) : (
                                                <span>No PDF yet.</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {hasPdfUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={openPdf}
                                                    className="text-xs font-bold text-white bg-indigo-600 px-3 py-2 rounded-xl"
                                                >
                                                    Open PDF
                                                </button>
                                            ) : null}
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={(e) => setOnlyPdf(e.target.files?.[0] || null)}
                                                className="text-xs max-w-[200px]"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePdfOnly}
                                                disabled={!onlyPdf || saving}
                                                className="text-xs font-bold bg-slate-800 text-white px-3 py-2 rounded-xl disabled:opacity-50"
                                            >
                                                Upload only PDF
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Quiz form URL
                                        </label>
                                        <input
                                            value={quizFormLink}
                                            onChange={(e) => setQuizFormLink(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                                            placeholder="https://"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Meeting link
                                        </label>
                                        <input
                                            value={meetingLink}
                                            onChange={(e) => setMeetingLink(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                                            placeholder="https://"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Worksheet URL
                                        </label>
                                        <input
                                            value={worksheetLink}
                                            onChange={(e) => setWorksheetLink(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Answer sheet URL
                                        </label>
                                        <input
                                            value={answerSheetLink}
                                            onChange={(e) => setAnswerSheetLink(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Reference links (one per line or comma-separated)
                                        </label>
                                        <textarea
                                            value={referenceText}
                                            onChange={(e) => setReferenceText(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none font-mono text-xs"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Video links
                                        </label>
                                        <textarea
                                            value={videoText}
                                            onChange={(e) => setVideoText(e.target.value)}
                                            rows={2}
                                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-indigo-500/25 disabled:opacity-60"
                                >
                                    {saving ? 'Saving…' : 'Save changes'}
                                </button>
                                <Link
                                    to={backToModule}
                                    className="rounded-xl border border-slate-200 bg-white font-bold px-6 py-3 text-sm text-slate-700"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>

                    <div className="w-full lg:w-[340px] shrink-0 lg:sticky lg:top-24">
                        <ModuleAIAssistant
                            contentId={id}
                            contextLabel={`Week ${weekNumber} · ${title || 'Lesson'}`}
                            subtitle="Answers use this week’s text, summary, and PDF."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorLessonPage;
