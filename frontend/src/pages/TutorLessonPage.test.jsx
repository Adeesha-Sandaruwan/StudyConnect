import '@testing-library/jest-dom/vitest';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TutorLessonPage from './TutorLessonPage';
import {
    askSubjectContentAI,
    deleteSubjectContent,
    fetchSubjectContentById,
    getSubjectPdfWindowUrl,
    updateSubjectContent,
    uploadSubjectPdf,
} from '../services/subjectContentApi';

vi.mock('../services/subjectContentApi', () => ({
    askSubjectContentAI: vi.fn(),
    deleteSubjectContent: vi.fn(),
    fetchSubjectContentById: vi.fn(),
    getSubjectPdfWindowUrl: vi.fn(() => 'https://cdn.example.com/open.pdf'),
    updateSubjectContent: vi.fn(),
    uploadSubjectPdf: vi.fn(),
}));

const sampleLesson = {
    _id: 'lesson-1',
    title: 'Intro to Loops',
    subject: 'Programming',
    moduleType: 'school',
    grade: 11,
    weekNumber: 3,
    lessonDate: new Date(2026, 3, 4, 9, 30, 0, 0).toISOString(),
    description: 'Control-flow basics',
    contentText: 'Loops repeat instructions until a condition changes.',
    homework: 'Read chapter 2',
    status: 'published',
    resources: {
        quizFormLink: 'https://quiz.example.com',
        worksheetLink: 'https://worksheet.example.com',
        answerSheetLink: 'https://answers.example.com',
        meetingLink: 'https://meet.example.com',
        referenceLinks: ['https://ref1.example.com'],
        videoLinks: ['https://video1.example.com'],
        pdfFiles: [
            {
                url: 'https://cdn.example.com/week3.pdf',
                publicId: 'week3-file',
                name: 'Week 3 handout',
            },
        ],
    },
};

function renderLessonPage(initialEntry = '/lesson/lesson-1') {
    return render(
        <AuthContext.Provider value={{ user: { name: 'Tutor Jane', role: 'tutor' } }}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/lesson/:id" element={<TutorLessonPage />} />
                    <Route path="/tutor-dashboard" element={<div>Dashboard target</div>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

describe('TutorLessonPage', () => {
    beforeEach(() => {
        fetchSubjectContentById.mockResolvedValue(sampleLesson);
        updateSubjectContent.mockResolvedValue(sampleLesson);
        uploadSubjectPdf.mockResolvedValue({ content: sampleLesson });
        deleteSubjectContent.mockResolvedValue({ ok: true });
        askSubjectContentAI.mockResolvedValue({ answer: 'Example answer' });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('loads the selected lesson data into the edit form', async () => {
        renderLessonPage();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Intro to Loops')).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('Programming')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Control-flow basics')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Read chapter 2')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://quiz.example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Week 3 handout')).toBeInTheDocument();
        expect(screen.getByText(/pdf notes \(1\)/i)).toBeInTheDocument();
    });

    it('saves edited lesson details and redirects back to the dashboard', async () => {
        const user = userEvent.setup();
        let redirectCallback = null;
        const realSetTimeout = window.setTimeout.bind(window);
        const setTimeoutSpy = vi.spyOn(window, 'setTimeout').mockImplementation((fn, delay = 0, ...args) => {
            if (delay === 1300 && typeof fn === 'function') {
                redirectCallback = () => fn(...args);
                return 0;
            }
            return realSetTimeout(fn, delay, ...args);
        });

        renderLessonPage();

        const titleInput = await screen.findByDisplayValue('Intro to Loops');
        const refInput = screen.getByDisplayValue('https://ref1.example.com');
        const pdfLabelInput = screen.getByDisplayValue('Week 3 handout');

        await user.clear(titleInput);
        await user.type(titleInput, 'Advanced Loops');
        await user.clear(refInput);
        await user.type(refInput, 'https://ref1.example.com, https://ref2.example.com');
        await user.clear(pdfLabelInput);
        await user.type(pdfLabelInput, 'Updated Week 3 handout');
        await user.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => {
            expect(updateSubjectContent).toHaveBeenCalledTimes(1);
        });

        const [idArg, payloadArg, fileArg] = updateSubjectContent.mock.calls[0];
        expect(idArg).toBe('lesson-1');
        expect(payloadArg).toMatchObject({
            title: 'Advanced Loops',
            subject: 'Programming',
            moduleType: 'school',
            grade: 11,
            weekNumber: 3,
            status: 'published',
        });
        expect(payloadArg.resources.referenceLinks).toEqual([
            'https://ref1.example.com',
            'https://ref2.example.com',
        ]);
        expect(payloadArg.resources.pdfFiles[0]).toMatchObject({
            name: 'Updated Week 3 handout',
            url: 'https://cdn.example.com/week3.pdf',
        });
        expect(fileArg).toBeUndefined();
        expect(screen.getByText(/changes saved/i)).toBeInTheDocument();
        expect(setTimeoutSpy).toHaveBeenCalled();

        await act(async () => {
            redirectCallback?.();
        });

        expect(await screen.findByText('Dashboard target')).toBeInTheDocument();
    });

    it('deletes the lesson after confirmation', async () => {
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
        renderLessonPage();

        await screen.findByDisplayValue('Intro to Loops');
        await userEvent.click(screen.getByRole('button', { name: /delete week/i }));

        await waitFor(() => {
            expect(deleteSubjectContent).toHaveBeenCalledWith('lesson-1');
        });

        expect(await screen.findByText('Dashboard target')).toBeInTheDocument();
        confirmSpy.mockRestore();
    });
});
