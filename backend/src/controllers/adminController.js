const User = require('../models/User');
const Poll = require('../models/Poll');
const CastVote = require('../models/CastVote');
const VoterReceipt = require('../models/VoterReceipt');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const csv = require('fast-csv');
const fs = require('fs');

// @desc    Get admin metrics overview
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getMetrics = async (req, res) => {
  try {
    const totalVoters = await User.countDocuments({ role: 'voter' });
    
    const activePolls = await Poll.find({ status: 'active' }, '_id');
    const activePollIds = activePolls.map(p => p._id);

    // A user is only "fully voted" if their array contains ALL active poll IDs
    let totalVoted = 0;
    if (activePollIds.length > 0) {
      totalVoted = await User.countDocuments({ 
        role: 'voter', 
        votedPolls: { $all: activePollIds } 
      });
    }

    const totalPending = totalVoters - totalVoted;
    const voteRatio = totalVoters > 0 ? ((totalVoted / totalVoters) * 100).toFixed(2) : 0;
    const totalVotes = await CastVote.countDocuments(); 

    // --- NEW GROUPED ANALYTICS LOGIC ---
    // Fetch all polls that aren't drafts, and all votes
    const allPolls = await Poll.find({ status: { $ne: 'draft' } });
    const allCastVotes = await CastVote.find();

    const groupedResults = allPolls.map(poll => {
      // Get only the votes cast for this specific poll
      const pollVotes = allCastVotes.filter(v => v.pollId.toString() === poll._id.toString());
      
      const questions = poll.questions
        .filter(q => q.display !== false && q.type !== 'fillInTheBlank') // Exclude hidden and text-input questions
        .map(q => {
          const tally = {};
          
          // 1. Initialize all options at 0
          q.options.forEach(opt => tally[opt.id] = { text: opt.text, count: 0 });
          
          // 2. Count the votes
          pollVotes.forEach(voteDoc => {
            const answer = voteDoc.votes.find(v => v.questionId === q.id);
            if (answer && answer.selected) {
              const selections = Array.isArray(answer.selected) ? answer.selected : [answer.selected];
              selections.forEach(selId => {
                if (tally[selId]) tally[selId].count++;
              });
            }
          });

          // 3. Convert tally object to array and sort highest to lowest
          const sortedOptions = Object.values(tally).sort((a, b) => b.count - a.count);

          return {
            questionText: q.text,
            options: sortedOptions
          };
        });

      return {
        pollId: poll._id,
        pollTitle: poll.title,
        status: poll.status,
        questions
      };
    });

    res.json({ totalVoters, totalVoted, totalPending, voteRatio, totalVotes, groupedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users with filtering
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const { voted } = req.query;
    const filter = { role: 'voter' };

    if (voted === 'true') {
      filter['votedPolls.0'] = { $exists: true }; // Array is not empty
    } else if (voted === 'false') {
      filter.votedPolls = { $size: 0 }; // Array is empty
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'voter',
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      hasVoted: user.hasVoted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { email, role, hasVoted } = req.body;

    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof hasVoted === 'boolean') user.hasVoted = hasVoted;

    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      hasVoted: user.hasVoted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk upload users from CSV
// @route   POST /api/admin/users/bulk-upload
// @access  Private/Admin
const bulkUploadUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv.parse({ headers: true }))
      .on('data', async (row) => {
        try {
          const { email, password, role } = row;

          if (!email || !password) {
            errors.push({ row, error: 'Email and password are required' });
            return;
          }

          const userExists = await User.findOne({ email });

          if (userExists) {
            errors.push({ row, error: 'User already exists' });
            return;
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = await User.create({
            email,
            password: hashedPassword,
            role: role || 'voter',
          });

          results.push({ email, userId: user._id });
        } catch (error) {
          errors.push({ row, error: error.message });
        }
      })
      .on('end', () => {
        // Delete uploaded file
        fs.unlinkSync(req.file.path);
        res.json({
          message: 'Bulk upload completed',
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors,
        });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all polls
// @route   GET /api/admin/polls
// @access  Private/Admin
const getPolls = async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create poll
// @route   POST /api/admin/polls
// @access  Private/Admin
const createPoll = async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'Title and questions are required' });
    }

    const poll = await Poll.create({
      title,
      description,
      questions,
      status: 'draft',
    });

    res.status(201).json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update poll (only if draft)
// @route   PUT /api/admin/polls/:id
// @access  Private/Admin
const updatePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'draft') {
      return res.status(400).json({ message: 'Cannot update active or closed polls' });
    }

    const { title, description, questions } = req.body;

    if (title) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (questions) poll.questions = questions;

    await poll.save();
    res.json(poll);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Launch poll (change status to active)
// @route   POST /api/admin/polls/:id/launch
// @access  Private/Admin
const launchPoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'draft') {
      return res.status(400).json({ message: 'Poll is already active or closed' });
    }

    poll.status = 'active';
    poll.startDate = new Date();
    await poll.save();

    res.json({ message: 'Poll launched successfully', poll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Close poll
// @route   POST /api/admin/polls/:id/close
// @access  Private/Admin
const closePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    poll.status = 'closed';
    poll.endDate = new Date();
    await poll.save();

    res.json({ message: 'Poll closed successfully', poll });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete poll (only if draft)
// @route   DELETE /api/admin/polls/:id
// @access  Private/Admin
const deletePoll = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'draft') {
      return res.status(400).json({ message: 'Cannot delete active or closed polls' });
    }

    await poll.deleteOne();
    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export voting data (Designed Excel with Analytics)
// @route   GET /api/admin/export/votes
// @access  Private/Admin
const exportVotes = async (req, res) => {
  try {
    const { pollId } = req.query;

    if (!pollId) {
      return res.status(400).json({ message: 'Poll ID is required for export' });
    }

    // 1. Fetch the Poll (to get question/option text) and the Votes
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    const rawVotes = await CastVote.find({ pollId }).sort({ timestamp: 1 });

    const workbook = new ExcelJS.Workbook();

    // ==========================================
    // SHEET 1: VOTE SUMMARY & ANALYTICS
    // ==========================================
    const summarySheet = workbook.addWorksheet('Vote Summary');
    summarySheet.columns = [
      { key: 'item', width: 60 },
      { key: 'count', width: 20 }
    ];

    // Style the Main Title
    summarySheet.mergeCells('A1:B1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `Poll Results: ${poll.title}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0052CC' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.getRow(1).height = 30;

    let currentRow = 3;

    // Pre-calculate the vote tallies
    const tally = {};
    poll.questions.forEach(q => {
      tally[q.id] = {};
      if (q.options) {
        q.options.forEach(o => tally[q.id][o.id] = 0);
      }
    });

    rawVotes.forEach(voteDoc => {
      voteDoc.votes.forEach(v => {
        if (Array.isArray(v.selected)) {
          v.selected.forEach(sel => {
            if (tally[v.questionId] && tally[v.questionId][sel] !== undefined) tally[v.questionId][sel]++;
          });
        } else {
          if (tally[v.questionId] && tally[v.questionId][v.selected] !== undefined) tally[v.questionId][v.selected]++;
        }
      });
    });

    // Write the tallies to the summary sheet with styling
    poll.questions.forEach(q => {
      // Question Header Row
      const qRow = summarySheet.getRow(currentRow);
      qRow.getCell(1).value = q.text;
      qRow.getCell(2).value = 'Total Votes';
      qRow.font = { bold: true, size: 12 };
      qRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      qRow.border = { bottom: { style: 'thin' } };
      currentRow++;

      // Option Rows
      if (q.type === 'multipleChoice' || q.type === 'checkbox') {
        q.options.forEach(opt => {
          const row = summarySheet.getRow(currentRow);
          row.getCell(1).value = `    • ${opt.text}`;
          row.getCell(2).value = tally[q.id][opt.id] || 0;
          row.getCell(2).alignment = { horizontal: 'left' };
          currentRow++;
        });
      } else if (q.type === 'fillInTheBlank') {
        // Just show total responses for fill-in-the-blanks on the summary
        let fillInCount = rawVotes.filter(vDoc => vDoc.votes.some(v => v.questionId === q.id && v.selected)).length;
        summarySheet.getRow(currentRow).getCell(1).value = `    (Total vote responses: ${fillInCount})`;
        currentRow++;
      }
      currentRow++; // Blank row spacing
    });


    // ==========================================
    // SHEET 2: DETAILED HUMAN-READABLE RESPONSES
    // ==========================================
    const detailSheet = workbook.addWorksheet('Detailed Responses');

    // Dynamically create headers based on the poll questions
    const headers = [{ header: 'Timestamp', key: 'timestamp', width: 25 }];
    poll.questions.forEach(q => {
      headers.push({ header: q.text, key: q.id, width: 45 });
    });
    detailSheet.columns = headers;

    // Style the Detail Headers
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };

    // Add mapped rows
    rawVotes.forEach(voteDoc => {
      const rowData = { timestamp: new Date(voteDoc.timestamp).toLocaleString() };
      
      voteDoc.votes.forEach(v => {
        const question = poll.questions.find(q => q.id === v.questionId);
        if (!question) return;

        if (question.type === 'multipleChoice' || question.type === 'checkbox') {
          // Translate the raw IDs back into the text the user actually saw
          let selections = Array.isArray(v.selected) ? v.selected : [v.selected];
          let textAnswers = selections.map(selId => {
            const opt = question.options.find(o => o.id === selId);
            return opt ? opt.text : '(Option Removed)';
          });
          rowData[v.questionId] = textAnswers.join(', ');
        } else {
          // Fill in the blank
          rowData[v.questionId] = v.selected;
        }
      });
      detailSheet.addRow(rowData);
    });

    // Make detail text wrap nicely
    detailSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { wrapText: true, vertical: 'top' };
      });
    });

    // Clean up filename and send
    const safeFilename = poll.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}_results.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export user data (immutable)
// @route   GET /api/admin/export/users
// @access  Private/Admin
const exportUsers = async (req, res) => {
  try {
    const cursor = User.find({ role: 'voter' })
      .select('-password')
      .cursor();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');

    const csvStream = csv.format({ headers: true });

    csvStream.pipe(res);

    for await (const doc of cursor) {
      csvStream.write({
        userId: doc._id,
        email: doc.email,
        role: doc.role,
        hasVoted: doc.hasVoted,
        isScreened: doc.isScreened,
        votedPollsCount: doc.votedPolls.length,
        name: doc.profile?.name || '',
        age: doc.profile?.age || '',
        // Removed department and employeeId
        createdAt: doc.createdAt,
      });
    }

    csvStream.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMetrics,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUploadUsers,
  getPolls,
  createPoll,
  updatePoll,
  launchPoll,
  closePoll,
  deletePoll,
  exportVotes,
  exportUsers,
};
