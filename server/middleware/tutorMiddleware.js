const tutor = (req, res, next) => {
  if (req.user && req.user.role === 'tutor') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as a tutor');
  }
};

const adminOrTutor = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'tutor')) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized. Only admins and tutors can perform this action');
  }
};

export { tutor, adminOrTutor };
