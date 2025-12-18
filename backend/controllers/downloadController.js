const pool = require('../db');
const { logAudit } = require('./auditsController');
//------------------------------------------------------------FILE DOWNLOAD-------------------------------------------------------------------------------------------------

exports.downloadJSONL = (req, res) => {
  const query = `
    SELECT *
    FROM history_report
    WHERE feedback_rating > 2
  `;

  pool.query(query, (err, rows) => {  // callback version
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }

    const jsonlData = rows
      .map(row => {
        const inputData = {
          academic_year: row.academic_year,
          department: row.department,
          created_by: row.created_by,
          created_at: row.created_at,
          student_papers: row.student_papers,
          faculty_papers: row.faculty_papers,
          sdg_summary: row.sdg_summary,
          recommendations: row.recommendations,
          model_used: row.model_used
        };

        return JSON.stringify({
          input: inputData,
          output: row.gemini_output,
          feedback_rating: row.feedback_rating
        });
      })
      .join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename=history_report.jsonl');
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonlData);
    
    logAudit(req.user.user_code, req.user.role, "Downloaded JSONL report", "user")
      .then(auditId => console.log(auditId))
      .catch(err => console.error("Audit log error:", err));
  });
};

