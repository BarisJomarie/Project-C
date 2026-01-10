const db = require('../db');
const { logAudit } = require('./auditsController')

const SDG_MAP = {
  "No Poverty": "SDG1",
  "Zero Hunger": "SDG2",
  "Good Health and Well-being": "SDG3",
  "Quality Education": "SDG4",
  "Gender Equality": "SDG5",
  "Clean Water and Sanitation": "SDG6",
  "Affordable and Clean Energy": "SDG7",
  "Decent Work and Economic Growth": "SDG8",
  "Industry, Innovation and Infrastructure": "SDG9",
  "Reduced Inequalities": "SDG10",
  "Sustainable Cities and Communities": "SDG11",
  "Responsible Consumption and Production": "SDG12",
  "Climate Action": "SDG13",
  "Life Below Water": "SDG14",
  "Life on Land": "SDG15",
  "Peace, Justice and Strong Institutions": "SDG16",
  "Partnerships for the Goals": "SDG17"
};


//ADD PAPER
exports.addResearch = (req, res) => {
  const { user_id, research_type, semester, sy, funding_source, title, abstract, conclusion, adviser, researchers, department, course, sdg_number, sdg_label, confidence_scores, status, user_code, role } = req.body;

  const beforeQuery = `SELECT * FROM research_paper WHERE research_title = ?`;
  db.query(beforeQuery, [title], (err, result) => {
    if (err) return res.status(500).send({ message: 'Database error: ', err });
    if (result.length > 0) return res.status(400).send({ message: 'Paper already exists' });
    
    const query = `
      INSERT INTO research_paper ( research_type, semester, academic_year, funding_source, research_title, research_abstract, research_conclusion, adviser, researchers, department_id, course_id, sdg_number, sdg_labels, confidence_scores, status, created_at, uploaded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `;
    const values = [ research_type, semester, sy, funding_source, title, abstract, conclusion, adviser, JSON.stringify(researchers), department, course, JSON.stringify(sdg_number), JSON.stringify(sdg_label), JSON.stringify(confidence_scores), status, user_id ];

    let type = '';
    if (research_type === 'student') type = 'Student Thesis';
    else if (research_type === 'faculty') type = 'Faculty Research';

    db.query(query, values, (err, result) => {
      if (err) return res.status(500).send(err);

      res.status(201).send({ message: 'Paper added successfully' });
      logAudit( req.user.user_code, req.user.role, `Added Research Paper: ${type} - ${title}`, 'user' )
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err));
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

    res.status(200).send(formattedResult);
  });
};

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

//DELETE PAPER
exports.deleteResearchPaper = (req, res) => {
  const { id } = req.params;

  const beforeQuery = 'SELECT * FROM research_paper WHERE research_id = ?';

  db.query(beforeQuery, [id], (err, result) => {
    if (err) return res.status(500).json({message: 'Database Error', err});
    if (result.length === 0) return res.status(404).json({message: 'Research Paper not found'});

    let type = '';
    const research_type = result[0].research_type;
    const title = result[0].research_title;
    if (research_type === 'student') type = 'Student Thesis';
    else if (research_type === 'faculty') type = 'Faculty Research';

    const query = `DELETE FROM research_paper WHERE research_id = ?`;

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ message: 'Paper deleted successfully' });

      logAudit( req.user.user_code, req.user.role, `Deleted Research Paper: ${type} - ${title}`, 'user' )
      .then(auditId => console.log(auditId))
      .catch(err => console.error('Audit log error: ', err)); 
    });
  });
};

//GET RESEARCH PAPERS TYPE = STUDENT (for AI Report)
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

// GET RESEARCH PAPERS TYPE = FACULTY (for AI Report)
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

//GET MOST COMMON SDG (for AI Report)
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

// FETCH STUDENT(grouped) FACULTY(grouped) PAPERS IN THE DEPARTMENT
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

//ADD REPORT IN HISTORY DATABASE
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

      logAudit( req.user.user_code, req.user.role, 'History Report Added', 'user')
      .then(auditId => console.log(auditId))
      .catch(err => console.error(err));
    })
  });
};

//GET CURRENT UPLOADED PAPER BY USER (homepage)
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

//GET HIGHEST AND LOWEST SDG IN THE DEPARTMENT (homepage)
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

//GET TOTAL SDG PAPERS (homepage)
exports.getDepartmentTotalSDGPaper = (req, res) => {
  const { department_id } = req.query;

  if (!department_id) {
    return res.status(400).send({ message: 'Department ID is required.' });
  }

  const query = `
    SELECT sdg_labels
    FROM research_paper
    WHERE department_id = ?
  `;

  db.query(query, [department_id], (err, rows) => {
    if (err) return res.status(500).send(err);

    // Initialize SDG counters
    const sdgCount = {};
    Object.values(SDG_MAP).forEach(sdg => {
      sdgCount[sdg] = 0;
    });

    rows.forEach(row => {
      let labels = [];

      try {
        // Case 1: JSON array string
        if (row.sdg_labels.startsWith("[")) {
          labels = JSON.parse(row.sdg_labels);
        }
        // Case 2: single string like "Quality Education"
        else {
          labels = [JSON.parse(row.sdg_labels)];
        }
      } catch {
        return;
      }

      labels.forEach(label => {
        const sdgCode = SDG_MAP[label];
        if (sdgCode) {
          sdgCount[sdgCode] += 1;
        }
      });
    });

    // Convert to array (SDG1 → SDG17)
    const result = Object.keys(sdgCount).map(sdg => ({
      sdg,
      total: sdgCount[sdg]
    }));

    res.status(200).send(result);
  });
};
