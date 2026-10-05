const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getAllBorrowRecords,
  getBorrowStats,
} = require('../controllers/borrowController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, borrowSchemas } = require('../middleware/validate');

// GET /api/borrow/stats  (protected - librarian/admin)
router.get('/stats', protect, restrictTo('librarian', 'admin'), getBorrowStats);

// GET /api/borrow  (protected - librarian/admin)
router.get('/', protect, restrictTo('librarian', 'admin'), getAllBorrowRecords);

// POST /api/borrow  (protected - librarian/admin)
router.post(
  '/',
  protect,
  restrictTo('librarian', 'admin'),
  validate(borrowSchemas.issue),
  issueBook
);

// POST /api/return/:borrowId  (protected - librarian/admin)
router.post('/return/:borrowId', protect, restrictTo('librarian', 'admin'), returnBook);

module.exports = router;
