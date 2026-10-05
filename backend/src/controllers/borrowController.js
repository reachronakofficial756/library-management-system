const mongoose = require('mongoose');
const Book = require('../models/Book');
const Member = require('../models/Member');
const BorrowRecord = require('../models/BorrowRecord');

/**
 * POST /api/borrow
 * Issue a book to a member
 *
 * Race Condition Prevention Strategy:
 * ─────────────────────────────────────────────────────────────────────────────
 * To prevent two librarians from issuing the last copy simultaneously, we use
 * MongoDB's atomic findOneAndUpdate with a conditional filter
 * ({ _id: bookId, availableCopies: { $gt: 0 } }) combined with $inc: { availableCopies: -1 }.
 * This is a single atomic operation at the DB level — MongoDB's document-level
 * locking guarantees only one concurrent write succeeds for that condition.
 * If availableCopies is already 0, findOneAndUpdate returns null, and we reject
 * the request cleanly. No two librarians can decrement below 0 this way.
 * Alternative: Optimistic locking with a version field (mongoose-sequence),
 * or a Redis-based distributed lock (e.g., Redlock). We chose atomic DB ops
 * as the simplest solution requiring no extra infrastructure.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId, notes } = req.body;

    // Validate book and member exist
    const [book, member] = await Promise.all([
      Book.findById(bookId),
      Member.findById(memberId),
    ]);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (!member || !member.isActive) {
      return res.status(404).json({ success: false, message: 'Member not found or inactive' });
    }

    // Check if member has exceeded borrow limit
    const activeBorrows = await BorrowRecord.countDocuments({
      member: memberId,
      status: { $in: ['issued', 'overdue'] },
    });

    if (activeBorrows >= member.maxBorrowLimit) {
      return res.status(400).json({
        success: false,
        message: `Member has reached the maximum borrow limit of ${member.maxBorrowLimit} books`,
      });
    }

    // Check if member already has this book
    const existingBorrow = await BorrowRecord.findOne({
      book: bookId,
      member: memberId,
      status: { $in: ['issued', 'overdue'] },
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'Member already has this book borrowed',
      });
    }

    // ─── ATOMIC DECREMENT (Race Condition Prevention) ─────────────────────
    // Only decrements if availableCopies > 0 — single atomic operation at DB level.
    // MongoDB's document-level locking guarantees that under high concurrency,
    // only requests with availableCopies > 0 match and decrement.
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );

    if (!updatedBook) {
      return res.status(400).json({
        success: false,
        message: 'No copies available for borrowing',
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    // Set due date: 14 days from today if not provided
    const dueDate = req.body.dueDate
      ? new Date(req.body.dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    let borrowRecord;
    try {
      // Create borrow record
      borrowRecord = await BorrowRecord.create({
        book: bookId,
        member: memberId,
        issueDate: new Date(),
        dueDate,
        status: 'issued',
        notes: notes || '',
        issuedBy: req.user._id,
      });
    } catch (createErr) {
      // Compensating rollback if record creation fails
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw createErr;
    }

    // Fetch full borrow record with populated fields
    const fullRecord = await BorrowRecord.findById(borrowRecord._id);

    return res.status(201).json({
      success: true,
      message: `Book "${book.title}" issued successfully to ${member.name}`,
      data: fullRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/return/:borrowId
 * Return a borrowed book
 */
const returnBook = async (req, res, next) => {
  try {
    const { borrowId } = req.params;

    const borrowRecord = await BorrowRecord.findById(borrowId);

    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: 'Borrow record not found' });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    const returnDate = new Date();
    const fine = borrowRecord.calculateFine
      ? (() => {
          // Temporarily set returnDate for fine calculation
          const temp = borrowRecord.returnDate;
          borrowRecord.returnDate = returnDate;
          const f = borrowRecord.calculateFine();
          borrowRecord.returnDate = temp;
          return f;
        })()
      : 0;

    // Update borrow record atomically only if not already returned (prevents race condition)
    const updatedRecord = await BorrowRecord.findOneAndUpdate(
      { _id: borrowId, status: { $ne: 'returned' } },
      {
        returnDate,
        status: 'returned',
        fine,
        returnedBy: req.user._id,
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    // Atomically increment availableCopies
    await Book.findByIdAndUpdate(borrowRecord.book, { $inc: { availableCopies: 1 } });

    // Fetch full updated record
    const fullRecord = await BorrowRecord.findById(updatedRecord._id);

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: {
        borrowRecord: fullRecord,
        fine,
        message: fine > 0 ? `Fine charged: ₹${fine}` : 'No fine',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/borrow
 * List all borrow records with filters
 */
const getAllBorrowRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;

    // Auto-update overdue statuses
    await BorrowRecord.updateMany(
      { status: 'issued', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [records, total] = await Promise.all([
      BorrowRecord.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      BorrowRecord.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/borrow/stats
 * Get overall borrowing statistics
 */
const getBorrowStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Update overdue status
    await BorrowRecord.updateMany(
      { status: 'issued', dueDate: { $lt: now } },
      { status: 'overdue' }
    );

    const [total, issued, returned, overdue, totalFines] = await Promise.all([
      BorrowRecord.countDocuments(),
      BorrowRecord.countDocuments({ status: 'issued' }),
      BorrowRecord.countDocuments({ status: 'returned' }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
      BorrowRecord.aggregate([{ $group: { _id: null, total: { $sum: '$fine' } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        issued,
        returned,
        overdue,
        totalFinesCollected: totalFines[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { issueBook, returnBook, getAllBorrowRecords, getBorrowStats };
