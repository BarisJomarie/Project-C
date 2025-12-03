const fs = require("fs");
const path = require("path");
const db = require("../db");


//------------------------------------------------------------AI INTEGRATION REPORT-------------------------------------------------------------------------------------------------
exports.analyzeSdg = async (req, res) => {
  try {
    const { sdgData } = req.body;

    if (!sdgData || !sdgData.year || !Array.isArray(sdgData.departments) || sdgData.departments.length === 0) {
      return res.status(400).json({ error: "Invalid input. 'year' and at least one department are required." });
    }

    // Call FastAPI microservice
    const response = await fetch(`${process.env.ML_API_URL}/analyze-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: JSON.stringify(sdgData) })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ML Service Error: ${response.status} - ${text}`);
    }

    const result = await response.json();
    res.json({ analysis: result.analysis, model_used: result.model_used });

  } catch (err) {
    console.error("AI analysis error:", err);
    res.status(500).json({ error: "AI analysis failed", details: err.message });
  }
};


//------------------------------------------------------------SAVE AI INTEGRATION REPORT-------------------------------------------------------------------------------------------------

exports.saveAIReport = async (req, res) => {
  try {
    const {
      academic_year,
      department,
      created_by,
      student_papers,
      faculty_papers,
      sdg_summary,
      recommendations,
      gemini_output,
      model_used,
      feedback_rating,
    } = req.body;

    if (!academic_year || !department || !created_by) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const query = `
      INSERT INTO history_report
      (academic_year, department, created_by, created_at, student_papers, faculty_papers, sdg_summary, recommendations, gemini_output, model_used, feedback_rating)
      VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      academic_year,
      department,
      created_by,
      JSON.stringify(student_papers),
      JSON.stringify(faculty_papers),
      JSON.stringify(sdg_summary),
      recommendations,
      gemini_output,
      model_used,
      feedback_rating,
    ], (err, result) => {
      if (err) return res.status(500).json({ message: 'Database error.', error: err });
      res.status(200).json({ message: 'AI report saved successfully.' });
      });
  } catch (err) {
    console.error('Error saving AI report:', err);
    res.status(500).json({ message: 'Failed to save AI report', error: err.message });
  }
};
