const db = require('../db');

exports.presentationTitleChecker = (req, res) => {
  const {title} = req.query;
  if (!title) return res.status(400).json({error: 'Title Required'});

  const query = 'SELECT COUNT(*) AS count FROM research_presentations WHERE research_title = ?'

  db.query(query, [title], (err, result) => {
    if (err) return res.status(500).json({message: err});

    const exists = result[0].count > 0;

    if (exists) {
      return res.status(200).json({ exists: true, message: "Research Presentation Title already exists!" });
    } else {
      return res.status(200).json({ exists: false, message: "Title is available!" });
    }
  })
}

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

  const uploaded_by = req.user.id;

  const sql = `
    INSERT INTO research_presentations (
      department_id, author, co_authors, research_title, 
      sdg_alignment, conference_title, organizer, venue, 
      conference_category, date_presented, end_date_presented, special_order_no, 
      status_engage, funding_source_engage, uploaded_by
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      funding_source_engage,
      uploaded_by
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: err });
      res.status(200).json({ message: "Presentation added successfully!" });
    }
  );
};


// GET ALL PRESENTATION IN A DEPARTMENT
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

// GET CURRENTLY UPLOADED OF THE USER
exports.getCurrentUploadedPresentationUser = (req, res) => {
  const user_id = req.user.id;

  if (!user_id) return res.status(400).json({message: 'Missing User ID'});

  const query = `
    SELECT rp.*, d.department_name
    FROM research_presentations rp
    JOIN department d ON d.department_id = rp.department_id
    WHERE rp.uploaded_by = ?
    AND rp.created_at >= DATE_SUB(CURDATE(), INTERVAL 8 HOUR)
    ORDER BY rp.created_at DESC;
  `;

  db.query(query, [user_id], (err, result) => {
    if (err) return res.status(500).json({message: err.message});

    const cleanData = result.map(row => ({
      ...row,
      co_authors: JSON.parse(row.co_authors || '[]'),
      sdg_alignment: JSON.parse(row.sdg_alignment || '[]'),
    }));

    res.status(200).json(cleanData);
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

