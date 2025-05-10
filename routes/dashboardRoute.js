const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/efisiensi", dashboardController.getEfisiensi);
router.get("/effectiveness", dashboardController.getEffectiveness);
router.get("/distribusi", dashboardController.getDistribusi);
router.get("/kepuasan", dashboardController.getKepuasan);

module.exports = router;
