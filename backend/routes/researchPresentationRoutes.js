const express = require("express");
const router = express.Router();
const controller = require("../controllers/researchPresentationController");

// GET /api/research-presentation?department_id=#
router.get("/", controller.getResearchPresentationsByDepartment);
// POST /api/research-presentation/add
router.post("/add", controller.addResearchPresentation);
// DELETE /api/research-presentation/delete/:id
router.delete("/delete/:id", controller.deleteResearchPresentation);


module.exports = router;
