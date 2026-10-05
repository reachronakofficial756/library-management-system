const express = require('express');
const router = express.Router();
const {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  getGenres,
} = require('../controllers/bookController');
const { protect, restrictTo } = require('../middleware/auth');
const { validate, bookSchemas } = require('../middleware/validate');

// GET /api/books/genres  (public)
router.get('/genres', getGenres);

// GET /api/books  (public)
router.get('/', validate(bookSchemas.list, 'query'), getBooks);

// GET /api/books/:id  (public)
router.get('/:id', getBookById);

// POST /api/books  (librarian / admin only)
router.post(
  '/',
  protect,
  restrictTo('librarian', 'admin'),
  validate(bookSchemas.create),
  addBook
);

// PUT /api/books/:id  (librarian / admin only)
router.put('/:id', protect, restrictTo('librarian', 'admin'), updateBook);

// DELETE /api/books/:id  (admin only)
router.delete('/:id', protect, restrictTo('admin'), deleteBook);

module.exports = router;
