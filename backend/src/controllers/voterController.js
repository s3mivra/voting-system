const Poll = require('../models/Poll');
const VoterReceipt = require('../models/VoterReceipt');
const CastVote = require('../models/CastVote');
const User = require('../models/User');

// @desc    Get active polls for voting
// @route   GET /api/voter/polls
// @access  Private/Voter
const getActivePolls = async (req, res) => {
  try {
    const polls = await Poll.find({ status: 'active' });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get poll by ID
// @route   GET /api/voter/polls/:id
// @access  Private/Voter
const getPollById = async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ message: 'Poll is not active' });
    }

    // Check if user has already voted
    const receipt = await VoterReceipt.findOne({
      userId: req.user._id,
      pollId: poll._id,
    });

    res.json({
      poll,
      hasVoted: !!receipt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit vote (uses MongoDB transaction)
// @route   POST /api/voter/vote
// @access  Private/Voter
const submitVote = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const { pollId, votes } = req.body;

    if (!pollId || !votes || !Array.isArray(votes)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Invalid vote data' });
    }

    const poll = await Poll.findById(pollId).session(session);

    if (!poll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Poll is not active' });
    }

    const user = await User.findById(req.user._id).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isScreened) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User must complete screening first' });
    }

    // FIX 1: Check the new array instead of the boolean
    // We convert both to strings safely to ensure a perfect match
    const hasVotedInThisPoll = user.votedPolls.some(
      (pId) => pId.toString() === poll._id.toString()
    );

    if (hasVotedInThisPoll) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User has already voted in this poll' });
    }

    // Create voter receipt (will fail if duplicate due to unique index)
    const receipt = await VoterReceipt.create([{
      userId: user._id,
      pollId: poll._id,
    }], { session });

    // Create cast vote (completely isolated from user ID)
    const castVote = await CastVote.create([{
      pollId: poll._id,
      votes: votes,
    }], { session });

    // FIX 2: Push the specific poll ID into the array instead of setting a boolean
    user.votedPolls.push(poll._id);
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Vote submitted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already voted in this poll' });
    }

    res.status(500).json({ message: error.message });
  }
};
module.exports = {
  getActivePolls,
  getPollById,
  submitVote,
};
