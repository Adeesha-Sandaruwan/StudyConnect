import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server'; // In-memory MongoDB for isolated tests
import { beforeAll, afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

import User from '../models/User.js';
import StudentRequest from '../models/StudentRequest.js';
import Notification from '../models/Notification.js';
import SubjectContent from '../models/SubjectContent.js';

// Mock auth middleware to allow test header-based authentication
jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
    protect: (req, res, next) => {
        // Extract user from test headers instead of JWT tokens
        const userId = req.headers['x-user-id'];
        const role = req.headers['x-user-role'];

        if (!userId || !role) {
            return res.status(401).json({ message: 'Missing test auth headers' });
        }

        // Create req.user object from headers (simulates JWT verification)
        req.user = {
            _id: userId,
            role,
            name: req.headers['x-user-name'] || 'Test User',
            email: req.headers['x-user-email'] || 'test@example.com',
        };

        next();
    },
}));

jest.unstable_mockModule('../middleware/adminMiddleware.js', () => ({
    admin: (req, res, next) => {
        // Guard: Only admin role can proceed
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized as admin' });
        }
        next();
    },
}));

jest.unstable_mockModule('../middleware/tutorMiddleware.js', () => ({
    tutor: (req, res, next) => {
        // Guard: Only tutor role can proceed
        if (req.user?.role !== 'tutor') {
            return res.status(403).json({ message: 'Tutor only' });
        }
        next();
    },
    adminOrTutor: (req, res, next) => {
        // Guard: Only admin or tutor roles can proceed
        if (!['admin', 'tutor'].includes(req.user?.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    },
}));

jest.unstable_mockModule('../middleware/ownerMiddleware.js', () => ({
    checkStudentOwner: (req, res, next) => next(), // Skip validation for tests
}));

jest.unstable_mockModule('../middleware/uploadMiddleware.js', () => ({
    default: {
        single: () => (req, res, next) => next(), // Mock file upload
    },
}));

// Mock email service to prevent actual emails in tests
jest.unstable_mockModule('../services/emailService.js', () => ({
    sendRequestCreationEmail: jest.fn(),
    sendAdminNotificationEmail: jest.fn(),
    sendTutorAssignmentEmail: jest.fn(),
    sendTutorRequestEmail: jest.fn(),
    sendStatusUpdateEmail: jest.fn(),
}));

// Express app with mounted studentRequest routes for actual integration testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/student-requests', studentRequestRoutes);

let mongoServer;

// Helper: Create test users (student, tutor, admin) in the test database
const createUsers = async () => {
    const student = await User.create({
        name: 'Student DB Tester',
        email: 'student-db@test.com',
        password: 'Password123!',
        role: 'student',
    });

    const tutor = await User.create({
        name: 'Tutor DB Tester',
        email: 'tutor-db@test.com',
        password: 'Password123!',
        role: 'tutor',
    });

    const admin = await User.create({
        name: 'Admin DB Tester',
        email: 'admin-db@test.com',
        password: 'Password123!',
        role: 'admin',
    });

    return { student, tutor, admin };
};

// Integration test suite with real MongoDB (in-memory) and actual request flow
describe('Student request DB-backed integration tests - IT23555358', () => {
    // Setup: Start in-memory MongoDB, connect, and clear collections
    beforeAll(async () => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri(), {
            dbName: 'student-request-it23555358', // Isolated test database
        });
    });

    // Teardown: Clean up database and disconnect
    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Before each test: Clear all collections to ensure test isolation
    beforeEach(async () => {
        await Promise.all([
            StudentRequest.deleteMany({}),
            Notification.deleteMany({}),
            SubjectContent.deleteMany({}),
            User.deleteMany({}),
        ]);
    });

    it('creates a request and persists it in MongoDB', async () => {
        // Test: Student POST /api/student-requests creates request in real DB
        // Validates: Request is stored with correct defaults and timestamps
        const { student } = await createUsers();

        const res = await request(app)
            .post('/api/student-requests')
            .set('x-user-id', student._id.toString())
            .set('x-user-role', 'student')
            .set('x-user-name', student.name)
            .set('x-user-email', student.email)
            .send({
                subject: 'ICT',
                description: 'Need help with JavaScript async/await and APIs',
                gradeLevel: 'Grade 11',
                requestType: 'ongoing',
                preferredSchedule: ['Saturday 10 AM'],
                priority: 'medium',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        // Verify: Request persisted to MongoDB with correct values
        const saved = await StudentRequest.findOne({ student: student._id });
        expect(saved).toBeTruthy();
        expect(saved.subject).toBe('ICT');
        expect(saved.status).toBe('open'); // Default status is 'open'
    });

    it('assigns a tutor via admin endpoint and updates assignment state', async () => {
        // Test: Admin PUT /api/student-requests/:id/assign-tutor assigns tutor
        // Validates: Request status changes from 'open' to 'in-progress', tutor is assigned
        const { student, tutor, admin } = await createUsers();

        // Create a request in open status
        const reqDoc = await StudentRequest.create({
            student: student._id,
            subject: 'ICT',
            description: 'Need assignment support',
            gradeLevel: 'Grade 11',
            priority: 'high',
            status: 'open',
        });

        // Admin assigns tutor
        const res = await request(app)
            .put(`/api/student-requests/${reqDoc._id}/assign-tutor`)
            .set('x-user-id', admin._id.toString())
            .set('x-user-role', 'admin')
            .send({ tutorId: tutor._id.toString() });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        // Verify: Database updated with tutor assignment and status change
        const updated = await StudentRequest.findById(reqDoc._id);
        expect(updated.assignedTutor.toString()).toBe(tutor._id.toString());
        expect(updated.status).toBe('in-progress'); // Status auto-updates
    });

    it('allows assigned tutor to share a direct resource and stores it', async () => {
        // Test: Tutor POST /api/student-requests/:id/resources/custom shares note
        // Validates: Note stored in sharedResources array, notification created
        const { student, tutor } = await createUsers();

        // Create an in-progress request assigned to tutor
        const reqDoc = await StudentRequest.create({
            student: student._id,
            subject: 'ICT',
            description: 'Need assignment support',
            gradeLevel: 'Grade 11',
            priority: 'medium',
            status: 'in-progress',
            assignedTutor: tutor._id,
        });

        // Tutor shares a note (no PDF)
        const res = await request(app)
            .post(`/api/student-requests/${reqDoc._id}/resources/custom`)
            .set('x-user-id', tutor._id.toString())
            .set('x-user-role', 'tutor')
            .set('x-user-name', tutor.name)
            .send({
                title: 'Before next class',
                message: 'Read chapter 3 and note down difficult concepts.',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);

        // Verify: Note stored in database
        const updated = await StudentRequest.findById(reqDoc._id);
        expect(updated.sharedResources.length).toBe(1);
        expect(updated.sharedResources[0].resourceType).toBe('note'); // Identified as note (no PDF)
        expect(updated.sharedResources[0].title).toBe('Before next class');
    });

    it('redacts private email fields from public request browse response', async () => {
        // Test: GET /api/student-requests (public endpoint) doesn't expose emails
        // Validates: PII redaction works - only name and avatar returned
        const { student, tutor } = await createUsers();

        // Create a request with both student and tutor
        await StudentRequest.create({
            student: student._id,
            subject: 'ICT',
            description: 'Public listing sanitization test',
            gradeLevel: 'Grade 11',
            status: 'open',
            assignedTutor: tutor._id,
        });

        // Access public endpoint without authentication
        const res = await request(app).get('/api/student-requests?page=1&limit=10');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.requests)).toBe(true);
        expect(res.body.requests.length).toBeGreaterThan(0);

        // Verify: Email fields are NOT exposed in response (privacy protection)
        const first = res.body.requests[0];
        expect(first.student?.email).toBeUndefined(); // Email is redacted
        expect(first.assignedTutor?.email).toBeUndefined(); // Email is redacted
    });
});
