const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validate');

// POST /api/auth/login
router.post('/login', validate(authSchemas.login), login);

// POST /api/auth/register
router.post('/register', validate(authSchemas.register), register);

// GET /api/auth/me  (protected)
router.get('/me', protect, getMe);

module.exports = router;
