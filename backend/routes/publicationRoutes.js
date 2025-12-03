const express = require("express");
const router = express.Router();
const controller = require("../controllers/researchPublicationController");

// GET /api/publication?department_id=#
router.get("/", controller.getResearchPublicationsByDepartment);

// POST /api/publication/add
router.post("/add/pub", controller.addResearchPublication);

// DELETE /api/publication/delete/:id
router.delete("/delete/:id", controller.deleteResearchPublication);

module.exports = router;
