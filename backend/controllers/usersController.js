const db = require('../db');
const path = require('path');
const fs = require('fs');



//------------------------------------------------------------USER-------------------------------------------------------------------------------------------------
//GET ALL USER
exports.getUsers = (req, res) => {
  const query = `SELECT * from users`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER INFO
exports.getUserInfo = (req, res) => {
  const { id } = req.query;

  const query = `
    SELECT 
      u.*,
      CASE WHEN u.role = 'admin' THEN NULL ELSE c.course_abb END AS course_abb,
      CASE WHEN u.role = 'admin' THEN NULL ELSE d.department_abb END AS department_abb
    FROM users u
    LEFT JOIN course c ON c.course_id = u.course
    LEFT JOIN department d ON d.department_id = u.department
    WHERE u.id = ?
  `;

  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER BASED ON ROLE
exports.getRoleUser = (req, res) => {
  const { role } = req.query

  const query = `SELECT * from users WHERE role = ?`;
  db.query(query, [role], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER BASED ON DEPARTMENT
exports.getDepartmentUser = (req, res) => {
  const { department_id } = req.query

  const query = `
    SELECT u.*, c.course_abb
    FROM users u
    JOIN course c ON c.course_id = u.course
    WHERE u.department = ?
    `;
  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER DATA
exports.getUserData = (req, res) => {
  const userId = req.user.id;

  const query = `SELECT * FROM users WHERE id = ?`;
  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(404).send({ message: 'User not found' });

    res.status(200).send(result[0]);
  });
};

//EDIT ROLE
exports.updateUserRole = (req, res) => {
  const { role, id, department, course } = req.body;
  console.log(req.body);

  // Validate role
  const validRoles = ['admin', 'faculty', 'rph'];
  if (!validRoles.includes(role)) {
    return res.status(400).send({ message: 'Invalid role' });
  }

  if (!id || isNaN(id)) {
    return res.status(400).send({ message: 'Invalid user ID' });
  }

  const query = `UPDATE users SET role = ?, department = ?, course = ? WHERE id = ?`;
  const values = [role, department, course, id];
  db.query(query, values, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Role successfully updated' });
  });
};

//EDIT USER PROFILE
exports.updateUserProfile = (req, res) => {
  const userId = req.user.id;

  const {
    firstname,
    lastname,
    middlename,
    extension,
    username,
    email,
    security_question,
    security_answer
  } = req.body;

  // Use filename from Multer if new file was uploaded
  const newProfileImg = req.file ? req.file.filename : null;

  // Step 1: Get the user's current profile image from DB
  const getUserQuery = `SELECT profile_img FROM users WHERE id = ?`;
  db.query(getUserQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).send({ message: 'Failed to fetch user.' });
    }

    if (result.length === 0) {
      return res.status(404).send({ message: 'User not found.' });
    }

    const oldProfileImg = result[0].profile_img;
    let updatedProfileImg = oldProfileImg;

    // Step 2: If a new file was uploaded, delete the old one (if not default)
    if (newProfileImg) {
      if (oldProfileImg && oldProfileImg !== 'default_profile.jpg') {
        const oldPath = path.join(__dirname, '../uploads', oldProfileImg);

        fs.unlink(oldPath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error('Error deleting old profile image:', unlinkErr);
          } else {
            console.log(`Deleted old profile image`);
          }
        });
      }

      updatedProfileImg = newProfileImg;
    }

    // Step 3: Update user info + profile image
    const updateQuery = `
      UPDATE users SET 
        firstname = ?, 
        lastname = ?, 
        middlename = ?, 
        extension = ?, 
        username = ?, 
        email = ?,
        security_question = ?, 
        security_answer = ?, 
        profile_img = ?, 
        updated_at = NOW()
      WHERE id = ?
    `;

    const values = [
      firstname,
      lastname,
      middlename,
      extension,
      username,
      email,
      security_question,
      security_answer,
      updatedProfileImg,
      userId
    ];

    db.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).send({ message: 'Failed to update profile.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ message: 'User not found or no changes made.' });
      }

      res.status(200).send({ message: 'Profile updated successfully.' });
    });
  });
};

//DELETE USER
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const { user_code, code, role } = req.query;

  const auditQuery = `INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, 'user', NOW())`;
  db.query(auditQuery, [user_code, role, `Deleted user code: ${code}`], (err, result) => {
    if (err) return res.status(500).send(err);

    const query = `DELETE FROM users WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ message: 'User deleted successfully' });
    });
  });
};

