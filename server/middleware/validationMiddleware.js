import { body, validationResult } from 'express-validator';

export const validateProfile = [
  body('phoneNumber', 'Phone number is required').not().isEmpty(),
  body('city', 'City is required').not().isEmpty(),
  body('bio', 'Bio cannot be empty').not().isEmpty(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateStudentRequest = [
  // Subject validation - required and must be from the allowed list
  body('subject', 'Subject is required').not().isEmpty(),
  body('subject').isIn(['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other'])
    .withMessage('Invalid subject'),
  body('description', 'Description is required').not().isEmpty(),
  body('description', 'Description must be at most 1000 characters').isLength({ max: 1000 }),
  body('gradeLevel', 'Grade level is required').not().isEmpty(),
  body('gradeLevel').isIn(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'])
    .withMessage('Invalid grade level'),
  body('requestType').optional().isIn(['one-time', 'ongoing']).withMessage('Invalid request type'),
  body('preferredSchedule').optional().isArray().withMessage('preferredSchedule must be an array of strings'),
  body('preferredSchedule.*').optional().isString().withMessage('Each schedule entry must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validate student request updates (all fields optional but validated if provided)
export const validateStudentRequestUpdate = [
  // Optional subject - must be from allowed list if provided
  body('subject').optional().isIn(['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other'])
    .withMessage('Invalid subject'),
  
  // Optional description - max 1000 characters if provided
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
  
  // Optional grade level - must be from allowed list if provided
  body('gradeLevel').optional().isIn(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'])
    .withMessage('Invalid grade level'),
  
  // Optional fields with enum validation
  body('requestType').optional().isIn(['one-time', 'ongoing']).withMessage('Invalid request type'),
  body('preferredSchedule').optional().isArray().withMessage('preferredSchedule must be an array of strings'),
  body('preferredSchedule.*').optional().isString().withMessage('Each schedule entry must be a string'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validate request status updates
// Status must be one of: open, in-progress, completed, rejected
export const validateRequestStatus = [
  body('status', 'Status is required').not().isEmpty(),
  body('status').isIn(['open', 'in-progress', 'completed', 'rejected', 'cancelled']).withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validate tutor assignment
// tutorId must be a valid MongoDB ObjectId if provided
export const validateAssignTutor = [
  body('tutorId').optional().isMongoId().withMessage('tutorId must be a valid Mongo id'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];