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
        <aside className="flex flex-col rounded-3xl border border-white/40 bg-white/80 shadow-[0_24px_70px_-28px_rgba(79,70,229,0.45)] backdrop-blur-md overflow-hidden min-h-[380px] lg:min-h-[420px] lg:max-h-[calc(100vh-8rem)]">
            <div className="relative px-5 py-4 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 text-white shrink-0">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,white_0%,transparent_50%)] pointer-events-none" />
                <h3 className="relative text-sm font-bold tracking-tight flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg">✨</span>
                    Study assistant
                </h3>
                <p className="relative text-[11px] text-white/85 mt-1 leading-snug">{contextLabel}</p>
                {subtitle ? <p className="relative text-[10px] text-white/70 mt-0.5">{subtitle}</p> : null}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[160px]">
                {messages.length === 0 && !loading ? (
                    <p className="text-sm text-slate-500 leading-relaxed px-1">
                        Ask anything about this week&apos;s notes, PDF, and lesson text. Answers use your published content as
                        context.
                    </p>
                ) : null}
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[92%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                                m.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-md border border-slate-200/80 whitespace-pre-wrap'
                            }`}
                        >
                            {m.text}
                        </div>
                    </div>
                ))}
                {loading ? (
                    <div className="flex justify-start">
                        <div className="rounded-2xl rounded-bl-md bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-500 animate-pulse">
                            Thinking…
                        </div>
                    </div>
                ) : null}
                {error ? <p className="text-[11px] text-red-600 px-1">{error}</p> : null}
            </div>

            <form onSubmit={send} className="p-4 border-t border-slate-100/80 bg-white/90 shrink-0">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder={contentId ? 'Ask a question…' : 'Select a week first'}
                        disabled={!contentId || loading}
                        className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/60 disabled:opacity-60"
                    />
                    <button
                        type="submit"
                        disabled={!contentId || loading || !question.trim()}
                        className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white px-4 py-3 text-sm font-bold shadow-md shadow-indigo-500/25 disabled:opacity-50 hover:opacity-95 transition-opacity"
                    >
                        Send
                    </button>
                </div>
            </form>
        </aside>
    );
};

export default ModuleAIAssistant;
