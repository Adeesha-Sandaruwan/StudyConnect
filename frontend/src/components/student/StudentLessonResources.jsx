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

    return (
        <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold uppercase text-slate-400">Links</p>
            <ul className="space-y-1.5 text-xs">
                {extras.map(([label, url]) => (
                    <li key={label}>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-indigo-600 hover:underline"
                        >
                            {label}
                        </a>
                    </li>
                ))}
                {refs.map((url, i) => (
                    <li key={`ref-${i}`}>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline break-all"
                        >
                            Reference {i + 1}
                        </a>
                    </li>
                ))}
                {videos.map((url, i) => (
                    <li key={`vid-${i}`}>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline break-all"
                        >
                            Video {i + 1}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
