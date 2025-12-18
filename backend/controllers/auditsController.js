const db = require('../db');

//ADD AUDIT LOGS (TINATAWAG TO SA IBANG BACKEND CONTROLLERS) HELPER
exports.logAudit = (user_code, user_role, action, actor_type) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, ?, NOW())`;
    db.query(query, [user_code, user_role, action, actor_type], (err, result) => {
      if (err) {
        console.error("Audit log error:", err);
        return reject(new Error("Failed to insert audit log"));
      }
      resolve(result.insertId);
    });
  });
};

//GET ALL AUDIT LOGS
exports.getAllAuditLogs = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = req.query.limit === "All" ? 0 : parseInt(req.query.limit) || 25;
  const offset = (page - 1) * limit;

  // First, get the total row count
  db.query('SELECT COUNT(*) AS total FROM audit_log', (err, countRes) => {
    if (err) return res.status(500).send(err);

    const totalRows = countRes[0].total;
    const totalPages = limit > 0 ? Math.ceil(totalRows / limit) : 1;

    // Then, get the paginated data
    let query = `SELECT * FROM audit_log ORDER BY timestamp DESC`;
    if (limit > 0) {
      query += ` LIMIT ? OFFSET ?`;
      db.query(query, [limit, offset], (err, results) => {
        if (err) return res.status(500).send(err);

        res.status(200).send({
          data: results,
          totalRows,
          totalPages,
          currentPage: page
        });
      });
    } else {
      // If limit = 0 (All), return everything
      db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);

        res.status(200).send({
          data: results,
          totalRows,
          totalPages: 1,
          currentPage: 1
        });
      });
    }
  });
};

//GE AUDIT LOGS 25MAX
exports.getAuditLogs = (req, res) => {
  const query = `SELECT * from audit_log ORDER BY timestamp DESC LIMIT 25`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER AUDIT LOGS
exports.getUserAuditLogs = (req, res) => {
  const user_code  = req.params.user_code;

  if (!user_code) {
    return res.status(400).send({ message: 'USER CODE is required.'});
  }

  const query = `
    SELECT a.id, a.action, a.timestamp
    FROM audit_log a
    WHERE a.user_code = ? 
    ORDER BY a.timestamp DESC
  `;

  db.query(query, [user_code], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  });
};

//DELETE
exports.deleteLogs = (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).send({ message: 'No logs selected for deletion' });
  }

  const query = `DELETE FROM audit_log WHERE id IN (?)`;
  db.query(query, [ids], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Logs deleted successfully' });
  });
};
