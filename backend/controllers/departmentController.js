const db = require('../db');
const { logAudit } = require('./auditsController');

//ADD DEPARTMENT
exports.addDepartment = (req, res) => {
  const { department_name, department_abb } = req.body;

  const query = `INSERT INTO department (department_name, department_abb) VALUES (?, ?)`;
  db.query(query, [department_name, department_abb], (err, result) => {
    if (err) return res.status(500).send({ message: 'Failed to add department' });

    res.status(201).send({ message: 'Department successfully added' });

    logAudit( req.user.user_code, req.user.role, `Department ${department_name} (${department_abb}) added`, 'user' )
    .then(auditId => console.log(auditId))
    .catch(err => console.error('Audit log error: ', err));
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
    return res.status(400).json({ message: 'Department ID is required.'});
  }

  const query = `SELECT * FROM department WHERE department_id = ?`;

  db.query(query, [department_id], (err, result) => {
    if (err) {
      console.log('DB error: ', err);
      return res.status(500).json({message: 'Database query failed.'});
    }
    if(result.length === 0) return res.status(404).json({message: 'Department not found.'});

    res.status(200).json(result[0]);
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

  const beforeQuery = 'SELECT * FROM department WHERE department_id = ?'

  db.query(beforeQuery, [deptId], (err, result) => {
    if (err) return res.status(500).json({message: 'Database Error', error: err});
    if (result.length === 0) return res.status(404).json({message: 'Department not found'});

    const old_name = result[0].department_name;
    const old_abb = result[0].department_abb;

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

      logAudit( req.user.user_code, req.user.role, `Updated department: ${old_name} (${old_abb}) -> ${department_name} (${department_abb})`, 'user' )
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err));
    });
  });
};

//DELETE DEPARTMENT
exports.deleteDepartment = (req, res) => {
  const { deptId } = req.params;

  const beforeQuery = 'SELECT * FROM department WHERE department_id = ?';
  db.query(beforeQuery, [deptId], (err, result) => {
    if (err) return res.status(500).json({message: 'Database Error', error: err});
    if (result.length === 0) return res.status(404).json({message: 'Department not found'});

    const old_name = result[0].department_name;
    const old_abb = result[0].department_abb;

    const query = `DELETE FROM department WHERE department_id = ?`;
    db.query(query, [deptId], (err, result) => {
      if (err) return res.status(500).send(err);

      res.status(200).send({ message: 'Department deleted successfully' });

      logAudit( req.user.user_code, req.user.role, `Department ${old_name} (${old_abb}) deleted`, 'user')
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err));
    });
  });
};