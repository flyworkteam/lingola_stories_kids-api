const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, feedbackController.submitFeedback);

module.exports = router;
