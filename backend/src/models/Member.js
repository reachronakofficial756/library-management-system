const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Member Schema — IA2 Specification:
 * name, email, membershipId, joinedDate (plus password & role for librarian JWT auth)
 */
const memberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    membershipId: {
      type: String,
      required: [true, 'Membership ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9]{6,12}$/, 'Membership ID must be 6-12 alphanumeric characters'],
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ['member', 'librarian'],
      default: 'member',
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Search index
memberSchema.index({ name: 'text', email: 'text', membershipId: 1 });

// Pre-save: hash password
memberSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare password
memberSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
memberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Member', memberSchema);
