const express = require("express");
const router = express.Router();
const aiReportController = require("../controllers/aiReportController");



router.post("/ai-report", aiReportController.analyzeSdg);
router.post("/save-report", aiReportController.saveAIReport);


module.exports = router;
