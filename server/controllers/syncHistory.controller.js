const SyncHistory = require('../models/syncHistory.model');

/**
 * @desc    Record a new sync history log
 * @route   POST /api/sync-history
 * @access  Private (authenticated)
 */
exports.createSyncHistory = async (req, res) => {
  const { successful, failed, total } = req.body;

  if (successful === undefined || failed === undefined || total === undefined) {
    return res.status(400).json({ error: 'Please provide successful, failed, and total counts.' });
  }

  try {
    const log = await SyncHistory.create({
      successful,
      failed,
      total,
      userId: req.user.id // Associated logged-in user from authenticate middleware
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error('Error creating sync history log:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

/**
 * @desc    Get top 5 recent sync logs for the logged-in user
 * @route   GET /api/sync-history
 * @access  Private (authenticated)
 */
exports.getSyncHistory = async (req, res) => {
  try {
    const history = await SyncHistory.findAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']],
      limit: 5
    });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching sync history logs:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};
