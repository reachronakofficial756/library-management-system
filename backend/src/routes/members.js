const express = require('express');
const router = express.Router();
const {
  registerMember,
  getMembers,
  getMemberById,
  getMemberHistory,
  updateMember,
  getMemberStats,
} = require('../controllers/memberController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, memberSchemas } = require('../middleware/validate');

// GET /api/members  (protected - librarian/admin)
router.get('/', protect, restrictTo('librarian', 'admin'), getMembers);

// POST /api/members  (protected - librarian/admin)
router.post(
  '/',
  protect,
  restrictTo('librarian', 'admin'),
  validate(memberSchemas.create),
  registerMember
);

// GET /api/members/:id  (protected)
router.get('/:id', protect, getMemberById);

// PUT /api/members/:id  (protected - librarian/admin)
router.put('/:id', protect, restrictTo('librarian', 'admin'), updateMember);

// GET /api/members/:id/history  (protected)
router.get('/:id/history', protect, getMemberHistory);

// GET /api/members/:id/stats  (protected)
router.get('/:id/stats', protect, getMemberStats);

module.exports = router;
