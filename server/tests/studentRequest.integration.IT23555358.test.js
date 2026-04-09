import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockCountDocuments = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
const mockNotificationCreate = jest.fn();

jest.unstable_mockModule('../models/StudentRequest.js', () => ({
    default: {
        create: mockCreate,
        find: mockFind,
        findById: mockFindById,
        countDocuments: mockCountDocuments,
        findByIdAndDelete: mockFindByIdAndDelete,
    },
}));

jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findById: mockUserFindById,
        find: mockUserFind,
    },
}));

jest.unstable_mockModule('../models/SubjectContent.js', () => ({
    default: {
        findById: jest.fn(),
    },
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
    default: {
        create: mockNotificationCreate,
    },
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
    sendRequestCreationEmail: jest.fn(),
    sendAdminNotificationEmail: jest.fn(),
    sendTutorAssignmentEmail: jest.fn(),
    sendTutorRequestEmail: jest.fn(),
    sendStatusUpdateEmail: jest.fn(),
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    protect: (req, res, next) => {
        req.user = {
            _id: req.headers['x-user-id'] || 'student-1',
            role: req.headers['x-user-role'] || 'student',
            name: req.headers['x-user-name'] || 'Student Tester',
            email: req.headers['x-user-email'] || 'student@test.com',
        };
        next();
    },
}));

jest.unstable_mockModule('../middleware/adminMiddleware.js', () => ({
    admin: (req, res, next) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        next();
    },
}));

jest.unstable_mockModule('../middleware/ownerMiddleware.js', () => ({
    checkStudentOwner: (req, res, next) => next(),
}));

jest.unstable_mockModule('../middleware/tutorMiddleware.js', () => ({
    tutor: (req, res, next) => {
        if (req.user.role !== 'tutor') {
            return res.status(403).json({ message: 'Tutor only' });
        }
        next();
    },
    adminOrTutor: (req, res, next) => {
        if (!['admin', 'tutor'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    },
}));

jest.unstable_mockModule('../middleware/uploadMiddleware.js', () => ({
    default: {
        single: () => (req, res, next) => next(),
    },
}));

const { default: studentRequestRoutes } = await import('../routes/studentRequestRoutes.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/student-requests', studentRequestRoutes);

function buildQueryChain(items) {
    const chain = {
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(items),
    };
    return chain;
}

describe('Student request integration tests - IT23555358', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a student request through the API', async () => {
        mockUserFindById.mockResolvedValue({
            _id: 'student-1',
            role: 'student',
            name: 'Student Tester',
            email: 'student@test.com',
        });
        mockUserFind.mockResolvedValue([]);

        mockCreate.mockResolvedValue({
            _id: 'request-1',
            populate: jest.fn().mockResolvedValue({
                _id: 'request-1',
                subject: 'ICT',
                status: 'open',
            }),
        });

        const response = await request(app)
            .post('/api/student-requests')
            .set('x-user-role', 'student')
            .set('x-user-id', 'student-1')
            .send({
                subject: 'ICT',
                description: 'Need help with JavaScript loops and APIs',
                gradeLevel: 'Grade 11',
                requestType: 'ongoing',
                preferredSchedule: ['Sunday morning'],
                priority: 'medium',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(mockCreate).toHaveBeenCalled();
    });

    it('rejects invalid request payloads via validation middleware', async () => {
        const response = await request(app)
            .post('/api/student-requests')
            .set('x-user-role', 'student')
            .send({
                subject: 'InvalidSubject',
                description: 'Bad payload',
                gradeLevel: 'Grade 11',
            });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
    });

    it('returns the current student request list from /my-requests', async () => {
        mockFind.mockReturnValue(
            buildQueryChain([
                {
                    _id: 'request-1',
                    subject: 'ICT',
                    status: 'open',
                },
            ])
        );
        mockCountDocuments.mockResolvedValue(1);

        const response = await request(app)
            .get('/api/student-requests/my-requests?page=1&limit=10')
            .set('x-user-role', 'student')
            .set('x-user-id', 'student-1');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.requests).toHaveLength(1);
    });

    it('allows the assigned tutor to share a direct note resource', async () => {
        const storedRequest = {
            _id: 'request-1',
            student: 'student-1',
            subject: 'ICT',
            assignedTutor: 'tutor-1',
            linkedLessons: [],
            sharedResources: [],
            save: jest.fn().mockResolvedValue(true),
            populate: jest.fn().mockImplementation(async function () {
                return this;
            }),
        };

        mockFindById.mockResolvedValue(storedRequest);

        const response = await request(app)
            .post('/api/student-requests/request-1/resources/custom')
            .set('x-user-role', 'tutor')
            .set('x-user-id', 'tutor-1')
            .set('x-user-name', 'Tutor Tester')
            .send({
                title: 'Study before session',
                message: 'Read the ICT handbook before the class.',
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(storedRequest.sharedResources).toHaveLength(1);
        expect(mockNotificationCreate).toHaveBeenCalled();
    });
});