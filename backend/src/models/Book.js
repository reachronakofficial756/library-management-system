const mongoose = require('mongoose');

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
        'Fantasy',
        'Romance',
        'Horror',
        'Philosophy',
        'Economics',
        'Politics',
        'Art',
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
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    publishedYear: {
      type: Number,
      min: [1, 'Invalid year'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    coverImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search
bookSchema.index({ title: 'text', author: 'text' });
bookSchema.index({ genre: 1 });

// Virtual: isAvailable
bookSchema.virtual('isAvailable').get(function () {
  return this.availableCopies > 0;
});

// Pre-save: ensure availableCopies <= totalCopies
bookSchema.pre('save', function (next) {
  if (this.availableCopies > this.totalCopies) {
    return next(new Error('Available copies cannot exceed total copies'));
  }
  next();
});

module.exports = mongoose.model('Book', bookSchema);
