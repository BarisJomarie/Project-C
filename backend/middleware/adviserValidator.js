const adviserValidator = (req, res, next) => {
  const { faculty_id, department_id, course_id } = req.body;

  if (!faculty_id || !department_id || !course_id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  //just in case lang na may limit sa inputs

  // if (adviser_code.length > 20) {
  //   return res.status(400).json({ message: 'Adviser code must be 20 characters or less' });
  // }

  next();
};

module.exports = adviserValidator;
