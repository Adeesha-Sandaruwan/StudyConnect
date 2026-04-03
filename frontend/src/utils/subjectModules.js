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

export function formatLessonDateTime(dateString, includeTime = false) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = false;
    }
    return d.toLocaleString(undefined, options);
}

function tutorIdOf(lesson) {
    const c = lesson?.createdBy;
    if (!c) return '';
    return String(c._id ?? c);
}

/** Group published lessons: one card per tutor + subject + grade */
export function groupPublishedByTutorModule(contents) {
    const map = new Map();

    for (const item of contents || []) {
        const tid = tutorIdOf(item);
        if (!tid) continue;

        const key = `${tid}__${String(item.subject).trim().toLowerCase()}__${Number(item.grade)}`;
        if (!map.has(key)) {
            const c = item.createdBy;
            map.set(key, {
                tutorId: tid,
                tutorName: typeof c === 'object' && c?.name ? c.name : 'Tutor',
                tutorAvatar: typeof c === 'object' && c?.avatar ? c.avatar : '',
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
            lessons: [...m.lessons].sort((a, b) => a.weekNumber - b.weekNumber || new Date(a.lessonDate) - new Date(b.lessonDate)),
        }))
        .sort(
            (a, b) =>
                a.tutorName.localeCompare(b.tutorName) ||
                a.grade - b.grade ||
                a.subject.localeCompare(b.subject)
        );
}

export function getNearestLesson(lessons) {
    if (!Array.isArray(lessons) || lessons.length === 0) return null;

    const now = Date.now();
    const withUtc = lessons
        .map((lesson) => ({
            lesson,
            time: lesson?.lessonDate ? new Date(lesson.lessonDate).getTime() : NaN,
        }))
        .filter((item) => !Number.isNaN(item.time));

    if (withUtc.length === 0) return null;

    const upcoming = withUtc.filter((item) => item.time >= now);
    if (upcoming.length > 0) {
        upcoming.sort((a, b) => a.time - b.time);
        return upcoming[0].lesson;
    }

    // if no future class, use the most recent past class
    withUtc.sort((a, b) => b.time - a.time);
    return withUtc[0].lesson;
}

export function studentModulePath(tutorId, grade, subject) {
    const id = encodeURIComponent(String(tutorId).trim());
    const g = Number(grade);
    return `/student-dashboard/module/${id}/${g}/${encodeURIComponent(String(subject).trim())}`;
}
