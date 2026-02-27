import StudentRequest from '../models/StudentRequest.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import {
  sendRequestCreationEmail,
  sendAdminNotificationEmail,
  sendTutorAssignmentEmail,
  sendStatusUpdateEmail
} from '../services/emailService.js';

// @desc    Get all student requests with optional filters
// @route   GET /api/student-requests
// @access  Public
const getAllRequests = async (req, res) => {
  try {
    const { status, subject, gradeLevel, priority, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (priority) filter.priority = priority;

    const skip = (page - 1) * limit;

    const requests = await StudentRequest.find(filter)
      .populate('student', ['name', 'email', 'avatar'])
      .populate('assignedTutor', ['name', 'email', 'avatar'])
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
    const requests = await StudentRequest.find({ student: req.user._id })
      .populate('assignedTutor', ['name', 'email', 'avatar'])
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
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
// @access  Public
const getRequestById = async (req, res) => {
  try {
    const request = await StudentRequest.findById(req.params.id)
      .populate('student', ['name', 'email', 'avatar', 'role'])
      .populate('assignedTutor', ['name', 'email', 'avatar']);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

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

    if (!tutorId) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide tutor ID' 
      });
    }

    const request = await StudentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
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

    // Only allow assignment if request is open
    if (request.status !== 'open') {
      return res.status(400).json({ 
        success: false,
        message: 'Can only assign tutor to open requests' 
      });
    }

    request.assignedTutor = new mongoose.Types.ObjectId(tutorId);
    request.status = 'in-progress';
    await request.save();

    await request.populate('student', ['name', 'email', 'avatar']);
    await request.populate('assignedTutor', ['name', 'email', 'avatar']);

    // Send notification email to student about tutor assignment
    try {
      const student = await User.findById(request.student);
      await sendTutorAssignmentEmail(
        student.email,
        student.name,
        tutor.name,
        request.subject,
        request._id.toString()
      );
    } catch (emailError) {
      console.warn('Failed to send tutor assignment email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Tutor assigned successfully and email notification sent to student',
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

    const validStatuses = ['open', 'in-progress', 'completed', 'cancelled'];
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

    // Send notification email to student about status change
    try {
      const student = await User.findById(request.student);
      await sendStatusUpdateEmail(
        student.email,
        student.name,
        status,
        request.subject,
        request._id.toString()
      );
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
    
    // Optional: Filter by request status (open, in-progress, completed, cancelled)
    // Default returns all statuses (status=all)
    if (status !== 'all') {
      filter.status = status;
    }

    // Fetch requests with populated student and tutor references
    const assignedRequests = await StudentRequest.find(filter)
      .populate('student', ['_id', 'name', 'email', 'avatar', 'phone', 'institution'])
      .populate('assignedTutor', ['_id', 'name', 'email', 'avatar'])
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
      .populate('student', ['name', 'email', 'avatar'])
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

export {
  getAllRequests,
  getMyRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  assignTutor,
  updateRequestStatus,
  getTutorAssignedRequests,
  getAvailableRequests,
  getRequestsBySubject
};
