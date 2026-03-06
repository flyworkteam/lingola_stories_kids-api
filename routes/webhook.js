const express = require('express');
const router = express.Router();
const revenueCatController = require('../controllers/revenueCatController');

// RevenueCat Webhook Endpoint
// POST /api/webhooks/revenuecat
router.post('/revenuecat', revenueCatController.handleWebhook);

//N8n Webhook Endpoint
// POST /api/webhooks/n8n
router.post('/n8n', n8nController.createStoryFromWebhook);

module.exports = router;
