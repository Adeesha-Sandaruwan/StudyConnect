import { useEffect, useState } from 'react';
import { askSubjectContentAI } from '../../services/subjectContentApi';

const ModuleAIAssistant = ({ contentId, contextLabel, subtitle }) => {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMessages([]);
        setError('');
        setQuestion('');
    }, [contentId]);

    const send = async (e) => {
        e?.preventDefault?.();
        const q = question.trim();
        if (!q || !contentId) return;

        setError('');
        setMessages((prev) => [...prev, { role: 'user', text: q }]);
        setQuestion('');
        setLoading(true);

        try {
            const { answer } = await askSubjectContentAI(contentId, q);
            setMessages((prev) => [...prev, { role: 'assistant', text: answer || 'No response.' }]);
        } catch (err) {
            const msg =
                err.response?.data?.message ||
                (Array.isArray(err.response?.data?.errors) &&
                    err.response.data.errors.map((x) => x.msg).join(', ')) ||
                'Could not reach the study assistant.';
            setError(String(msg));
            setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong. Try again in a moment.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <aside className="relative flex min-h-[380px] flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 shadow-[0_28px_80px_-30px_rgba(79,70,229,0.45)] backdrop-blur-xl lg:min-h-[420px] lg:max-h-[calc(100vh-8rem)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_34%)]" />
            <div className="relative shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-5 py-4 text-white">
                <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_50%)]" />
                <div className="relative flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg">✨</span>
                            Study assistant
                        </h3>
                        <p className="mt-1 text-[11px] leading-snug text-white/85">{contextLabel}</p>
                        {subtitle ? <p className="mt-0.5 text-[10px] text-white/70">{subtitle}</p> : null}
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                        AI ready
                    </span>
                </div>
            </div>

            <div className="relative flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[160px]">
                {messages.length === 0 && !loading ? (
                    <div className="rounded-2xl border border-dashed border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 shadow-sm">
                        <p className="text-sm font-semibold text-slate-800">Ask for instant help</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            Ask anything about this week&apos;s notes, PDF, and lesson text. Answers use your published
                            content as context.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {['Summarize this lesson', 'Create quiz ideas', 'Explain key concepts'].map((tip) => (
                                <span
                                    key={tip}
                                    className="rounded-full border border-indigo-100 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-indigo-700"
                                >
                                    {tip}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                                m.role === 'user'
                                    ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                                    : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-800 whitespace-pre-wrap'
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading ? (
                    <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 animate-pulse shadow-sm">
                            Thinking…
                        </div>
                    </div>
                ) : null}
                {error ? <p className="px-1 text-[11px] text-red-600">{error}</p> : null}
            </div>

            <form onSubmit={send} className="relative shrink-0 border-t border-slate-100/80 bg-white/95 p-4">
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/80 p-2 shadow-inner">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={contentId ? 'Ask a question…' : 'Select a week first'}
                            disabled={!contentId || loading}
                            className="flex-1 min-w-0 rounded-2xl border-0 bg-transparent px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-60"
                        />
                        <button
                            type="submit"
                            disabled={!contentId || loading || !question.trim()}
                            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-opacity hover:opacity-95 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </form>
        </aside>
    );
};

export default ModuleAIAssistant;
