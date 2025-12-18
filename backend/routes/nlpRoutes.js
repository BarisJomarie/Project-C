const express = require("express");
const router = express.Router();
const {analyzeText} = require("../controllers/nlpController");
const verifyToken = require('../middleware/authMiddleware');

router.post("/analyze-text", verifyToken, analyzeText);

module.exports = router;
