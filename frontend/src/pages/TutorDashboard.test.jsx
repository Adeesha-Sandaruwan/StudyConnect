import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import TutorDashboard from './TutorDashboard';
import { createSubjectContent, fetchMySubjectContents } from '../services/subjectContentApi';

vi.mock('../services/subjectContentApi', () => ({
    createSubjectContent: vi.fn(),
    fetchMySubjectContents: vi.fn(),
}));

function renderDashboard(initialEntry = '/tutor-dashboard') {
    return render(
        <AuthContext.Provider value={{ user: { name: 'Tutor Jane', role: 'tutor' } }}>
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/tutor-dashboard" element={<TutorDashboard />} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>
    );
}

function getFieldByLabel(labelText) {
    const label = screen.getByText(labelText);
    return label.parentElement.querySelector('input, textarea, select');
}

function buildExpectedIso(dateValue, timeValue) {
    const [year, month, day] = dateValue.split('-').map(Number);
    const [hours, minutes] = timeValue.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

describe('TutorDashboard', () => {
    beforeEach(() => {
        fetchMySubjectContents.mockResolvedValue([]);
        createSubjectContent.mockResolvedValue({ id: 'new-lesson' });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('loads and displays grouped tutor modules', async () => {
        fetchMySubjectContents.mockResolvedValue([
            {
                _id: 'l1',
                title: 'Database Basics',
                subject: 'AL ICT',
                grade: 12,
                weekNumber: 1,
                status: 'published',
            },
            {
                _id: 'l2',
                title: 'Normalization',
                subject: 'AL ICT',
                grade: 12,
                weekNumber: 2,
                status: 'draft',
            },
            {
                _id: 'l3',
                title: 'React Intro',
                subject: 'MERN Stack',
                grade: 0,
                weekNumber: 1,
                status: 'published',
            },
        ]);

        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('AL ICT')).toBeInTheDocument();
        });

        expect(screen.getByText('MERN Stack')).toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: /open module/i })).toHaveLength(2);

        const addWeekLinks = screen.getAllByRole('link', { name: /＋ week/i });
        expect(addWeekLinks[0]).toHaveAttribute(
            'href',
            '/tutor-dashboard?newWeek=1&grade=0&subject=MERN%20Stack'
        );
    });

    it('prefills and submits the create lesson form from query params', async () => {
        const user = userEvent.setup();
        renderDashboard('/tutor-dashboard?newWeek=1&grade=12&subject=AL%20ICT');

        await waitFor(() => {
            expect(screen.getAllByText(/create lesson/i).length).toBeGreaterThan(1);
        });

        expect(getFieldByLabel(/^Subject$/i)).toHaveValue('AL ICT');
        expect(getFieldByLabel(/^Grade$/i)).toHaveValue(12);

        await user.type(screen.getByPlaceholderText(/introduction to databases/i), 'Database Basics');
        await user.type(getFieldByLabel(/^Short description$/i), 'Relational modelling overview');
        await user.type(getFieldByLabel(/^Homework$/i), 'Read chapter 1');

        const dateValue = getFieldByLabel(/^Date$/i).value;
        const timeValue = getFieldByLabel(/^Time$/i).value;
        const createButtons = screen.getAllByRole('button', { name: /^create lesson$/i });
        await user.click(createButtons[createButtons.length - 1]);

        await waitFor(() => {
            expect(createSubjectContent).toHaveBeenCalledTimes(1);
        });

        const [payload, fileArg] = createSubjectContent.mock.calls[0];

        expect(payload).toMatchObject({
            title: 'Database Basics',
            subject: 'AL ICT',
            moduleType: 'school',
            grade: 12,
            weekNumber: 1,
            description: 'Relational modelling overview',
            homework: 'Read chapter 1',
            status: 'draft',
        });
        expect(payload.lessonDate).toBe(buildExpectedIso(dateValue, timeValue));
        expect(fileArg).toBeUndefined();
    });
});
