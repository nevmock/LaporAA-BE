// routes/fileOrganizationRoutes.js
const express = require('express');
const router = express.Router();
const fileOrganizationController = require('../controllers/fileOrganizationController');

// POST /api/file-organization/organize - Analyze and organize files
router.post('/organize', fileOrganizationController.analyzeAndOrganizeFiles);

// GET /api/file-organization/stats - Get organization statistics
router.get('/stats', fileOrganizationController.getOrganizationStats);

// GET /api/file-organization/verify - Verify file integrity
router.get('/verify', fileOrganizationController.verifyFileIntegrity);

module.exports = router;
