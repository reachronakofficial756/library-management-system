const mongoose = require('mongoose');

/**
 * BorrowRecord Schema — IA2 Specification:
 * book (ref), member (ref), issueDate, dueDate, returnDate, status (issued / returned / overdue)
 */
const borrowRecordSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: [true, 'Member reference is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
borrowRecordSchema.index({ book: 1, status: 1 });
borrowRecordSchema.index({ member: 1, status: 1 });
borrowRecordSchema.index({ status: 1 });
borrowRecordSchema.index({ dueDate: 1 });

// Middleware: populate references on find
borrowRecordSchema.pre(/^find/, function (next) {
  this.populate('book', 'title author ISBN genre totalCopies availableCopies')
      .populate('member', 'name email membershipId joinedDate');
  next();
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
