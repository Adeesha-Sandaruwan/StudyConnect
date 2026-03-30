/**
 * Normalized PDF rows for tutor forms (url required for persisted files).
 */
export function lessonPdfsFromLesson(data) {
    const r = data?.resources || {};
    let files = Array.isArray(r.pdfFiles)
        ? r.pdfFiles.map((f) => ({
              url: f.url || '',
              publicId: f.publicId || '',
              name: f.name || '',
          }))
        : [];
    if (!files.length && r.pdfUrl) {
        files = [{ url: r.pdfUrl, publicId: r.pdfPublicId || '', name: 'PDF notes' }];
    }
    return files.filter((f) => f.url);
}

/** Labels + indices for opening /api/subject-content/:id/pdf/:index */
export function getLessonPdfDisplayList(lesson) {
    const files = lessonPdfsFromLesson(lesson);
    return files.map((f, i) => ({
        index: i,
        label: (f.name && String(f.name).trim()) || `PDF ${i + 1}`,
    }));
}
