const express = require("express");
const router = express.Router();
const controller = require("../controllers/researchPresentationController");
const verifyToken = require('../middleware/authMiddleware');

// TITLE CHECKER /api/research-presentation/title-checker
router.get('/title-checker', verifyToken, controller.presentationTitleChecker);
// GET /api/research-presentation?department_id=#
router.get("/", verifyToken, controller.getResearchPresentationsByDepartment);
// GET /api/research-presentation?user_id=#
router.get('/user', verifyToken, controller.getCurrentUploadedPresentationUser);
// POST /api/research-presentation/add
router.post("/add", verifyToken, controller.addResearchPresentation);
// DELETE /api/research-presentation/delete/:id
router.delete("/delete/:id", verifyToken, controller.deleteResearchPresentation);


module.exports = router;
