const db = require('../db');
const { logAudit } = require('./auditsController');

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

      logAudit( req.user.user_code, req.user.role, `Added Research Presentation: ${research_title}`, 'user' )
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err));
    }
  );
};


// GET ALL PRESENTATION IN A DEPARTMENT
exports.getResearchPresentationsByDepartment = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) return res.status(400).json({ message: "Missing department_id" });

  const query = `
    SELECT rp.*, d.department_abb, d.department_name
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

// FOR FETCHING EXISTING STUFF SA PRESENTATION
exports.getPresentationIndexes = (req, res) => {
  const searchTerm = req.query.query?.toLowerCase() || "";
  const column = req.query.column || 'author';

  const allowedColumns = ['author', 'co_authors', 'research_title', 'sdg_alignment', 'conference_title', 'organizer', 'venue', 'conference_category', 'special_order_no', 'status_engage', 'funding_source_engage'];
  if(!allowedColumns.includes(column)) return res.status(400).json({message: 'Invalid column parameter.'});

  const query = `SELECT ${column} FROM research_presentations WHERE ${column} IS NOT NULL AND ${column} <> ''`;

  db.query(query, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database query error' });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: 'No indexes found.' });
    }

    const allValues = result.flatMap(row => {
      try {
        return JSON.parse(row[column]); //if column is jason
      } catch {
        return row[column] ? [row[column]] : [];
      }
    });

    const filtered = searchTerm
      ? allValues.filter(type => type.toLowerCase().includes(searchTerm))
      : allValues;


    const normalizeJson = [...new Set(filtered)].sort((a, b) => a.localeCompare(b)).map(type => ({
      value: type,
      label: type
    }));

    res.status(200).json(normalizeJson);
  });
};

//FILTERED TABLE
exports.getPresentationRows = (req, res) => {
  const column = req.query.column || "author";
  const searchTerm = req.query.query?.toLowerCase() || "";


  const allowedColumns = [
    "author",
    "co_authors",
    "research_title",
    "sdg_alignment",
    "conference_title",
    "organizer",
    "venue",
    "conference_category",
    "special_order_no",
    "status_engage",
    "funding_source_engage"
  ];
  if (!allowedColumns.includes(column)) {
    return res.status(400).json({ message: "Invalid column parameter." });
  }

  const sql = `
    SELECT * 
    FROM research_presentations 
    WHERE ${column} IS NOT NULL 
      AND ${column} <> '' 
      AND LOWER(${column}) LIKE ?
  `;
  const values = [`%${searchTerm}%`];

  db.query(sql, values, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });

    const data = results.map(r => {
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

    res.json(data);
  });
};


// DELETE RESEARCH PRESENTATION
exports.deleteResearchPresentation = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Missing presentation ID" });

  const beforeQuery = 'SELECT * FROM research_presentations WHERE id = ?';

  db.query(beforeQuery, [id], (err, result) => {
    if (err) return res.status(500).json({message: 'Database Error', error: err});
    if (result.length === 0) return res.status(404).json({message: 'Research Presentations not found'});

    const title = result[0].research_title;

    const query = "DELETE FROM research_presentations WHERE id = ?";

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      if (result.length === 0) return res.status(404).json({ message:"Research Presentation cannot be deleted"});

      res.status(200).json({message: "Presentation deleted successfully"});
      logAudit( req.user.user_code, req.user.role, `Deleted Research Presentation: ${title}`, 'user')
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err));
    });
  });
};

