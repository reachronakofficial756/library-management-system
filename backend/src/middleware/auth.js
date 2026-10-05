const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

/**
 * Middleware: Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }

    // Fetch user from DB
    const member = await Member.findById(decoded.id).select('-password');
    if (!member || !member.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated.' });
    }

    req.user = member;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Restrict to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
