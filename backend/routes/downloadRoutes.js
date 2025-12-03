const express = require("express");
const router = express.Router();
const downloadController = require("../controllers/downloadController");

router.get("/download-history", downloadController.downloadJSONL);

module.exports = router;
