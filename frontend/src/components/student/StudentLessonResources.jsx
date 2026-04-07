export default function StudentLessonResources({ lesson }) {
    const r = lesson.resources || {};
    const refs = Array.isArray(r.referenceLinks) ? r.referenceLinks.filter(Boolean) : [];
    const videos = Array.isArray(r.videoLinks) ? r.videoLinks.filter(Boolean) : [];
    const extras = [
        ['Quiz', r.quizFormLink],
        ['Worksheet', r.worksheetLink],
        ['Answers', r.answerSheetLink],
        ['Class meeting', r.meetingLink],
    ].filter(([, url]) => url && String(url).trim());

    if (!refs.length && !videos.length && !extras.length) return null;

    const cardClass =
        'rounded-[1.15rem] border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/60 p-4 text-sm text-slate-700 shadow-sm';

    return (
        <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
                {extras.length ? (
                    <div className={cardClass}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700/80">Quick links</p>
                        <ul className="mt-3 space-y-2 text-xs">
                            {extras.map(([label, url]) => (
                                <li key={label}>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 font-bold text-cyan-700 transition hover:bg-cyan-100"
                                    >
                                        <span>{label}</span>
                                        <span aria-hidden="true">↗</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}

                {refs.length ? (
                    <div className={cardClass}>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-fuchsia-700/80">Reference links</p>
                        <ul className="mt-3 space-y-2 text-xs">
                            {refs.map((url, i) => (
                                <li key={`ref-${i}`}>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded-xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-fuchsia-700 break-all transition hover:bg-fuchsia-100"
                                    >
                                        Reference {i + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </div>

            {videos.length ? (
                <div className={cardClass}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700/80">Video resources</p>
                    <ul className="mt-3 space-y-2 text-xs">
                        {videos.map((url, i) => (
                            <li key={`vid-${i}`}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 break-all transition hover:bg-emerald-100"
                                >
                                    Video {i + 1}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
