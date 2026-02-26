import StudentRequest from '../models/StudentRequest.js';

/**
 * Middleware to check if user is the owner of the resource or admin
 * Must be used after protect middleware
 */
const checkOwnerOrAdmin = async (req, res, next) => {
  try {
    // Verify user is authenticated (should be done by protect middleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Get the request ID from params
    const requestId = req.params.id;
    
    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID required'
      });
    }

    // Fetch the student request
    const studentRequest = await StudentRequest.findById(requestId);
    
    if (!studentRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check authorization
    const isOwner = studentRequest.student.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const userRole = req.user.role || 'unknown';

    console.log(`Authorization Check:
      RequestID: ${requestId}
      RequestOwner: ${studentRequest.student.toString()}
      CurrentUser: ${req.user._id.toString()}
      UserRole: ${userRole}
      IsOwner: ${isOwner}
      IsAdmin: ${isAdmin}
    `);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: `Not authorized. You are a ${userRole}. Only the request owner or admin can perform this action.`,
        details: {
          requestOwner: studentRequest.student.toString(),
          currentUser: req.user._id.toString(),
          userRole: userRole
        }
      });
    }

    // Attach the request to req for use in controller
    req.studentRequest = studentRequest;
    next();
  } catch (error) {
    console.error('Owner middleware error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export { checkOwnerOrAdmin };
