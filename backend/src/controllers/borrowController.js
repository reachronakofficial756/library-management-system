const Book = require('../models/Book');
const Member = require('../models/Member');
const BorrowRecord = require('../models/BorrowRecord');

/**
 * POST /api/borrow
 * Issue a book to a member
 *
 * Race Condition Prevention Strategy (Section A - Task c):
 * ─────────────────────────────────────────────────────────────────────────────
 * To prevent two librarians from issuing the last copy simultaneously, we use
 * MongoDB's atomic findOneAndUpdate with a conditional filter
 * ({ _id: bookId, availableCopies: { $gt: 0 } }) combined with $inc: { availableCopies: -1 }.
 * MongoDB's document-level locking ensures that concurrent operations on the
 * same document are serialized. If two requests arrive when availableCopies is 1,
 * only the first request matches the filter and decrements the count to 0;
 * the second request immediately fails to match the filter, receives null, and
 * is rejected with a 400 error. No two librarians can decrement below 0.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const issueBook = async (req, res, next) => {
  try {
    const { bookId, memberId, dueDate } = req.body;

    // Validate that book and member exist
    const [book, member] = await Promise.all([
      Book.findById(bookId),
      Member.findById(memberId),
    ]);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    // Check if member already has an active borrow for this book
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

    // Default due date to 14 days if not specified
    const calculatedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    let borrowRecord;
    try {
      borrowRecord = await BorrowRecord.create({
        book: bookId,
        member: memberId,
        issueDate: new Date(),
        dueDate: calculatedDueDate,
        status: 'issued',
      });
    } catch (createErr) {
      // Rollback atomic decrement if record creation fails
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: 1 } });
      throw createErr;
    }

    const fullRecord = await BorrowRecord.findById(borrowRecord._id);

    return res.status(201).json({
      success: true,
      message: `Book "${book.title}" successfully issued to ${member.name}`,
      data: fullRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/return/:borrowId
 * Process a book return:
 * - Set returnDate
 * - Increment availableCopies
 * - Update status to returned
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

    // Update borrow record atomically
    const updatedRecord = await BorrowRecord.findOneAndUpdate(
      { _id: borrowId, status: { $ne: 'returned' } },
      {
        returnDate,
        status: 'returned',
      },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    // Atomically increment availableCopies
    await Book.findByIdAndUpdate(borrowRecord.book, { $inc: { availableCopies: 1 } });

    const fullRecord = await BorrowRecord.findById(updatedRecord._id);

    return res.status(200).json({
      success: true,
      message: 'Book returned successfully',
      data: fullRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/borrow
 * List borrow records with pagination and status filter
 */
const getAllBorrowRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;

    // Auto-update overdue records
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
 * Overview stats
 */
const getBorrowStats = async (req, res, next) => {
  try {
    const now = new Date();
    await BorrowRecord.updateMany(
      { status: 'issued', dueDate: { $lt: now } },
      { status: 'overdue' }
    );

    const [total, issued, returned, overdue] = await Promise.all([
      BorrowRecord.countDocuments(),
      BorrowRecord.countDocuments({ status: 'issued' }),
      BorrowRecord.countDocuments({ status: 'returned' }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        issued,
        returned,
        overdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { issueBook, returnBook, getAllBorrowRecords, getBorrowStats };
