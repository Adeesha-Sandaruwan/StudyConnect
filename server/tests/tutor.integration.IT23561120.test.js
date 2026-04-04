import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockDeleteOne = jest.fn();

const tutorUser = {
    _id: '507f191e810c19729de860ea',
    role: 'tutor',
    name: 'Tutor IT23561120',
};

jest.unstable_mockModule('../models/SubjectContent.js', () => ({
    default: {
        create: mockCreate,
        find: mockFind,
        findById: mockFindById,
        deleteOne: mockDeleteOne,
    },
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    protect: (req, res, next) => {
        req.user = { ...tutorUser };
        next();
    },
}));

jest.unstable_mockModule('../middleware/roleMiddleware.js', () => ({
    allowRoles:
        (...roles) =>
        (req, res, next) => {
            if (roles.includes(req.user.role)) {
                return next();
            }
            return res.status(403).json({ message: 'Forbidden' });
        },
}));

jest.unstable_mockModule('../middleware/uploadMiddleware.js', () => ({
    default: {
        single: () => (req, res, next) => next(),
    },
}));

const { default: subjectContentRoutes } = await import('../routes/subjectContentRoutes.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/subject-content', subjectContentRoutes);

function createStoredLesson(overrides = {}) {
    const lesson = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Tutor Week 1',
        subject: 'ICT',
        moduleType: 'school',
        grade: 11,
        weekNumber: 1,
        lessonDate: '2026-04-04T09:00:00.000Z',
        description: 'Tutor integration test lesson',
        contentText: 'Binary and logic gates',
        homework: 'Complete worksheet 1',
        status: 'draft',
        createdBy: tutorUser._id,
        resources: {
            pdfUrl: '',
            pdfPublicId: '',
            pdfFiles: [],
            referenceLinks: [],
            videoLinks: [],
            quizFormLink: '',
            worksheetLink: '',
            answerSheetLink: '',
            meetingLink: '',
            toObject() {
                return {
                    pdfUrl: this.pdfUrl,
                    pdfPublicId: this.pdfPublicId,
                    pdfFiles: [...this.pdfFiles],
                    referenceLinks: [...this.referenceLinks],
                    videoLinks: [...this.videoLinks],
                    quizFormLink: this.quizFormLink,
                    worksheetLink: this.worksheetLink,
                    answerSheetLink: this.answerSheetLink,
                    meetingLink: this.meetingLink,
                };
            },
        },
        async save() {
            return this;
        },
        ...overrides,
    };

    if (overrides.resources) {
        lesson.resources = {
            ...lesson.resources,
            ...overrides.resources,
            toObject: lesson.resources.toObject,
        };
    }

    return lesson;
}

describe('Tutor subject content integration tests - IT23561120', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates tutor lesson content successfully', async () => {
        const createdLesson = createStoredLesson();
        mockCreate.mockResolvedValue(createdLesson);

        const response = await request(app).post('/api/subject-content').send({
            title: 'Tutor Week 1',
            subject: 'ICT',
            moduleType: 'school',
            grade: 11,
            weekNumber: 1,
            lessonDate: '2026-04-04T09:00:00.000Z',
            description: 'Tutor integration test lesson',
            contentText: 'Binary and logic gates',
            homework: 'Complete worksheet 1',
            status: 'draft',
            resources: {
                referenceLinks: ['https://example.com/ict-note'],
                videoLinks: [],
            },
        });

        expect(response.status).toBe(201);
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Tutor Week 1',
                subject: 'ICT',
                createdBy: tutorUser._id,
            })
        );
        expect(response.body.title).toBe('Tutor Week 1');
    });

    it('returns the tutor lesson list from /my', async () => {
        const lessons = [
            createStoredLesson(),
            createStoredLesson({ _id: '507f1f77bcf86cd799439012', weekNumber: 2, title: 'Tutor Week 2' }),
        ];
        mockFind.mockReturnValue({
            sort: jest.fn().mockResolvedValue(lessons),
        });

        const response = await request(app).get('/api/subject-content/my');

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(2);
        expect(response.body[1].title).toBe('Tutor Week 2');
    });

    it('rejects invalid tutor filter requests with a 400 error', async () => {
        const response = await request(app).get('/api/subject-content').query({ grade: 'invalid-grade' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('grade must be a number');
    });

    it('updates the tutor lesson and resource links', async () => {
        const storedLesson = createStoredLesson();
        storedLesson.save = jest.fn().mockResolvedValue(storedLesson);
        mockFindById.mockResolvedValue(storedLesson);

        const response = await request(app).put(`/api/subject-content/${storedLesson._id}`).send({
            title: 'Updated Tutor Week 1',
            description: 'Updated lesson details',
            resources: {
                referenceLinks: ['https://example.com/updated-note'],
                meetingLink: 'https://meet.example.com/tutor-lesson',
            },
        });

        expect(response.status).toBe(200);
        expect(storedLesson.title).toBe('Updated Tutor Week 1');
        expect(storedLesson.resources.referenceLinks).toEqual(['https://example.com/updated-note']);
        expect(storedLesson.resources.meetingLink).toBe('https://meet.example.com/tutor-lesson');
        expect(storedLesson.save).toHaveBeenCalled();
    });

    it('blocks delete requests for lessons owned by another tutor', async () => {
        const foreignLesson = createStoredLesson({ createdBy: '507f191e810c19729de860ff' });
        mockFindById.mockResolvedValue(foreignLesson);

        const response = await request(app).delete(`/api/subject-content/${foreignLesson._id}`);

        expect(response.status).toBe(403);
        expect(response.body.message).toBe('Forbidden');
        expect(mockDeleteOne).not.toHaveBeenCalled();
    });
});
