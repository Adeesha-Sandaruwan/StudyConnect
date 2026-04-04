import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleAIAssistant from './ModuleAIAssistant';
import { askSubjectContentAI } from '../../services/subjectContentApi';

vi.mock('../../services/subjectContentApi', () => ({
    askSubjectContentAI: vi.fn(),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('ModuleAIAssistant', () => {
    it('shows the default helper text and disables input until a lesson is selected', () => {
        render(<ModuleAIAssistant contentId="" contextLabel="Week 1" subtitle="Tutor module" />);

        expect(screen.getByText(/ask anything about this week's notes/i)).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeDisabled();
        expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
        expect(screen.getByPlaceholderText(/select a week first/i)).toBeInTheDocument();
    });

    it('submits a question and renders the assistant reply', async () => {
        askSubjectContentAI.mockResolvedValue({ answer: 'Start by defining the loop condition clearly.' });

        const user = userEvent.setup();
        render(<ModuleAIAssistant contentId="lesson-101" contextLabel="Week 1" subtitle="Tutor module" />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'How do I explain loops?');
        await user.click(screen.getByRole('button', { name: /send/i }));

        expect(askSubjectContentAI).toHaveBeenCalledWith('lesson-101', 'How do I explain loops?');
        expect(screen.getByText('How do I explain loops?')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Start by defining the loop condition clearly.')).toBeInTheDocument();
        });

        expect(input).toHaveValue('');
    });

    it('shows a friendly fallback message when the assistant request fails', async () => {
        askSubjectContentAI.mockRejectedValue({
            response: {
                data: {
                    message: 'Tutor AI is temporarily unavailable.',
                },
            },
        });

        const user = userEvent.setup();
        render(<ModuleAIAssistant contentId="lesson-202" contextLabel="Week 2" subtitle="Tutor module" />);

        await user.type(screen.getByRole('textbox'), 'Summarize recursion');
        await user.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(screen.getByText('Something went wrong. Try again in a moment.')).toBeInTheDocument();
        });

        expect(screen.getByText('Tutor AI is temporarily unavailable.')).toBeInTheDocument();
    });

    it('clears old messages when the selected lesson changes', async () => {
        askSubjectContentAI.mockResolvedValue({ answer: 'Use one simple example first.' });

        const user = userEvent.setup();
        const { rerender } = render(
            <ModuleAIAssistant contentId="lesson-303" contextLabel="Week 3" subtitle="Tutor module" />
        );

        await user.type(screen.getByRole('textbox'), 'Give me a teaching tip');
        await user.click(screen.getByRole('button', { name: /send/i }));

        await waitFor(() => {
            expect(screen.getByText('Use one simple example first.')).toBeInTheDocument();
        });

        rerender(<ModuleAIAssistant contentId="lesson-304" contextLabel="Week 4" subtitle="Tutor module" />);

        await waitFor(() => {
            expect(screen.queryByText('Give me a teaching tip')).not.toBeInTheDocument();
        });

        expect(screen.getByRole('textbox')).toHaveValue('');
        expect(screen.getByText(/ask anything about this week's notes/i)).toBeInTheDocument();
    });
});
