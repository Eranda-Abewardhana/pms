const express = require('express');
const { getConfig, updateConfig } = require('../controllers/systemConfigController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getConfig)
  .put(updateConfig);

module.exports = router;
