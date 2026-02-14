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