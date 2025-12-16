const express = require('express');
const router = express.Router();
const axios = require("axios");
const verifyToken = require('../middleware/authMiddleware');
const adviserValidator = require('../middleware/adviserValidator');
const researchPaperValidator = require('../middleware/researchPaperValidator');
const {
  addAuditLog,
  getDepartmentTotalSDGPaper,
  getHighestLowestSDG,
  getCurretUploadedResearchPapers,
  getUserData,
  getUsers,
  getUserInfo,
  getRoleUser,
  getDepartmentUser,
  deleteUser,
  getAuditLogs,
  getDepartmentAdviser,
  updateDepartmentAdviser,
  addDepartmentAdviser,
  deleteDepartmentAdviser,
  updateUserProfile,
  getDepartments,
  getSingleDepartments,
  getCourses,
  getAdviserCourses,
  addResearch,
  getDepartmentCourses,
  getDepartmentPapers,
  getDepartmentPapersFaculty,
  deleteResearchPaper,
  addCourse,
  deleteCourse,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentInfo,
  fetchPaperForAnalysis,
  getUserPapers,
  getAllAuditLogs,
  deleteLogs,
  getUserAuditLogs,
  getAdvisoryPaper,
  addDepartmentResearcher,
  getDepartmentResearcher,
  deleteDepartmentResearcher,
  getSinglePaper,
  updateUserRole,
  getFacultyTypePapers,
  getStudentTypePapers,
  getMostCommonSDG,
  addHistoryReport,
  getAllCourses,
  updateCourse
} = require('../controllers/usersController');

const upload = require('../middleware/uploadMiddleware');

//------------------------------------------------------------USER-------------------------------------------------------------------------------------------------
router.get('/me', verifyToken, getUserData);
router.get('/user-info', verifyToken, getUserInfo);
router.get('/allUsers', verifyToken, getUsers);
router.get('/role-user', verifyToken, getRoleUser);
router.get('/user-department', verifyToken, getDepartmentUser);
router.delete('/user-delete/:id', verifyToken, deleteUser);
router.get('/user-papers/:id', verifyToken, getUserPapers);
router.put('/update', verifyToken, upload.single('profile_img'), updateUserProfile);
router.put('/update-role', verifyToken, updateUserRole);



//------------------------------------------------------------AUDITS-------------------------------------------------------------------------------------------------
router.post('/audit-log', verifyToken, addAuditLog);
router.get('/user-audit/:user_code', verifyToken, getUserAuditLogs);
router.get('/audit-logs', verifyToken, getAuditLogs);
router.get('/audit-logs-all', verifyToken, getAllAuditLogs);
router.delete('/audit-delete', verifyToken, deleteLogs);


//------------------------------------------------------------DEPARTMENT-------------------------------------------------------------------------------------------------
router.get('/department/info', verifyToken, getDepartmentInfo);
router.post('/departments/add', verifyToken, addDepartment);  
router.get('/departments', verifyToken, getDepartments);
router.get('/departments/:id', verifyToken, getSingleDepartments);
router.put('/departments/:deptId', verifyToken, updateDepartment);
router.delete('/departments/delete/:deptId', verifyToken, deleteDepartment);


//------------------------------------------------------------COURSES-------------------------------------------------------------------------------------------------
router.get('/all-course', verifyToken, getAllCourses);
router.get('/courses', verifyToken, getCourses);
router.get('/department-courses', verifyToken, getDepartmentCourses);
router.get('/adviser-course', verifyToken, getAdviserCourses);
router.post('/course/add', verifyToken, addCourse);
router.put('/course-edit/:courseId', verifyToken, updateCourse);
router.delete('/course/delete/:id', verifyToken, deleteCourse);



//------------------------------------------------------------PAPERS-------------------------------------------------------------------------------------------------
router.post('/research-add', verifyToken, researchPaperValidator, addResearch);
router.delete('/research-delete/:id', verifyToken, deleteResearchPaper);
router.get('/department-papers', verifyToken, getDepartmentPapers); //student
router.get('/department-papers-faculty', verifyToken, getDepartmentPapersFaculty); //faculty
router.get('/department/total-sdg-papers', verifyToken, getDepartmentTotalSDGPaper);
router.get('/department/highest-lowest-sdg', verifyToken, getHighestLowestSDG);
router.get('/current-uploaded/research-papers', verifyToken, getCurretUploadedResearchPapers);
router.get('/research-paper/:paper_id', verifyToken, getSinglePaper);
router.get('/research-type/student', verifyToken, getStudentTypePapers);
router.get('/research-type/faculty', verifyToken, getFacultyTypePapers);
router.get('/research/commonSDG', verifyToken, getMostCommonSDG);


router.post('/history-report', verifyToken, addHistoryReport);



//------------------------------------------------------------FOR AI INTEGRATION ANALYSIS-------------------------------------------------------------------------------------------------
router.get('/analysis-papers', verifyToken, fetchPaperForAnalysis);

module.exports = router;
