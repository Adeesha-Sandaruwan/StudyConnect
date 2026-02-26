import StudentRequest from '../models/StudentRequest.js';
import User from '../models/User.js';
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
    // Validate that user is a student
    const user = await User.findById(req.user._id);
    if (user.role !== 'student') {
      return res.status(403).json({ 
        success: false,
        message: 'Only students can create requests' 
      });
    }

    // Validate required fields
    if (!subject || !description || !gradeLevel) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide subject, description, and grade level' 
      });
    }

    const studentRequest = await StudentRequest.create({
      student: req.user._id,
      subject,
      description,
      gradeLevel,
      requestType: requestType || 'ongoing',
      preferredSchedule: preferredSchedule || [],
      priority: priority || 'medium'
    });

    const populatedRequest = await studentRequest.populate('student', ['name', 'email', 'avatar']);

    // Send confirmation email to student
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

    request.assignedTutor = tutorId;
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
const updateRequestStatus = async (req, res) => {
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

// @desc    Get requests by tutor (for assigned tutor)
// @route   GET /api/student-requests/tutor/assigned
// @access  Private (Tutors only)
const getTutorAssignedRequests = async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for assigned tutor
    const filter = { assignedTutor: req.user._id };
    
    // If specific status requested, add it to filter
    if (status !== 'all') {
      filter.status = status;
    }

    // Get assigned requests with full details
    const assignedRequests = await StudentRequest.find(filter)
      .populate('student', ['_id', 'name', 'email', 'avatar', 'phone', 'institution'])
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
