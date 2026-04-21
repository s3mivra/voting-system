const express = require('express');
const multer = require('multer');
const path = require('path');
const {
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
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Configure multer for CSV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `users-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// Metrics
router.get('/metrics', protect, admin, getMetrics);

// User management
router.get('/users', protect, admin, getUsers);
router.post('/users', protect, admin, createUser);
router.put('/users/:id', protect, admin, updateUser);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/users/bulk-upload', protect, admin, upload.single('file'), bulkUploadUsers);

// Poll management
router.get('/polls', protect, admin, getPolls);
router.post('/polls', protect, admin, createPoll);
router.put('/polls/:id', protect, admin, updatePoll);
router.post('/polls/:id/launch', protect, admin, launchPoll);
router.post('/polls/:id/close', protect, admin, closePoll);
router.delete('/polls/:id', protect, admin, deletePoll);

// Data export
router.get('/export/votes', protect, admin, exportVotes);
router.get('/export/users', protect, admin, exportUsers);

module.exports = router;
