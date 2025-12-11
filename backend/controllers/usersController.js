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
  const { role, id } = req.body;

  // Validate role
  const validRoles = ['admin', 'faculty', 'rph'];
  if (!validRoles.includes(role)) {
    return res.status(400).send({ message: 'Invalid role' });
  }

  if (!id || isNaN(id)) {
    return res.status(400).send({ message: 'Invalid user ID' });
  }

  const query = `UPDATE users SET role = ? WHERE id = ?`;
  const values = [role, id];
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



//------------------------------------------------------------ADVISER-------------------------------------------------------------------------------------------------
  //ADD ADVISER
  exports.addDepartmentAdviser = (req, res) => {
    const { faculty_id, department_id, course_id } = req.body;

    if (!department_id || !faculty_id || !course_id) {
      return res.status(400).send({ message: 'Missing details' });
    }

    const checker = `SELECT * FROM adviser WHERE user_id = ?`;

    db.query(checker, [faculty_id, course_id], async (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.length > 0) {
        return res.status(400).send({ message: 'Adviser already exists'});
      }

      const query = `INSERT INTO adviser (user_id, department_id, course_id) VALUES (?, ?, ?)`;
      db.query(query, [faculty_id, department_id, course_id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(201).send({ message: 'Adviser successfully added' });
      });
    });
  }

  //GET ADVISER
  exports.getDepartmentAdviser = (req, res) => {
    const { department_id } = req.query;

    if (!department_id) {
      return res.status(400).send({ message: 'Department ID required'});
    }

    const query = `
      SELECT a.adviser_id, a.user_id, u.lastname, u.firstname, u.middlename, u.extension, d.department_abb, c.course_abb
      FROM adviser a
      JOIN users u ON a.user_id = u.id
      JOIN department d ON a.department_id = d.department_id
      JOIN course c ON a.course_id = c.course_id
      WHERE a.department_id = ?
      ORDER BY u.lastname ASC
    `;

    db.query(query, [department_id], (err, result) => {
      if (err) return res.status(500).send(err);
      if(result.length === 0) return res.status(200).send([]);

      res.status(200).send(result);
    })
  }

  //UPDATE ADVISER
  exports.updateDepartmentAdviser = (req, res) => {
    const { 
      adviser_code, 
      adviser_lastname, 
      adviser_firstname, 
      adviser_middlename, 
      adviser_extension 
    } = req.body;
    const { id } = req.params;

    const checker = `SELECT * FROM adviser WHERE adviser_code = ? AND adviser_id != ?`;
    db.query(checker, [adviser_code, id], async (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.length > 0) {
        return res.status(400).send({ message: 'Adviser code already exists'});
      }

      const query = `
        UPDATE adviser SET adviser_code = ?, 
        adviser_lastname = ?, 
        adviser_firstname = ?,
        adviser_middlename = ?,
        adviser_extension = ?,
        updated_at = NOW()
        where adviser_id = ?
        `;
      
      const values = [
        adviser_code,
        adviser_lastname,
        adviser_firstname,
        adviser_middlename,
        adviser_extension,
        id
      ];
      
      db.query(query, values, (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows === 0) return res.status(404).send({ message: 'Adviser not found or unchanged' });

        res.status(200).send({ message: 'Document updated' });
      });
    });
  }

  //DELETE ADVISER
  exports.deleteDepartmentAdviser = (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM adviser WHERE adviser_id = ?';
    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0) {
        return res.status(404).send({ message: 'Adviser not found or already deleted' });
      }
      res.status(200).send({ message: 'Adviser deleted' });
    });
  }


//------------------------------------------------------------RESEARCHER-------------------------------------------------------------------------------------------------
//ADD RESEARCHER
exports.addDepartmentResearcher = (req, res) => {
  const { student_id, department_id, course_id } = req.body;

  if (!department_id || !student_id || !course_id) {
    return res.status(400).send({ message: 'Missing details' });
  }

  const checker = `SELECT * FROM researchers WHERE user_id = ?`;
  db.query(checker, [student_id], async (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length > 0) {
      return res.status(400).send({ message: 'Researcher already exists'});
    }



    const query = `INSERT INTO researchers (user_id, department_id, course_id) VALUES (?, ?, ?)`;
    db.query(query, [student_id, department_id, course_id], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: 'Adviser successfully added' });
    });
  });
}

//GET RESEARCHERS
exports.getDepartmentResearcher = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID required'});
  }

  const query = `
    SELECT r.researcher_id, r.user_id, u.lastname, u.firstname, u.middlename, u.extension, d.department_abb, c.course_abb
    FROM researchers r
    JOIN users u ON r.user_id = u.id
    JOIN department d ON r.department_id = d.department_id
    JOIN course c ON r.course_id = c.course_id
    WHERE r.department_id = ?
    ORDER BY u.lastname ASC
  `;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if(result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  })
}

//DELETE
exports.deleteDepartmentResearcher = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM researchers WHERE researcher_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: 'Researcher not found or already deleted' });
    }
    res.status(200).send({ message: 'Researcher deleted' });
  });
}



//------------------------------------------------------------DEPARTMENT-------------------------------------------------------------------------------------------------
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

//GET DEPARTMENT
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

//GET DEPARTMENTS 2
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



//------------------------------------------------------------COURSES-------------------------------------------------------------------------------------------------
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
}

//GET COURSE
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

//DELETE COURSE
exports.deleteCourse = (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM course WHERE course_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Course deleted successfully' });
  });
};

//GET ADVISER COURSE
exports.getAdviserCourses = (req, res) => {
  const { adviser_id } = req.query;

  if (!adviser_id) {
    return res.status(400).send({ message: 'Adviser id is required.'});
  }

  const query = `
    SELECT c.course_id, c.course_name, c.course_abb
    FROM adviser a
    JOIN course c ON a.course_id = c.course_id
    WHERE a.adviser_id = ?
    `;

  db.query(query, [adviser_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if(result.length === 0) return res.status(404).send({ message: 'No course found for this adviser'});

    res.status(200).send(result);
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



//------------------------------------------------------------RESEARCH PAPER-------------------------------------------------------------------------------------------------
//ADD PAPER
exports.addResearch = (req, res) => {
  const { user_id, research_type, semester, sy, funding_source, title, abstract, conclusion, adviser, researchers, department, course, sdg_number, sdg_label, confidence_scores, status, user_code, role } = req.body;

  // console.log(req.body);
  const checker = `SELECT * FROM research_paper WHERE research_title = ?`;
  db.query(checker, [title], (err, result) => {
    if (err) return res.status(500).send({ message: 'Database error', err });
    if (result.length > 0) {
      return res.status(400).send({ message: 'Paper already exists' });
    }

    const query = `
      INSERT INTO research_paper ( research_type, semester, academic_year, funding_source, research_title, research_abstract, research_conclusion, adviser, researchers, department_id, course_id, sdg_number, sdg_labels, confidence_scores, status, created_at, uploaded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;

    const values = [ research_type, semester, sy, funding_source, title, abstract, conclusion, adviser, JSON.stringify(researchers), department, course, JSON.stringify(sdg_number), JSON.stringify(sdg_label), JSON.stringify(confidence_scores), status, user_id ];
    db.query(query, values, (err, result) => {
      if (err) return res.status(500).send(err);

      const auditQuery = `INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, 'user', NOW())`
      db.query(auditQuery, [user_code, role, `Research Paper has been added. title: ${title}`], (err, result) => {
        if (err) return res.status(500).send({ message: 'Database error', err });

        res.status(201).send({ message: 'Paper added successfully' });
      })
    });
  });
};

//GET SPECIFIC PAPER
exports.getSinglePaper = (req, res) => {
  const { paper_id } = req.params;
  const query = `SELECT rp.*, CONCAT(uploader_user.firstname, ' ', uploader_user.lastname) AS uploader_name
    FROM research_paper rp
    JOIN users uploader_user ON rp.uploaded_by = uploader_user.id
    WHERE rp.research_id = ?
  `;
  db.query(query, [paper_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (!result || result.length === 0) {
      return res.status(404).send({ message: 'Department not found.' });
    }
    res.status(200).send(result[0]);
  });
};

//DEPARTMENT FILTERED PAPER (student)
exports.getDepartmentPapers = (req, res) => {
  const { department_id, type } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.'});
  }

  // console.log(department_id, type);

const query = `
  SELECT 
    p.*,
    d.department_name,
    c.course_abb
  FROM research_paper p
  JOIN department d ON p.department_id = d.department_id
  JOIN course c ON p.course_id = c.course_id
  WHERE p.department_id = ? AND p.research_type = ?
  ORDER BY p.created_at DESC
`;

  db.query(query, [department_id, type], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send([]);

    const formattedResult = result.map(row => ({
      ...row,
      researchers: JSON.parse(row.researchers || '[]'),
      sdg_labels: JSON.parse(row.sdg_labels || '[]')
    }));

    res.status(200).send(formattedResult);
  });
};

//DEPARTMENT FILTERED PAPER (faculty)
exports.getDepartmentPapersFaculty = (req, res) => {
  const { department_id, type } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.'});
  }

  // console.log(department_id, type);

const query = `
  SELECT 
    p.*,
    d.department_name
  FROM research_paper p
  JOIN department d ON p.department_id = d.department_id
  WHERE p.department_id = ? AND p.research_type = ?
  ORDER BY p.created_at DESC
`;

  db.query(query, [department_id, type], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send([]);

    const formattedResult = result.map(row => ({
      ...row,
      researchers: JSON.parse(row.researchers || '[]'),
      sdg_labels: JSON.parse(row.sdg_labels || '[]')
    }));

    res.status(200).send(formattedResult);
  });
};


//ADVISORY FILTERED PAPER
// exports.getAdvisoryPaper = (req, res) => {
//   const userId  = req.params.id;

//   if (!userId) {
//     return res.status(400).send({ message: 'USER CODE is required.'});
//   }

//   const query = `
//     SELECT rp.*, d.department_abb, c.course_abb, CONCAT(u.lastname, ', ', u.firstname) as uploader_name
//     FROM adviser a
//     JOIN research_paper rp ON a.adviser_id = rp.adviser_id
//     JOIN department d ON a.department_id = d.department_id
//     JOIN course c ON a.course_id = c.course_id
//     JOIN users u ON rp.uploaded_by = u.id
//     WHERE a.user_id = ? 
//     ORDER BY rp.created_at DESC
//   `;

//   db.query(query, [userId], (err, result) => {
//     if (err) return res.status(500).send(err);
//     if (result.length === 0) return res.status(200).send([]);

//     res.status(200).send(result);
//   });
// };

//GET UPLOADERS PAPER
exports.getUserPapers = (req, res) => {
  const userId  = req.params.id;

  if (!userId) {
    return res.status(400).send({ message: 'USER ID is required.'});
  }

  const query = `SELECT *
    FROM research_paper
    WHERE uploaded_by = ?
    ORDER BY created_at DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  });
};

//DELETE
exports.deleteResearchPaper = (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM research_paper WHERE research_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Paper deleted successfully' });
  });
};

//GET RESEARCH PAPERS TYPE = STUDENT
exports.getStudentTypePapers = (req, res) => {
  const { year, dep_id } = req.query;

  const query = `
    SELECT 
      p.*,
      c.course_name
    FROM research_paper p
    JOIN course c ON p.course_id = c.course_id
    WHERE p.research_type = 'student' 
      AND p.academic_year = ? 
      AND p.department_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(query, [year, dep_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send({});

    const safeParse = (value) => {
      if (Array.isArray(value)) return value; // already parsed
      if (typeof value === 'object' && value !== null) return value; // already object
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [value]; // treat plain string as array
        }
      }
      return [];
    };

    const formattedResult = result.map(row => ({
      ...row,
      researchers: safeParse(row.researchers),
      sdg_labels: safeParse(row.sdg_labels),
      sdg_number: safeParse(row.sdg_number)
    }));

    // Group by course abbreviation
    const groupedByCourse = formattedResult.reduce((acc, row) => {
      const course = row.course_name;
      if (!acc[course]) acc[course] = [];
      acc[course].push(row);
      return acc;
    }, {});

    res.status(200).send(groupedByCourse);
  });
};


// GET RESEARCH PAPERS TYPE = FACULTY
exports.getFacultyTypePapers = (req, res) => {
  const { year, dep_id } = req.query;

  const query = `
    SELECT 
      p.*,
      c.course_name
    FROM research_paper p
    JOIN course c ON p.course_id = c.course_id
    WHERE p.research_type = 'faculty' 
      AND p.academic_year = ? 
      AND p.department_id = ?
    ORDER BY p.created_at DESC
  `;

  db.query(query, [year, dep_id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send({});

    const safeParse = (value) => {
      if (Array.isArray(value)) return value; // already parsed
      if (typeof value === 'object' && value !== null) return value; // already object
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [value]; // treat plain string as array
        }
      }
      return [];
    };

    const formattedResult = result.map(row => ({
      ...row,
      researchers: safeParse(row.researchers),
      sdg_labels: safeParse(row.sdg_labels),
      sdg_number: safeParse(row.sdg_number)
    }));

    // Group by course abbreviation
    const groupedByCourse = formattedResult.reduce((acc, row) => {
      const course = row.course_name;
      if (!acc[course]) acc[course] = [];
      acc[course].push(row);
      return acc;
    }, {});

    res.status(200).send(groupedByCourse);
  });
};

// I CHANGED HERE 18/11/2025
// GET FACULTY PAPERS WITH STATUS RULES
exports.getFacultyPapers = (req, res) => {
  const { dep_id, year } = req.query;

  if (!dep_id) return res.status(400).json({ message: 'Department ID is required.' });

  // Convert year to integer if provided
  const selectedYear = year ? parseInt(year) : null;

  // Query all faculty papers for the department
  const query = `
    SELECT *,
           YEAR(updated_at) AS updated_year
    FROM research_paper
    WHERE department_id = ? AND research_type = 'faculty'
  `;

  db.query(query, [dep_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error', error: err });

    // Filter based on your rules
    const filtered = results.filter(paper => {
      if (paper.status === 'ongoing') return true; // always fetch
      if (paper.status === 'complete' && selectedYear && paper.updated_year === selectedYear) return true;
      if (paper.status === 'proposed' && selectedYear && paper.updated_year === selectedYear) return true;
      return false;
    });

    res.status(200).json(filtered);
  });
};





//ADD HISTORY REPORT
exports.addHistoryReport = (req, res) => {
  const { 
    academic_year, department, created_by, 
    created_at, student_papers, faculty_papers, 
    sdg_summary, recommendations, 
    gemini_output, model_used, feedback_rating 
  } = req.body;

  // console.log(req.body);
  const checker = `
    SELECT * 
    FROM history_report 
    WHERE department = ? 
    AND academic_year = ?
    AND DATE(created_at) = ?
    `;
  db.query(checker, [department, academic_year, created_at], (err, result) => {
    if (err) return res.status(500).send({ message: 'Database error', err });
    if (result.length > 0) {
      return res.status(400).send({ message: 'Record already exists. This paper will not be saved!' });
    }

    const query = `
      INSERT INTO history_report ( 
        academic_year, department, created_by, 
        created_at, student_papers, faculty_papers, 
        sdg_summary, recommendations, 
        gemini_output, model_used, feedback_rating 
        ) 
      VALUES (
        ?, ?, ?, 
        ?, ?, ?, 
        ?, ?, 
        ?, ?, ?
        )
      `;
    const values = [ 
      academic_year, department, created_by, 
      created_at, JSON.stringify(student_papers), JSON.stringify(faculty_papers), 
      sdg_summary, sdg_gaps, recommendations, 
      gemini_output, model_used, feedback_rating
    ];
    
    db.query(query, values, (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: 'Report added successfully' });
    })
  });
};





//------------------------------------------------------------ADMIN HOMEPAGE-------------------------------------------------------------------------------------------------



//GET CURRENT UPLOADED PAPER BY USER
exports.getCurretUploadedResearchPapers = (req, res) => {
  const { uId } = req.query;

  if (!uId) {
    return res.status(400).send({ message: 'User ID is required.'});
  }

  const query = `
    SELECT rp.research_id, rp.research_title, rp.created_at, d.department_abb, c.course_abb
    FROM research_paper rp
    JOIN department d ON rp.department_id = d.department_id
    JOIN course c ON rp.course_id = c.course_id
    WHERE rp.uploaded_by = ?
    AND rp.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
    ORDER BY rp.created_at DESC;
  `;

  db.query(query, [uId], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0) return res.status(200).send([]);

    res.status(200).send(result);
  });
};

//GET HIGHEST AND LOWEST SDG IN THE DEPARTMENT
exports.getHighestLowestSDG = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.'});
  }

  const query = `
    WITH ranked AS (
      SELECT 
        rp.course_id, 
        rp.sdg_labels, 
        COUNT(*) AS total,
        RANK() OVER (PARTITION BY rp.course_id ORDER BY COUNT(*) DESC) AS rk_desc,
        RANK() OVER (PARTITION BY rp.course_id ORDER BY COUNT(*) ASC) AS rk_asc
      FROM research_paper rp
      WHERE rp.department_id = ?
      AND YEAR(rp.created_at) = YEAR(CURDATE())
      GROUP BY rp.course_id, rp.sdg_labels
    )

    SELECT 
      c.course_abb, 
      r.sdg_labels, 
      r.total, 
      'highest' AS type
    FROM ranked r
    JOIN course c ON r.course_id = c.course_id
    WHERE r.rk_desc = 1

    UNION ALL

    SELECT 
      c.course_abb, 
      r.sdg_labels, 
      r.total, 
      'lowest' AS type
    FROM ranked r
    JOIN course c ON r.course_id = c.course_id
    WHERE r.rk_asc = 1
    ORDER BY course_abb, type DESC;
  `;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result || []);
  });
};

//GET TOTAL SDG PAPERS
exports.getDepartmentTotalSDGPaper = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.' });
  }

  const query = `
    SELECT rp.sdg_labels, COUNT(*) AS total
    FROM research_paper rp
    WHERE rp.department_id = ?
      AND YEAR(rp.created_at) = YEAR(CURDATE())
    GROUP BY rp.sdg_labels
    ORDER BY total DESC
  `;

  db.query(query, [department_id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result || []);
  });
};



//------------------------------------------------------------AUDIT LOGS-------------------------------------------------------------------------------------------------
//ADD AUDIT LOGS(USUALLY DI NAGAGAMIT TO)
exports.addAuditLog = (req, res) => {
  const { user_code, user_role, action, actor_type } = req.body;

  if (!user_code || !user_role || !action || !actor_type) {
    return res.status(400).send({ message: 'Missing required body parameters.' });
  }

  const query = `INSERT INTO audit_log (user_code, user_role, action, actor_type, timestamp) VALUES (?, ?, ?, ?, NOW())`; 
  db.query(query, [user_code, user_role, action, actor_type], (err) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ message: 'Audit successfully added' });
  });
};

//GET LOGS
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

//GET LOGS 25MAX
exports.getAuditLogs = (req, res) => {
  const query = `SELECT * from audit_log ORDER BY timestamp DESC LIMIT 25`;
  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send(result);
  });
};

//GET USER LOGS
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



//------------------------------------------------------------FOR AI ANALYSIS-------------------------------------------------------------------------------------------------
// FOR AI ANALYSIS
exports.fetchPaperForAnalysis = (req, res) => {
  try {
    const { year, depId } = req.query;
    const yearNum = Number(year);

    if (isNaN(yearNum) || !depId) {
      return res.status(400).json({ error: "Year and department ID are required" });
    }

    const query = `
      SELECT rp.adviser, rp.research_type, rp.funding_source, rp.course_id, rp.department_id, rp.sdg_labels,
             c.course_name, d.department_abb
      FROM research_paper rp
      JOIN course c ON rp.course_id = c.course_id
      JOIN department d ON rp.department_id = d.department_id
      WHERE rp.academic_year = ?
      AND d.department_id = ?
    `;

    db.query(query, [yearNum, depId], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ error: "Database query failed", details: err });
      }

      if (!result.length) {
        // fetch the department abbreviation
        db.query("SELECT department_abb FROM department WHERE department_id = ?", [depId], (err2, depResult) => {
          if (err2) {
            console.error("Error fetching department:", err2);
            return res.status(500).json({ error: "Failed to fetch department info" });
          }

          const departmentAbb = depResult.length ? depResult[0].department_abb : depId;

          return res.status(200).json({
            year: yearNum,
            department: [departmentAbb],
            paper_type: {},
            message: "No research paper found for the selected year and department."
          });
        });
        return;
      }

      const studentCourses = {};
      const facultyCourses = {};

      const safeParseSDG = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val) } catch { return [val] }
        }
        return [val];
      };

      result.forEach(row => {
        const sdgList = safeParseSDG(row.sdg_labels);

        if (row.research_type === "student") {
          studentCourses[row.course_name] ??= [];
          studentCourses[row.course_name].push({ sdg_labels: sdgList });
        } else if (row.research_type === "faculty") {
          facultyCourses[row.course_name] ??= [];
          facultyCourses[row.course_name].push({ sdg_labels: sdgList });
        }
      });

      const response = {
        year: yearNum,
        department: Array.from(new Set(result.map(r => r.department_abb))),
        paper_type: {
          student: { courses: Object.entries(studentCourses).map(([course_name, papers]) => ({ course_name, papers })) },
          faculty: { courses: Object.entries(facultyCourses).map(([course_name, papers]) => ({ course_name, papers })) }
        }
      };

      res.status(200).json(response);
      console.log("AI-ready structured data:", response);
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Unexpected server error", details: error.message });
  }
};




//GET MOST COMMON SDG
exports.getMostCommonSDG = (req, res) => {
  const { dep_id, year } = req.query;

  if (!dep_id) {
    return res.status(400).json({ message: "Department ID is required." });
  }

  const query = `
    WITH RECURSIVE seq AS (
      SELECT 0 AS n
      UNION ALL
      SELECT n + 1 FROM seq WHERE n < 49
    )
    SELECT sdg, COUNT(*) AS total
    FROM (
      SELECT
        CAST(JSON_UNQUOTE(JSON_EXTRACT(r.sdg_number, CONCAT('$[', seq.n, ']'))) AS UNSIGNED) AS sdg
      FROM research_paper r
      JOIN seq ON JSON_LENGTH(r.sdg_number) > seq.n
      WHERE r.department_id = ? AND r.academic_year = ?
    ) AS exploded
    WHERE sdg IS NOT NULL AND sdg <> ''
    GROUP BY sdg
    ORDER BY total DESC
    LIMIT 3;
  `;

  db.query(query, [dep_id, year], (error, results) => {
    if (error) {
      console.error("Error fetching most common SDGs:", error);
      return res.status(500).json({ message: "Server error", error: error.message });
    }

    if (!results.length) {
      return res.status(404).json({ message: "No SDG data found for this department." });
    }

    res.status(200).json({
      message: "Top 3 most common SDGs retrieved successfully.",
      data: results,
    });
  });
};
