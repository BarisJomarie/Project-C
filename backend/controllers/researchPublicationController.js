const db = require('../db');

// ADD RESEARCH PUBLICATION
exports.addResearchPublication = (req, res) => {
  const {
    department_id,
    published_title,
    pub_author,
    pub_co_authors,
    journal_title,
    conference_or_proceedings,
    publisher,
    pub_date_presented,
    pub_end_date_presented,
    doi,
    issn_isbn,
    volume_issue,
    index_type
  } = req.body;

  const sql = `
    INSERT INTO research_publications (
      department_id, published_title, pub_author, pub_co_authors,
      journal_title, conference_or_proceedings, publisher,
      pub_date_presented, pub_end_date_presented, doi, issn_isbn, volume_issue, index_type
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  db.query(
    sql,
    [
      department_id,
      published_title,
      pub_author,
      JSON.stringify(pub_co_authors),
      journal_title,
      conference_or_proceedings,
      publisher,
      pub_date_presented,
      pub_end_date_presented,
      doi,
      issn_isbn,
      volume_issue,
      index_type
    ],
    (err, result) => {
      if (err) return res.status(500).json({ message: err });
      res.status(200).json({ message: "Publication added successfully!" });
    }
  );
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
