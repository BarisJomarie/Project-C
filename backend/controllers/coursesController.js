const db = require('../db');

//ADD COURSE
exports.addCourse = (req, res) => {
  const { 
    department_id,
    course_name,
    course_abbreviation
  } = req.body;

  if (!department_id) {
    return res.status(400).send({ message: 'Missing department_id' });
  }

  const checker = `SELECT * FROM course WHERE course_name = ?`;
  db.query(checker, [course_name], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length > 0) {
      return res.status(400).send({ message: 'Course name already exists'});
    }

    const query = `INSERT INTO course (
      course_name,
      course_abb,
      department_id
      ) VALUES (?, ?, ?)`;

    const values = [
      course_name,
      course_abbreviation,
      department_id
    ];
    

    db.query(query, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: 'Course successfully added' });
    });
  });
};


// GET ALL COURSE ORDER BY DEPARTMENT
exports.getAllCourses = (req, res) => {
  const query = `SELECT c.*, d.department_name 
  FROM course c
  JOIN department d ON d.department_id = c.department_id
  ORDER BY c.department_id`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching courses:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'No courses found.' });
    }
    res.status(200).json(result);
  });
};

//GET ALL COURSES
exports.getCourses = (req, res) => {
  const query = `SELECT * FROM course`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'No courses found.' });
    }
    res.status(200).json(result);
  });
};

//UPDATE DEPARTMENT
exports.updateCourse = (req, res) => {
  const { 
    course_name,
    course_abb
  } = req.body;
  const { courseId } = req.params;
  const query = `
    UPDATE course SET 
      course_name = ?,
      course_abb = ?
    WHERE course_id = ?
  `;
  const values = [course_name, course_abb, courseId];

  db.query(query, values, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Course successfully updated' });
  });
};

//DELETE COURSE
exports.deleteCourse = (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM course WHERE course_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Course deleted successfully' });
  });
};

//GET DEPARTMENT COURSES
exports.getDepartmentCourses = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.'});
  }

  const query = `SELECT * FROM course WHERE department_id = ?`;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if(result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  });
};
