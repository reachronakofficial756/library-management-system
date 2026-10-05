const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

/**
 * Generate a signed JWT token
 */
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * POST /api/auth/login
 * Login with email & password, returns JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find member with password field included
    const member = await Member.findOne({ email }).select('+password');

    if (!member) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!member.password) {
      return res.status(401).json({
        success: false,
        message: 'No password set for this account. Contact the administrator.',
      });
    }

    const isMatch = await member.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(member._id, member.role);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        membershipId: member.membershipId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get the current logged-in user's profile
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Self-registration for members
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return res.status(409).json({ success: false, message: 'Email is already registered' });
    }

    // Auto-generate membershipId
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const membershipId = `MEM${randomSuffix}`;

    const member = await Member.create({
      name,
      email,
      password,
      membershipId,
      role: 'member',
    });

    const token = signToken(member._id, member.role);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      data: {
        id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        membershipId: member.membershipId,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe };
