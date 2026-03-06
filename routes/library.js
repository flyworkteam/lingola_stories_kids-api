const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { authenticateToken } = require('../middleware/auth');

// Note: Ensure specific paths come before parameterized paths
router.get('/popular', libraryController.getPopularWords); // Open to all (or require auth, based on preference)
router.get('/', authenticateToken, libraryController.getUserLibrary);
router.post('/save', authenticateToken, libraryController.saveWord);
router.delete('/:id', authenticateToken, libraryController.deleteWord);

module.exports = router;
