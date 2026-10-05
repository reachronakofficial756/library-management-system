const Joi = require('joi');

/**
 * Generic validation middleware factory
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @param {string} source - 'body' | 'query' | 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`,
        errors: error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    req[source] = value; // replace with sanitized value
    next();
  };
};

// ─── Joi Schemas (Strictly Aligned to IA2 Specification) ────────────────────

const bookSchemas = {
  create: Joi.object({
    title: Joi.string().trim().max(200).required(),
    author: Joi.string().trim().max(100).required(),
    ISBN: Joi.string()
      .trim()
      .pattern(/^(?:\d{9}[\dX]|\d{13})$/)
      .required()
      .messages({ 'string.pattern.base': 'ISBN must be 10 or 13 digits' }),
    genre: Joi.string()
      .valid(
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Mystery',
        'Philosophy',
        'Other'
      )
      .default('Other'),
    totalCopies: Joi.number().integer().min(1).required(),
    availableCopies: Joi.number().integer().min(0).required(),
  }),

  list: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    genre: Joi.string().optional(),
    search: Joi.string().trim().optional().allow(''),
    available: Joi.boolean().optional(),
    sortBy: Joi.string().valid('title', 'author', 'createdAt', 'availableCopies').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

const memberSchemas = {
  create: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email().required(),
    membershipId: Joi.string()
      .trim()
      .uppercase()
      .pattern(/^[A-Z0-9]{6,12}$/)
      .required()
      .messages({ 'string.pattern.base': 'Membership ID must be 6-12 alphanumeric characters' }),
    role: Joi.string().valid('member', 'librarian').default('member'),
    password: Joi.string().min(6).optional().allow(''),
  }),
};

const borrowSchemas = {
  issue: Joi.object({
    bookId: Joi.string().hex().length(24).required().messages({
      'string.length': 'Invalid book ID format',
    }),
    memberId: Joi.string().hex().length(24).required().messages({
      'string.length': 'Invalid member ID format',
    }),
    dueDate: Joi.date().min('now').optional(),
  }),
};

const authSchemas = {
  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required(),
  }),
  register: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    membershipId: Joi.string().trim().uppercase().optional(),
  }),
};

module.exports = { validate, bookSchemas, memberSchemas, borrowSchemas, authSchemas };
