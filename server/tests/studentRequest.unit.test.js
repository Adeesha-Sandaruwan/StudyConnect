import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the StudentRequest model methods
const mockStudentRequestCreate = jest.fn();
const mockStudentRequestFindById = jest.fn();
// Mock User model methods
const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
// Mock Notification model
const mockNotificationCreate = jest.fn();

// Mock email service functions
const mockSendRequestCreationEmail = jest.fn();
const mockSendAdminNotificationEmail = jest.fn();
const mockSendTutorAssignmentEmail = jest.fn();
const mockSendTutorRequestEmail = jest.fn();
const mockSendStatusUpdateEmail = jest.fn();

jest.unstable_mockModule('../models/StudentRequest.js', () => ({
    default: {
        create: mockStudentRequestCreate, // Mock database create
        findById: mockStudentRequestFindById, // Mock find by ID
    },
}));

jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findById: mockUserFindById, // Mock user lookup
        find: mockUserFind, // Mock user search (for admins/tutors)
    },
}));

jest.unstable_mockModule('../models/SubjectContent.js', () => ({
    default: {},
}));

jest.unstable_mockModule('../models/Notification.js', () => ({
    default: {
        create: mockNotificationCreate, // Mock notification creation
    },
}));

jest.unstable_mockModule('../services/emailService.js', () => ({
    sendRequestCreationEmail: mockSendRequestCreationEmail, // Confirmation to student
    sendAdminNotificationEmail: mockSendAdminNotificationEmail, // Alert to admins/tutors
    sendTutorAssignmentEmail: mockSendTutorAssignmentEmail, // Tutor assignment notification
    sendTutorRequestEmail: mockSendTutorRequestEmail, // Tutor assignment/removal notification
    sendStatusUpdateEmail: mockSendStatusUpdateEmail, // Status change notification
}));

const { createRequest, shareCustomResource } = await import('../controllers/studentRequestController.js');

function buildRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn(),
        send: jest.fn(),
    };
}

describe('Student request controller unit tests', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Reset all mocks before each test
    });

    it('creates a student request and sends notifications', async () => {
        // Test case: Student creates a request, emails are sent to admins/tutors
        const req = {
            user: { _id: 'student-1' },
            body: {
                subject: 'ICT',
                description: 'Need help with networking fundamentals',
                gradeLevel: 'Grade 11',
                requestType: 'ongoing',
                preferredSchedule: ['Saturday evening'],
                priority: 'high',
            },
        };
        const res = buildRes();

        mockUserFindById.mockResolvedValue({
            _id: 'student-1',
            role: 'student',
            name: 'Student Tester',
            email: 'student@test.com',
        });
        mockUserFind.mockResolvedValue([]);

        const createdDoc = {
            _id: 'request-1',
            populate: jest.fn().mockResolvedValue({
                _id: 'request-1',
                subject: 'ICT',
                student: { _id: 'student-1', name: 'Student Tester' },
            }),
        };
        mockStudentRequestCreate.mockResolvedValue(createdDoc);

        await createRequest(req, res);

        expect(mockStudentRequestCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                student: 'student-1',
                subject: 'ICT',
                gradeLevel: 'Grade 11',
                priority: 'high',
            })
        );
        expect(mockSendRequestCreationEmail).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: true,
                request: expect.objectContaining({ _id: 'request-1' }),
            })
        );
    });

    it('shares a direct tutor note and creates a student notification', async () => {
        // Test case: Tutor shares a note on their assigned request
        // Verifies: note is stored in sharedResources, student notification is created
        const req = {
            params: { id: 'request-1' },
            user: { _id: 'tutor-1', role: 'tutor', name: 'Tutor Tester' },
            body: {
                title: 'Session note',
                message: 'Please read chapter 3 before our next class.',
            },
            file: null, // No PDF, just note text
        };
        const res = buildRes();

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

        mockStudentRequestFindById.mockResolvedValue(storedRequest);

        await shareCustomResource(req, res);

        expect(storedRequest.sharedResources).toHaveLength(1);
        expect(storedRequest.sharedResources[0]).toEqual(
            expect.objectContaining({
                resourceType: 'note',
                title: 'Session note',
                message: 'Please read chapter 3 before our next class.',
                sharedBy: 'tutor-1',
            })
        );
        expect(mockNotificationCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                recipient: 'student-1',
                type: 'request-resource-shared',
                resourceType: 'note',
            })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });
});