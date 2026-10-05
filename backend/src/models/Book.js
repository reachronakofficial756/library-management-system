const mongoose = require('mongoose');

/**
 * Book Schema — IA2 Specification:
 * title, author, ISBN, genre, totalCopies, availableCopies
 */
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters'],
    },
    ISBN: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      match: [/^(?:\d{9}[\dX]|\d{13})$/, 'Please enter a valid ISBN (10 or 13 digits)'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Mystery',
        'Philosophy',
        'Other',
      ],
      default: 'Other',
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'At least 1 copy must exist'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: [true, 'Available copies is required'],
      min: [0, 'Available copies cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Search and genre indexes
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });

// Pre-save: ensure availableCopies does not exceed totalCopies
bookSchema.pre('save', function (next) {
  if (this.availableCopies > this.totalCopies) {
    return next(new Error('Available copies cannot exceed total copies'));
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
