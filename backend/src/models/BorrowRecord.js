const mongoose = require('mongoose');

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
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member', // librarian who issued the book
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member', // librarian who accepted return
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

// Virtual: isOverdue
borrowRecordSchema.virtual('isOverdue').get(function () {
  if (this.status === 'returned') return false;
  return new Date() > this.dueDate;
});

// Middleware: auto-update status to overdue when retrieved
borrowRecordSchema.pre(/^find/, function (next) {
  this.populate('book', 'title author ISBN coverImage')
      .populate('member', 'name email membershipId');
  next();
});

// Static: fine calculation (10 rupees per day overdue)
borrowRecordSchema.methods.calculateFine = function () {
  if (this.status !== 'overdue' && this.status !== 'returned') return 0;
  const returnOrNow = this.returnDate || new Date();
  const overdueDays = Math.max(
    0,
    Math.ceil((returnOrNow - this.dueDate) / (1000 * 60 * 60 * 24))
  );
  return overdueDays * 10; // ₹10 per day
};

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
