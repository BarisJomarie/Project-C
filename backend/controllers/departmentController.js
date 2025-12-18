const db = require('../db');

//ADD DEPARTMENT
exports.addDepartment = (req, res) => {
  const { department_name, department_abb, user_code, role } = req.body;

  const query = `INSERT INTO department (department_name, department_abb) VALUES (?, ?)`;
  db.query(query, [department_name, department_abb], (err, result) => {
    if (err) {
      console.error('Failed to add department:', err);
      return res.status(500).send({ message: 'Failed to add department' });
    }

    const auditQuery = `INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, 'user', NOW())`;
    db.query(auditQuery, [user_code, role, `Added a new department: ${department_name}`], (auditErr) => {
      if (auditErr) {
        console.error('Failed to log audit:', auditErr);
        return res.status(500).send({ message: 'Department added but failed to log audit' });
      }

      res.status(201).send({ message: 'Department successfully added' });
    });
  });
};

//GET ALL DEPARTMENTS
exports.getDepartments = (req, res) => {
  const query = `SELECT * FROM department`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'No departments found.' });
    }
    res.status(200).json(result);
  });
};


//GET DEPARTMENT INFO
exports.getDepartmentInfo = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.'});
  }

  const query = `SELECT * FROM department WHERE department_id = ?`;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if(result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  });
};

//GET SPECIFIC DEPARTMENT
exports.getSingleDepartments = (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM department WHERE department_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (!result || result.length === 0) {
      return res.status(404).send({ message: 'Department not found.' });
    }
    res.status(200).send(result[0]);
  });
};

//UPDATE DEPARTMENT
exports.updateDepartment = (req, res) => {
  const { 
    department_name,
    department_abb
  } = req.body;
  const { deptId } = req.params;
  const query = `
    UPDATE department SET 
      department_name = ?,
      department_abb = ?
    WHERE department_id = ?
  `;
  const values = [department_name, department_abb, deptId];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Department successfully updated' });
  });
};

//DELETE DEPARTMENT
exports.deleteDepartment = (req, res) => {
  const { deptId } = req.params;
  const { user_code, role, department_name } = req.body;

  const query = `DELETE FROM department WHERE department_id = ?`;
  db.query(query, [deptId], (err, result) => {
    if (err) return res.status(500).send(err);

    const auditQuery = `
      INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp)
      VALUES (?, ?, ?, 'user', NOW())
    `;
    const action = `Deleted department name: ${department_name}`;
    db.query(auditQuery, [user_code, role, action], (auditErr) => {
      if (auditErr) console.error('Failed to log audit:', auditErr);
      // Return success regardless of audit log failure
      res.status(200).send({ message: 'Department deleted successfully' });
    });
  });
};