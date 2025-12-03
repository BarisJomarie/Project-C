const e = require('express');
const db = require('../db');

// ADD RESEARCH PRESENTATION
exports.addResearchPresentation = (req, res) => {
  const {
    department_id,
    author,
    co_authors,
    research_title,
    sdg_alignment,
    conference_title,
    organizer,
    venue,
    conference_category,
    date_presented,
    end_date_presented,
    special_order_no,
    status_engage,
    funding_source_engage
  } = req.body;

  const sql = `
    INSERT INTO research_presentations (
      department_id, author, co_authors, research_title, 
      sdg_alignment, conference_title, organizer, venue, 
      conference_category, date_presented, end_date_presented, special_order_no, 
      status_engage, funding_source_engage
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.query(
    sql,
    [
      department_id,
      author,
      JSON.stringify(co_authors),
      research_title,
      JSON.stringify(sdg_alignment),
      conference_title,
      organizer,
      venue,
      conference_category,
      date_presented,
      end_date_presented,
      special_order_no,
      status_engage,
      funding_source_engage
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: err });
      res.status(200).json({ message: "Presentation added successfully!" });
    }
  );
};



exports.getResearchPresentationsByDepartment = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) return res.status(400).json({ message: "Missing department_id" });

  const query = `
    SELECT rp.*, d.department_abb
    FROM research_presentations rp
    JOIN department d ON d.department_id = rp.department_id
    WHERE rp.department_id = ?
  `;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    const data = result.map(r => {
      let coAuthors = [];
      let alignment = [];

      try { coAuthors = JSON.parse(r.co_authors || "[]"); } catch {}
      try { alignment = JSON.parse(r.sdg_alignment || "[]"); } catch {}

      return {
        ...r,
        co_authors: coAuthors,
        sdg_alignment: alignment,
        end_date_presented: r.end_date_presented
      };
    });

    res.status(200).json(data);
  });
};

// DELETE RESEARCH PRESENTATION
exports.deleteResearchPresentation = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Missing presentation ID" });

  const sql = "DELETE FROM research_presentations WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Presentation not found" });
    }
    res.status(200).json({ message: "Presentation deleted successfully" });
  });
};

