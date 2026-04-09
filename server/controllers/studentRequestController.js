import StudentRequest from '../models/StudentRequest.js';
import User from '../models/User.js';
import SubjectContent from '../models/SubjectContent.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import {
  sendRequestCreationEmail,
  sendAdminNotificationEmail,
  sendTutorAssignmentEmail,
  sendTutorRequestEmail,
  sendStatusUpdateEmail
} from '../services/emailService.js';

const buildPdfDataFromFile = (file) => {
  if (!file) {
    return { pdfUrl: '', pdfPublicId: '', hasPdf: false, name: '' };
  }

  const pdfUrl = file.secure_url || file.path || file.url || '';
  const pdfPublicId = file.filename || file.public_id || '';
  const name = file.originalname || file.name || 'Shared PDF';

  return {
    pdfUrl,
    pdfPublicId,
    hasPdf: Boolean(pdfUrl),
    name
  };
};

const populateRequestRelations = async (request) => {
  await request.populate('student', ['name', 'email', 'avatar', 'role']);
  await request.populate('assignedTutor', ['name', 'email', 'avatar', 'role']);
  await request.populate('linkedLessons', [
    '_id',
    'title',
    'subject',
    'grade',
    'weekNumber',
    'description',
    'resources',
    'status'
  ]);
  await request.populate('sharedResources.lesson', [
    '_id',
    'title',
    'subject',
    'grade',
    'weekNumber',
    'description',
    'resources',
    'status'
  ]);
  await request.populate('sharedResources.sharedBy', ['_id', 'name', 'avatar', 'role']);
  return request;
};

const canManageRequestResources = (request, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Boolean(
    request.assignedTutor && request.assignedTutor.toString() === user._id.toString()
  );
};

const canViewRequestDetails = (request, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const isStudentOwner = request.student.toString() === user._id.toString();
  const isAssignedTutor = Boolean(
    request.assignedTutor && request.assignedTutor.toString() === user._id.toString()
  );

  return isStudentOwner || isAssignedTutor;
};

const createResourceShareNotification = async ({ request, sender, resourceType, title, message }) => {
  if (!request?.student || !sender?._id) return;

  await Notification.create({
    recipient: request.student,
    sender: sender._id,
    type: 'request-resource-shared',
    studentRequest: request._id,
    title,
    message,
    actionLink: '/student-requests',
    resourceType
  });
};

// @desc    Get all student requests with optional filters
// @route   GET /api/student-requests
// @access  Public
const getAllRequests = async (req, res) => {
  try {
    const { status, subject, gradeLevel, priority, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status === 'rejected' ? { $in: ['rejected', 'cancelled'] } : status;
    }
    if (subject) filter.subject = subject;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const requests = await StudentRequest.find(filter)
      .populate('student', ['name', 'avatar'])
      .populate('assignedTutor', ['name', 'avatar'])
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await StudentRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own requests
// @route   GET /api/student-requests/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const filter = { student: req.user._id };

    const requests = await StudentRequest.find(filter)
      .populate('assignedTutor', ['name', 'email', 'avatar'])
      .populate('sharedResources.sharedBy', ['_id', 'name', 'avatar', 'role'])
      .limit(limitNum)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await StudentRequest.countDocuments(filter);

    res.json({
      success: true,
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get single student request by ID
// @route   GET /api/student-requests/:id
// @access  Private (Owner, assigned tutor, or admin)
const getRequestById = async (req, res) => {
  try {
    const request = await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    if (!canViewRequestDetails(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this request'
      });
    }

    await populateRequestRelations(request);

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Create a new student request
// @route   POST /api/student-requests
// @access  Private (Students only)
const createRequest = async (req, res) => {
  const { subject, description, gradeLevel, requestType, preferredSchedule, priority } = req.body;

  try {
    // Verify the authenticated user is a student (not tutor/admin)
    const user = await User.findById(req.user._id);
    if (user.role !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Only students can create requests' 
      });
    }

    // Validate required fields (subject, description, gradeLevel are required by middleware too)
    if (!subject || !description || !gradeLevel) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide subject, description, and grade level' 
      });
    }

    // Create the student request in database
    // Status starts as 'open', assignedTutor is null, responses is 0
    const studentRequest = await StudentRequest.create({
      student: req.user._id,                              // Link to the student who created it
      subject,
      description,
      gradeLevel,
      requestType: requestType || 'ongoing',              // Default to ongoing if not specified
      preferredSchedule: preferredSchedule || [],
      priority: priority || 'medium'                      // Default to medium priority
    });

    // Populate student details for response
    const populatedRequest = await studentRequest.populate('student', ['name', 'email', 'avatar']);

    // Send email confirmation to the student
    await sendRequestCreationEmail(
      user.email,
      user.name,
      subject,
      gradeLevel,
      studentRequest._id.toString()
    );

    // Send notification to all admins and tutors
    try {
      const adminsAndTutors = await User.find({ 
        $or: [
          { role: 'admin' },
          { role: 'tutor' }
        ]
      }).select('email');

      if (adminsAndTutors.length > 0) {
        const emailList = adminsAndTutors.map(u => u.email);
        await sendAdminNotificationEmail(
          emailList,
          subject,
          gradeLevel,
          user.name,
          description,
          studentRequest._id.toString()
        );
      }
    } catch (emailError) {
      console.warn('Failed to send admin notification email:', emailError.message);
      // Don't fail the request if admin email fails
    }

    res.status(201).json({
      success: true,
      message: 'Request created successfully. Confirmation email sent.',
      request: populatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Update student request
// @route   PUT /api/student-requests/:id
// @access  Private (Request owner or admin)
const updateRequest = async (req, res) => {
  try {
    // Authorization already checked by checkOwnerOrAdmin middleware
    // req.studentRequest is available from middleware
    let request = req.studentRequest || await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    const { subject, description, gradeLevel, requestType, preferredSchedule, priority, status } = req.body;

    // Only allow status change if request is open
    if (status && request.status === 'open') {
      request.status = status;
    }

    if (subject) request.subject = subject;
    if (description) request.description = description;
    if (gradeLevel) request.gradeLevel = gradeLevel;
    if (requestType) request.requestType = requestType;
    if (preferredSchedule) request.preferredSchedule = preferredSchedule;
    if (priority) request.priority = priority;

    await request.save();

    await request.populate('student', ['name', 'email', 'avatar']);
    await request.populate('assignedTutor', ['name', 'email', 'avatar']);
    const updatedRequest = request;

    res.json({
      success: true,
      message: 'Request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Delete student request
// @route   DELETE /api/student-requests/:id
// @access  Private (Request owner or admin)
const deleteRequest = async (req, res) => {
  try {
    // Authorization already checked by checkOwnerOrAdmin middleware
    // req.studentRequest is available from middleware
    const request = req.studentRequest || await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    await StudentRequest.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Request deleted successfully' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Assign a tutor to student request
// @route   PUT /api/student-requests/:id/assign-tutor
// @access  Private (Admin only)
const assignTutor = async (req, res) => {
  try {
    // EXTRA VALIDATION - Double check user exists and is admin
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
    }

    const isAdmin = req.user.role === 'admin';
    const userRole = req.user.role || 'unknown';

    if (!isAdmin) {
      return res.status(403).json({ 
        success: false,
        message: `Not authorized. Only admins can assign tutors. Your role is: ${userRole}` 
      });
    }

    const { tutorId } = req.body;

    const request = await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    // Block assignment updates on terminal states
    if (['completed', 'rejected', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify tutor assignment for completed/rejected requests'
      });
    }

    const previousTutorId = request.assignedTutor ? request.assignedTutor.toString() : null;

    // Remove tutor assignment when tutorId is omitted
    if (!tutorId) {
      if (!request.assignedTutor) {
        return res.status(400).json({
          success: false,
          message: 'No tutor is currently assigned to this request'
        });
      }

      request.assignedTutor = null;
      if (request.status === 'in-progress') {
        request.status = 'open';
      }

      await request.save();
      await request.populate('student', ['name', 'email', 'avatar']);
      await request.populate('assignedTutor', ['name', 'email', 'avatar']);

      try {
        const student = await User.findById(request.student);
        await sendStatusUpdateEmail(
          student.email,
          student.name,
          request.status,
          request.subject,
          request._id.toString()
        );

        if (previousTutorId) {
          const previousTutor = await User.findById(previousTutorId);
          if (previousTutor && previousTutor.role === 'tutor') {
            await sendTutorRequestEmail(
              previousTutor.email,
              previousTutor.name,
              student.name,
              request.subject,
              request._id.toString(),
              request.status,
              'removed'
            );
          }
        }
      } catch (emailError) {
        console.warn('Failed to send tutor removal emails:', emailError.message);
      }

      return res.json({
        success: true,
        message: 'Tutor removed successfully',
        request
      });
    }

    // Verify tutor exists and has tutor role
    const tutor = await User.findById(tutorId);
    if (!tutor || tutor.role !== 'tutor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tutor'
      });
    }

    const wasAssigned = !!request.assignedTutor;
    request.assignedTutor = new mongoose.Types.ObjectId(tutorId);

    if (request.status === 'open') {
      request.status = 'in-progress';
    }

    await request.save();

    await request.populate('student', ['name', 'email', 'avatar']);
    await request.populate('assignedTutor', ['name', 'email', 'avatar']);

    // Send notification emails only to related student and tutor
    try {
      const student = await User.findById(request.student);
      await sendTutorAssignmentEmail(
        student.email,
        student.name,
        tutor.name,
        request.subject,
        request._id.toString(),
        request.status
      );

      await sendTutorRequestEmail(
        tutor.email,
        tutor.name,
        student.name,
        request.subject,
        request._id.toString(),
        request.status,
        wasAssigned ? 'changed' : 'assigned'
      );

      // Notify previous tutor only when reassigned
      if (wasAssigned && previousTutorId && previousTutorId !== tutorId) {
        const previousTutor = await User.findById(previousTutorId);
        if (previousTutor && previousTutor.role === 'tutor') {
          await sendTutorRequestEmail(
            previousTutor.email,
            previousTutor.name,
            student.name,
            request.subject,
            request._id.toString(),
            request.status,
            'removed'
          );
        }
      }
    } catch (emailError) {
      console.warn('Failed to send tutor assignment email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: wasAssigned
        ? 'Tutor changed successfully and email notification sent to student'
        : 'Tutor assigned successfully and email notification sent to student',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Tutor accepts an open student request
// @route   PUT /api/student-requests/:id/tutor/accept
// @access  Private (Tutor only)
const acceptRequestByTutor = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'tutor') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can accept requests'
      });
    }

    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Only open requests can be accepted'
      });
    }

    if (request.assignedTutor) {
      return res.status(400).json({
        success: false,
        message: 'Request is already assigned to a tutor'
      });
    }

    request.assignedTutor = req.user._id;
    request.status = 'in-progress';
    await request.save();

    await request.populate('student', ['name', 'email', 'avatar']);
    await request.populate('assignedTutor', ['name', 'email', 'avatar']);

    try {
      const student = await User.findById(request.student);
      await sendTutorAssignmentEmail(
        student.email,
        student.name,
        req.user.name,
        request.subject,
        request._id.toString()
      );
    } catch (emailError) {
      console.warn('Failed to send tutor acceptance email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Request accepted successfully',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update request status
// @route   PUT /api/student-requests/:id/status
// @access  Private (Admin or request owner)
// @desc    Update request status
// @route   PUT /api/student-requests/:id/status
// @access  Private (Admin or Tutor only)
const updateRequestStatus = async (req, res) => {
  try {
    // Authorization already checked by adminOrTutor middleware
    const request = await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide status' 
      });
    }

    const validStatuses = ['open', 'in-progress', 'completed', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status' 
      });
    }

    const oldStatus = request.status;
    request.status = status;
    await request.save();

    await request.populate('student', ['name', 'email', 'avatar']);
    await request.populate('assignedTutor', ['name', 'email', 'avatar']);

    // Send notification emails only to related student and assigned tutor
    try {
      const student = await User.findById(request.student);
      await sendStatusUpdateEmail(
        student.email,
        student.name,
        status,
        request.subject,
        request._id.toString()
      );

      if (request.assignedTutor) {
        const assignedTutor = await User.findById(request.assignedTutor);
        if (assignedTutor && assignedTutor.role === 'tutor') {
          await sendTutorRequestEmail(
            assignedTutor.email,
            assignedTutor.name,
            student.name,
            request.subject,
            request._id.toString(),
            status,
            'changed'
          );
        }
      }
    } catch (emailError) {
      console.warn('Failed to send status update email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Status updated successfully and notification email sent',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get tutor's assigned student requests
// @route   GET /api/student-requests/tutor/assigned
// @access  Private (Admin or Tutor)
// LOGIC: Tutors see only their own assignments, Admins see all (or filtered by ?tutorId=)
const getTutorAssignedRequests = async (req, res) => {
  try {
    const { status = 'all', tutorId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    // Start with all requests that have a tutor assigned (filter out open requests)
    let filter = { assignedTutor: { $ne: null } };
    
    if (req.user.role === 'tutor') {
      // Tutors can ONLY see their own assigned requests - restrict by their ID
      filter.assignedTutor = req.user._id;
    } else if (tutorId) {
      // Admins can optionally filter by a specific tutor (?tutorId=xxx)
      // If not provided, admin sees ALL assigned requests
      filter.assignedTutor = tutorId;
    }
    
    // Optional: Filter by request status (open, in-progress, completed, rejected)
    // Default returns all statuses (status=all)
    if (status !== 'all') {
      filter.status = status === 'rejected' ? { $in: ['rejected', 'cancelled'] } : status;
    }

    // Fetch requests with populated student and tutor references
    const assignedRequests = await StudentRequest.find(filter)
      .populate('student', ['_id', 'name', 'email', 'avatar', 'phone', 'institution'])
      .populate('assignedTutor', ['_id', 'name', 'email', 'avatar'])
      .populate('sharedResources.sharedBy', ['_id', 'name', 'avatar', 'role'])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await StudentRequest.countDocuments(filter);

    res.json({
      success: true,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      },
      requests: assignedRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get open requests available for tutor assignment
// @route   GET /api/student-requests/tutor/available
// @access  Private (Tutors only)
const getAvailableRequests = async (req, res) => {
  try {
    const { subject, gradeLevel, priority, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for open requests without assigned tutor
    const filter = { 
      status: 'open',
      assignedTutor: null
    };

    if (subject) filter.subject = subject;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (priority) filter.priority = priority;

    // Get available open requests
    const availableRequests = await StudentRequest.find(filter)
      .populate('student', ['_id', 'name', 'email', 'avatar', 'phone', 'institution'])
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);

    const total = await StudentRequest.countDocuments(filter);

    res.json({
      success: true,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      },
      requests: availableRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// @desc    Get open requests for a specific subject
// @route   GET /api/student-requests/subject/:subject
// @access  Public
const getRequestsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const requests = await StudentRequest.find({ subject, status: 'open' })
      .populate('student', ['name', 'avatar'])
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await StudentRequest.countDocuments({ subject, status: 'open' });

    res.json({
      requests,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Share a lesson with the student on an assigned request
// @route   POST /api/student-requests/:id/resources
// @access  Private (Assigned tutor or Admin)
const shareLesson = async (req, res) => {
  try {
    const { lessonId } = req.body;

    if (!lessonId) {
      return res.status(400).json({ success: false, message: 'lessonId is required' });
    }

    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const isAdmin = req.user.role === 'admin';

    if (!canManageRequestResources(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned tutor or an admin can share lessons on this request'
      });
    }

    const lesson = await SubjectContent.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Tutors may only share their own lessons
    if (!isAdmin && lesson.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only share lessons that you created'
      });
    }

    // Avoid duplicates
    const alreadyLinked = request.linkedLessons.some((id) => id.toString() === lessonId);
    const alreadySharedAsResource = request.sharedResources.some(
      (resource) =>
        resource.resourceType === 'lesson' &&
        resource.lesson &&
        resource.lesson.toString() === lessonId
    );

    if (!alreadyLinked) {
      request.linkedLessons.push(new mongoose.Types.ObjectId(lessonId));
    }

    if (!alreadySharedAsResource) {
      request.sharedResources.push({
        resourceType: 'lesson',
        title: lesson.title,
        message: '',
        lesson: lesson._id,
        sharedBy: req.user._id,
        sharedAt: new Date()
      });
    }

    await request.save();
    await populateRequestRelations(request);

    if (!alreadySharedAsResource) {
      await createResourceShareNotification({
        request,
        sender: req.user,
        resourceType: 'lesson',
        title: lesson.title,
        message: `${req.user.name} shared a module lesson for your ${request.subject} request.`
      });
    }

    res.json({
      success: true,
      message: 'Lesson shared with student successfully',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a shared lesson from a request
// @route   DELETE /api/student-requests/:id/resources/:lessonId
// @access  Private (Assigned tutor or Admin)
const removeSharedLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!canManageRequestResources(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned tutor or an admin can manage shared lessons'
      });
    }

    request.linkedLessons = request.linkedLessons.filter(
      (id) => id.toString() !== lessonId
    );
    request.sharedResources = request.sharedResources.filter(
      (resource) => !(resource.resourceType === 'lesson' && resource.lesson && resource.lesson.toString() === lessonId)
    );

    await request.save();
    await populateRequestRelations(request);

    res.json({
      success: true,
      message: 'Lesson removed successfully',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Share a direct PDF and/or tutor note with the student on a request
// @route   POST /api/student-requests/:id/resources/custom
// @access  Private (Assigned tutor or Admin)
const shareCustomResource = async (req, res) => {
  try {
    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!canManageRequestResources(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned tutor or an admin can share resources on this request'
      });
    }

    const title = String(req.body.title || '').trim();
    const message = String(req.body.message || '').trim();
    const { pdfUrl, pdfPublicId, hasPdf, name } = buildPdfDataFromFile(req.file);

    if (!message && !hasPdf) {
      return res.status(400).json({
        success: false,
        message: 'Add a note or upload a PDF before sharing'
      });
    }

    const resourceType = hasPdf ? 'pdf' : 'note';
    request.sharedResources.push({
      resourceType,
      title: title || (hasPdf ? name : 'Tutor note'),
      message,
      file: hasPdf
        ? { url: pdfUrl, publicId: pdfPublicId, name }
        : { url: '', publicId: '', name: '' },
      sharedBy: req.user._id,
      sharedAt: new Date()
    });

    await request.save();
    await populateRequestRelations(request);

    await createResourceShareNotification({
      request,
      sender: req.user,
      resourceType,
      title: title || (hasPdf ? name : 'Tutor note'),
      message: hasPdf
        ? `${req.user.name} shared a PDF resource on your ${request.subject} request.`
        : `${req.user.name} shared a tutor note on your ${request.subject} request.`
    });

    res.status(201).json({
      success: true,
      message: 'Resource shared with student successfully',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a shared resource entry from a request
// @route   DELETE /api/student-requests/:id/resources/shared/:resourceId
// @access  Private (Assigned tutor or Admin)
const removeSharedResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!canManageRequestResources(request, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned tutor or an admin can manage shared resources'
      });
    }

    const resource = request.sharedResources.id(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Shared resource not found' });
    }

    if (resource.resourceType === 'lesson' && resource.lesson) {
      request.linkedLessons = request.linkedLessons.filter(
        (lessonId) => lessonId.toString() !== resource.lesson.toString()
      );
    }

    resource.deleteOne();
    await request.save();
    await populateRequestRelations(request);

    res.json({
      success: true,
      message: 'Shared resource removed successfully',
      request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download a shared request PDF resource
// @route   GET /api/student-requests/:id/resources/shared/:resourceId/file
// @access  Private (Owner, assigned tutor, or admin)
const downloadSharedResourceFile = async (req, res) => {
  try {
    const request = await StudentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!canViewRequestDetails(request, req.user)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this file' });
    }

    const resource = request.sharedResources.id(req.params.resourceId);
    if (!resource || !resource.file?.url) {
      return res.status(404).json({ success: false, message: 'Shared PDF not found' });
    }

    const response = await fetch(resource.file.url);
    if (!response.ok) {
      return res.status(502).json({ success: false, message: 'Failed to fetch shared PDF' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const safeName = String(resource.file.name || resource.title || 'shared-resource.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-');
    const fileName = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(fileBuffer.length));
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(fileBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getAllRequests,
  getMyRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  assignTutor,
  acceptRequestByTutor,
  updateRequestStatus,
  getTutorAssignedRequests,
  getAvailableRequests,
  getRequestsBySubject,
  shareLesson,
  removeSharedLesson,
  shareCustomResource,
  removeSharedResource,
  downloadSharedResourceFile
};
