const admin = (req, res, next) => {
  // First check if user exists
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authenticated' 
    });
  }

  // Then check if user is admin
  if (req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false,
      message: `Not authorized. Only admins can access this resource. Your role: ${req.user.role}` 
    });
  }
};

export { admin };