const Book = require('../models/Book');

/**
 * POST /api/books
 * Add a new book (librarian/admin only)
 */
const addBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books
 * List books with pagination, search, and genre filter
 */
const getBooks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      genre,
      search,
      available,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    // Filter by genre
    if (genre) query.genre = genre;

    // Filter by availability
    if (available === 'true') query.availableCopies = { $gt: 0 };
    if (available === 'false') query.availableCopies = 0;

    // Full-text search (title/author)
    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { ISBN: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [books, total] = await Promise.all([
      Book.find(query)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(parseInt(limit)),
      Book.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id
 * Get a single book by ID
 */
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/books/:id
 * Update a book (librarian/admin only)
 */
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({ success: true, message: 'Book updated successfully', data: book });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/books/:id
 * Delete a book (admin only)
 */
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.status(200).json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/genres
 * Get list of all genres
 */
const getGenres = async (req, res, next) => {
  try {
    const genres = await Book.distinct('genre');
    res.status(200).json({ success: true, data: genres });
  } catch (error) {
    next(error);
  }
};

module.exports = { addBook, getBooks, getBookById, updateBook, deleteBook, getGenres };
