const express = require('express');
const { getActivePolls, getPollById, submitVote } = require('../controllers/voterController');
const { protect, voter } = require('../middleware/auth');

const router = express.Router();

router.get('/polls', protect, voter, getActivePolls);
router.get('/polls/:id', protect, voter, getPollById);
router.post('/vote', protect, voter, submitVote);

module.exports = router;
