const express = require('express');
const { login, completeScreening, getMe, logout } = require('../controllers/authController');
const { protect, voter } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/screening', protect, voter, completeScreening);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
