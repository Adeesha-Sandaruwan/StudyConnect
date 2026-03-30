import api from './api';

const root = '/subject-content';

export async function fetchMySubjectContents() {
    const { data } = await api.get(`${root}/my`);
    return data;
}

export async function fetchSubjectContentById(id) {
    const { data } = await api.get(`${root}/${id}`);
    return data;
}

export async function createSubjectContent(payload, pdfFile) {
    const fd = buildSubjectContentFormData(payload, pdfFile);
    const { data } = await api.post(root, fd);
    return data;
}

export async function updateSubjectContent(id, payload, pdfFile) {
    const fd = buildSubjectContentFormData(payload, pdfFile);
    const { data } = await api.put(`${root}/${id}`, fd);
    return data;
}

export async function deleteSubjectContent(id) {
    const { data } = await api.delete(`${root}/${id}`);
    return data;
}

export async function uploadSubjectPdf(id, pdfFile) {
    const fd = new FormData();
    fd.append('pdf', pdfFile);
    const { data } = await api.post(`${root}/${id}/upload-pdf`, fd);
    return data;
}

export async function askSubjectContentAI(contentId, question) {
    const { data } = await api.post(`${root}/${contentId}/ask`, { question });
    return data;
}

function buildSubjectContentFormData(payload, pdfFile) {
    const fd = new FormData();
    const p = { ...payload };

    const resources = p.resources && typeof p.resources === 'object' ? p.resources : {};

    fd.append('title', p.title ?? '');
    fd.append('subject', p.subject ?? '');
    fd.append('grade', String(p.grade ?? ''));
    fd.append('weekNumber', String(p.weekNumber ?? ''));
    fd.append('lessonDate', p.lessonDate ?? '');

    if (p.description != null) fd.append('description', p.description);
    if (p.contentText != null) fd.append('contentText', p.contentText);
    if (p.homework != null) fd.append('homework', p.homework);
    if (p.status != null) fd.append('status', p.status);

    fd.append('resources', JSON.stringify(resources));

    if (pdfFile) fd.append('pdf', pdfFile);

    return fd;
}

export function getSubjectPdfWindowUrl(contentId) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const trimmed = base.replace(/\/$/, '');
    return `${trimmed}${root}/${contentId}/pdf`;
}
