const db = require('../db');

// TITLE CHECKER
exports.publicationTitleChecker = (req, res) => {
  const { published_title } = req.query;
  if(!published_title) return res.status(400).json({message: 'Title Required.'});

  const query = 'SELECT COUNT(*) AS count FROM research_publications WHERE published_title = ?';

  db.query(query, [published_title], (err, result) => {
    if (err) {
      console.log('DB error: ', err);
      return res.status(500).json({message: 'Database query failed.'});
    }

    const exists = result[0].count > 0

    if (exists) return res.status(200).json({exists: true, message: 'Research Publication Title already exists!'});
    else return res.status(200).json({exists: false, message: 'Title is available'});
  });
};

// ADD RESEARCH PUBLICATION
exports.addResearchPublication = (req, res) => {
  const {department_id, published_title, pub_author, pub_co_authors, journal_title, conference_or_proceedings, publisher, start_month, end_month, year, doi, issn_isbn, volume_no, issue_no, index_type } = req.body;

  if(!department_id) return res.status(400).json({message: 'No Department ID'})
  
  const toNullable = (value) => {
    if (value === undefined || value === null) return null;

    if (typeof value === 'string' && value.trim() === '') {
      return null;
    }

    if (Array.isArray(value)) {
      const cleaned = value
        .map(v => (typeof v === 'string' ? v.trim() : v))
        .filter(v => v !== '' && v !== null && v !== undefined);

      return cleaned.length === 0 ? null : cleaned;
    }

    return value;
  };

  let date_of_publication = '';
  if (start_month === end_month) date_of_publication = `${start_month} ${year}`;
  else date_of_publication = `${start_month}-${end_month} ${year}`;

  const volume_issue = toNullable(
    volume_no && issue_no ? `Vol. ${volume_no}, Issue ${issue_no}` : null
  );

  const cleaned_co_authors = toNullable(pub_co_authors);
  const formatted_co_authors = cleaned_co_authors
    ? JSON.stringify(cleaned_co_authors)
    : null;

  const formatted_conference = toNullable(conference_or_proceedings);

  const formatted_doi = toNullable(doi);

  const formatted_index_type = Array.isArray(index_type) ? JSON.stringify(index_type) : index_type;

  const query = `
    INSERT INTO research_publications (
      department_id, published_title, pub_author, pub_co_authors,
      journal_title, conference_or_proceedings, publisher,
      date_of_publication, doi, issn_isbn, volume_issue, index_type
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.query(query, [ department_id, published_title, pub_author, formatted_co_authors, journal_title, formatted_conference, publisher, date_of_publication, formatted_doi, issn_isbn, volume_issue, formatted_index_type], (err, result) => {
    if (err) return res.status(500).json({ message: err });

    res.status(200).json({ message: "Publication added successfully!" });
  });
};

// GET PUBLICATIONS BY DEPARTMENT
exports.getResearchPublicationsByDepartment = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).json({ message: "Missing department_id" });
  }

  const query = `
    SELECT rp.*, d.department_abb
    FROM research_publications rp
    JOIN department d ON d.department_id = rp.department_id
    WHERE rp.department_id = ?
  `;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    const data = result.map(r => {
      let coAuthors = [];

      try { coAuthors = JSON.parse(r.co_authors || "[]"); } catch {}

      return {
        ...r,
        co_authors: coAuthors
      };
    });

    res.status(200).json(data);
  });
};

  // FOR FETCHING EXISTING STUFF SA PUBLICATION
  exports.getPublicationIndexes = (req, res) => {
    const searchTerm = req.query.query?.toLowerCase() || "";
    const column = req.query.column || 'index_type';

    const allowedColumns = ['published_title', 'index_type', 'pub_author', 'pub_co_authors', 'journal_title', 'conference_or_proceedings', 'publisher'];
    if(!allowedColumns.includes(column)) return res.status(400).json({message: 'Invalid column parameter.'});

    const query = `SELECT ${column} FROM research_publications WHERE ${column} IS NOT NULL AND ${column} <> ''`;

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

// DELETE PUBLICATION
exports.deleteResearchPublication = (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Missing publication ID" });

  const sql = "DELETE FROM research_publications WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Publication not found" });
    }

    res.status(200).json({ message: "Publication deleted successfully" });
  });
};
