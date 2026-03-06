const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');


// Home screen endpoints
router.get('/continue-reading', authenticateToken, storyController.getContinueReading);
router.get('/history', authenticateToken, storyController.getReadingHistory);
router.get('/recommended', storyController.getRecommended);

// Story list and details
router.get('/', storyController.getAllStories);
router.get('/:id', storyController.getStoryDetails);
router.get('/:id/sections', storyController.getStorySections);

// User progress and rating
router.get('/:id/progress', authenticateToken, storyController.getStoryProgress);
router.post('/:id/update-progress', authenticateToken, storyController.updateStoryProgress);
router.post('/:id/rate', authenticateToken, storyController.rateStory);

module.exports = router;
