const express = require("express");
const router = express.Router();
const {analyzeSdg, saveAIReport} = require("../controllers/aiReportController");
const verifyToken = require('../middleware/authMiddleware');

router.post("/ai-report", verifyToken, analyzeSdg);
router.post("/save-report", verifyToken , saveAIReport);

module.exports = router;
