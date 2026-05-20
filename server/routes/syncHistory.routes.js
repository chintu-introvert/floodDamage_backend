const express = require('express');
const router = express.Router();
const syncHistoryController = require('../controllers/syncHistory.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Protected Sync History Endpoints
router.post('/', authenticate, syncHistoryController.createSyncHistory);
router.get('/', authenticate, syncHistoryController.getSyncHistory);

module.exports = router;
