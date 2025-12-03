const express = require("express");
const router = express.Router();
const nlpController = require("../controllers/nlpController");

router.post("/analyze-text", nlpController.analyzeText);

module.exports = router;
