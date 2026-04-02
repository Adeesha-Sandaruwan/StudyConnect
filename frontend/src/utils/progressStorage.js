const STORAGE_KEY = 'studyconnect.lessonCompletion';

function parseStoredIds(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

export function getCompletedLessonIds() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    return parseStoredIds(window.localStorage.getItem(STORAGE_KEY));
}

export function isLessonCompleted(lessonId) {
    if (!lessonId) return false;
    const ids = getCompletedLessonIds();
    return ids.includes(String(lessonId));
}

export function setLessonCompleted(lessonId, completed) {
    if (!lessonId || typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    const ids = new Set(getCompletedLessonIds());
    const id = String(lessonId);
    if (completed) {
        ids.add(id);
    } else {
        ids.delete(id);
    }
    const next = Array.from(ids);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function getModuleCompletion(lessons, completedIds = getCompletedLessonIds()) {
    const total = Array.isArray(lessons) ? lessons.length : 0;
    const completedCount = Array.isArray(lessons)
        ? lessons.filter((lesson) => lesson && lesson._id && completedIds.includes(String(lesson._id))).length
        : 0;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { completedCount, total, percent };
}
