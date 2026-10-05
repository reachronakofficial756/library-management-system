const Member = require('../models/Member');
const BorrowRecord = require('../models/BorrowRecord');

/**
 * POST /api/members
 * Register a new member
 */
const registerMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/members
 * List all members with pagination and search
 */
const getMembers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { membershipId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [members, total] = await Promise.all([
      Member.find(query)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(parseInt(limit)),
      Member.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: members,
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
 * GET /api/members/:id
 * Get a single member by ID
 */
const getMemberById = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/members/:id/history
 * Get a member's complete borrow history
 */
const getMemberHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Verify member exists
    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const query = { member: id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      BorrowRecord.find(query)
        .sort({ issueDate: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BorrowRecord.countDocuments(query),
    ]);

    // Auto-update overdue statuses for display
    const now = new Date();
    const enrichedRecords = records.map((r) => {
      const obj = r.toObject({ virtuals: true });
      if (r.status === 'issued' && now > r.dueDate) {
        obj.status = 'overdue';
        obj.isOverdue = true;
      }
      obj.fine = r.calculateFine();
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        member: {
          id: member._id,
          name: member.name,
          email: member.email,
          membershipId: member.membershipId,
        },
        records: enrichedRecords,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/members/:id
 * Update member details
 */
const updateMember = async (req, res, next) => {
  try {
    // Prevent password update through this route
    delete req.body.password;

    const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }
    res.status(200).json({ success: true, message: 'Member updated successfully', data: member });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/members/:id/stats
 * Get borrowing statistics for a member
 */
const getMemberStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const now = new Date();
    const [total, issued, returned, overdue] = await Promise.all([
      BorrowRecord.countDocuments({ member: id }),
      BorrowRecord.countDocuments({ member: id, status: 'issued' }),
      BorrowRecord.countDocuments({ member: id, status: 'returned' }),
      BorrowRecord.countDocuments({ member: id, status: 'issued', dueDate: { $lt: now } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        issued,
        returned,
        overdue,
        currentlyBorrowing: issued,
        canBorrowMore: issued < member.maxBorrowLimit,
        borrowLimit: member.maxBorrowLimit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerMember,
  getMembers,
  getMemberById,
  getMemberHistory,
  updateMember,
  getMemberStats,
};
