const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { summaryRateLimit } = require('../middleware/rateLimit.middleware');
const {
  createSummary,
  getHistory,
  getSummaryById,
  deleteSummary,
  chatOnSummary,
} = require('../controllers/summary.controller');

router.use(authenticate);
router.post('/', summaryRateLimit, createSummary);
router.post('/:id/chat', summaryRateLimit, chatOnSummary);
router.get('/history', getHistory);
router.get('/:id', getSummaryById);
router.delete('/:id', deleteSummary);

module.exports = router;
