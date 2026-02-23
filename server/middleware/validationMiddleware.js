import { check, validationResult } from 'express-validator';

export const validateProfile = [
  check('phoneNumber', 'Phone number is required').not().isEmpty(),
  check('city', 'City is required').not().isEmpty(),
  check('bio', 'Bio cannot be empty').not().isEmpty(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateStudentRequest = [
  check('subject', 'Subject is required').not().isEmpty(),
  check('subject').isIn(['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other'])
    .withMessage('Invalid subject'),
  check('description', 'Description is required').not().isEmpty(),
  check('description', 'Description must be at most 1000 characters').isLength({ max: 1000 }),
  check('gradeLevel', 'Grade level is required').not().isEmpty(),
  check('gradeLevel').isIn(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'])
    .withMessage('Invalid grade level'),
  check('requestType').optional().isIn(['one-time', 'ongoing']).withMessage('Invalid request type'),
  check('preferredSchedule').optional().isArray().withMessage('preferredSchedule must be an array of strings'),
  check('preferredSchedule.*').optional().isString().withMessage('Each schedule entry must be a string'),
  check('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateStudentRequestUpdate = [
  check('subject').optional().isIn(['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other'])
    .withMessage('Invalid subject'),
  check('description').optional().isLength({ max: 1000 }).withMessage('Description must be at most 1000 characters'),
  check('gradeLevel').optional().isIn(['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'])
    .withMessage('Invalid grade level'),
  check('requestType').optional().isIn(['one-time', 'ongoing']).withMessage('Invalid request type'),
  check('preferredSchedule').optional().isArray().withMessage('preferredSchedule must be an array of strings'),
  check('preferredSchedule.*').optional().isString().withMessage('Each schedule entry must be a string'),
  check('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateRequestStatus = [
  check('status', 'Status is required').not().isEmpty(),
  check('status').isIn(['open', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

export const validateAssignTutor = [
  // tutorId is optional for now; if provided it must be a valid Mongo ObjectId
  check('tutorId').optional().isMongoId().withMessage('tutorId must be a valid Mongo id'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];