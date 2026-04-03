export const LESSON_COMPLETION_EVENT = 'studyconnect:lessonCompletionChanged';

function getStorageKey(userId) {
    return `studyconnect.lessonCompletion.${userId || 'anonymous'}`;
}

function parseStoredIds(value) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return [];
    }
}

export function getCompletedLessonIds(userId) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    return parseStoredIds(window.localStorage.getItem(getStorageKey(userId)));
}

export function isLessonCompleted(lessonId, userId) {
    if (!lessonId) return false;
    const ids = getCompletedLessonIds(userId);
    return ids.includes(String(lessonId));
}

export function setLessonCompleted(lessonId, completed, userId) {
    if (!lessonId || typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    const ids = new Set(getCompletedLessonIds(userId));
    const id = String(lessonId);
    if (completed) {
        ids.add(id);
    } else {
        ids.delete(id);
    }
    const next = Array.from(ids);
    window.localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
    window.dispatchEvent(
        new CustomEvent(LESSON_COMPLETION_EVENT, {
            detail: { userId: String(userId || 'anonymous'), completedIds: next },
        })
    );
    return next;
}

export function subscribeToLessonCompletion(userId, onChange) {
    if (typeof window === 'undefined') return () => {};

    const normalizedUserId = String(userId || 'anonymous');

    const onCustomEvent = (event) => {
        const detail = event?.detail || {};
        if (String(detail.userId || 'anonymous') !== normalizedUserId) return;
        onChange(Array.isArray(detail.completedIds) ? detail.completedIds : getCompletedLessonIds(userId));
    };

    const onStorage = (event) => {
        if (event.key !== getStorageKey(userId)) return;
        onChange(getCompletedLessonIds(userId));
    };

    window.addEventListener(LESSON_COMPLETION_EVENT, onCustomEvent);
    window.addEventListener('storage', onStorage);

    return () => {
        window.removeEventListener(LESSON_COMPLETION_EVENT, onCustomEvent);
        window.removeEventListener('storage', onStorage);
    };
}

export function getModuleCompletion(lessons, userId, completedIds) {
    if (!completedIds) completedIds = getCompletedLessonIds(userId);
    const total = Array.isArray(lessons) ? lessons.length : 0;
    const completedCount = Array.isArray(lessons)
        ? lessons.filter((lesson) => lesson && lesson._id && completedIds.includes(String(lesson._id))).length
        : 0;
    const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { completedCount, total, percent };
}
