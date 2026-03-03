import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  // First, try to get the token from the cookies
  let token = req.cookies.jwt;

  // Check Authorization header if cookie not found
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    // If the Authorization header starts with 'Bearer ', extract the token
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }
  }

  if (token) {
    try {
      // Verify the token using the secret key and decode it to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};

export { protect };