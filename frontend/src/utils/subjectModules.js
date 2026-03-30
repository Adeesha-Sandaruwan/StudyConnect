export function groupContentsByModule(contents) {
    const map = new Map();

    for (const item of contents || []) {
        const key = `${String(item.subject).trim().toLowerCase()}__${Number(item.grade)}`;
        if (!map.has(key)) {
            map.set(key, {
                subject: item.subject,
                grade: Number(item.grade),
                lessons: [],
            });
        }
        map.get(key).lessons.push(item);
    }

    return Array.from(map.values())
        .map((m) => ({
            ...m,
            lessons: [...m.lessons].sort((a, b) => a.weekNumber - b.weekNumber),
        }))
        .sort((a, b) => a.grade - b.grade || a.subject.localeCompare(b.subject));
}

export function modulePath(grade, subject) {
    return `/tutor-dashboard/module/${grade}/${encodeURIComponent(subject.trim())}`;
}
