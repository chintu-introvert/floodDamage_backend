const express = require('express');
const router = express.Router();
const multer = require('multer');
const assessmentController = require('../controllers/assessment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const upload = multer();

router.post('/', authenticate, upload.none(), assessmentController.createOrUpdate);
router.get('/', authenticate, assessmentController.getAll);
router.get('/:id', authenticate, assessmentController.getById);
router.get('/export/csv', authenticate, assessmentController.exportCsv);

module.exports = router;
