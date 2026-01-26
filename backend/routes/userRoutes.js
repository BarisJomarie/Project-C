const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const researchPaperValidator = require('../middleware/researchPaperValidator');
const {getUserData, getUsers, getUserInfo, getRoleUser, getDepartmentUser, deleteUser, updateUserProfile, updateUserRole} = require('../controllers/usersController');

const {addDepartment, getDepartments, getDepartmentInfo, getSingleDepartments, updateDepartment, deleteDepartment} = require('../controllers/departmentController');

const {getAllCourses, getCourses, getDepartmentCourses, addCourse, updateCourse, deleteCourse} = require('../controllers/coursesController');

const {getUserAuditLogs, getAuditLogs, getAllAuditLogs, deleteLogs} = require('../controllers/auditsController');

const {addResearch, updatePaper, deleteResearchPaper, getDepartmentPapers, getDepartmentPapersFaculty, getDepartmentTotalSDGPaper, getHighestLowestSDG, getCurretUploadedResearchPapers, getSinglePaper, fetchPaperForAnalysis, getStudentTypePapers, getFacultyTypePapers, getMostCommonSDG, addHistoryReport, getUserPapers} = require('../controllers/researchPaperController');

const {addResearchPresentation, presentationTitleChecker, getResearchPresentationsByDepartment, getCurrentUploadedPresentationUser, getPresentationIndexes, getPresentationRows, deleteResearchPresentation} = require('../controllers/researchPresentationController');

const {addResearchPublication, publicationTitleChecker, getPublicationIndexes, getResearchPublicationsByDepartment, deleteResearchPublication} = require('../controllers/researchPublicationController');

const upload = require('../middleware/uploadMiddleware');

//------------------------------------------------------------USER-------------------------------------------------------------------------------------------------
router.get('/me', verifyToken, getUserData);
router.get('/user-info', verifyToken, getUserInfo);
router.get('/allUsers', verifyToken, getUsers);
router.get('/role-user', verifyToken, getRoleUser);
router.get('/user-department', verifyToken, getDepartmentUser);

router.put('/update', verifyToken, upload.single('profile_img'), updateUserProfile);
router.put('/update-role', verifyToken, updateUserRole);

router.delete('/user-delete/:id', verifyToken, deleteUser);

//------------------------------------------------------------AUDITS-------------------------------------------------------------------------------------------------
router.get('/user-audit/:user_code', verifyToken, getUserAuditLogs);
router.get('/audit-logs', verifyToken, getAuditLogs);
router.get('/audit-logs-all', verifyToken, getAllAuditLogs);

router.delete('/audit-delete', verifyToken, deleteLogs);

//------------------------------------------------------------DEPARTMENT-------------------------------------------------------------------------------------------------
router.post('/departments/add', verifyToken, addDepartment);

router.get('/department/info', verifyToken, getDepartmentInfo);
router.get('/departments', verifyToken, getDepartments);
router.get('/departments/:id', verifyToken, getSingleDepartments);

router.put('/departments/:deptId', verifyToken, updateDepartment);

router.delete('/departments/delete/:deptId', verifyToken, deleteDepartment);

//------------------------------------------------------------COURSES-------------------------------------------------------------------------------------------------
router.post('/course/add', verifyToken, addCourse);

router.get('/all-course', verifyToken, getAllCourses);
router.get('/courses', verifyToken, getCourses);
router.get('/department-courses', verifyToken, getDepartmentCourses);

router.put('/course-edit/:courseId', verifyToken, updateCourse);

router.delete('/course/delete/:id', verifyToken, deleteCourse);

//------------------------------------------------------------PAPERS-------------------------------------------------------------------------------------------------
router.post('/research-add', verifyToken, researchPaperValidator, addResearch);

router.get('/user-papers/:id', verifyToken, getUserPapers);
router.get('/department-papers', verifyToken, getDepartmentPapers); //student
router.get('/department-papers-faculty', verifyToken, getDepartmentPapersFaculty); //faculty
router.get('/department/total-sdg-papers', verifyToken, getDepartmentTotalSDGPaper);
router.get('/department/highest-lowest-sdg', verifyToken, getHighestLowestSDG);
router.get('/current-uploaded/research-papers', verifyToken, getCurretUploadedResearchPapers);
router.get('/research-paper/:paper_id', verifyToken, getSinglePaper);

router.put('/research-student-paper/:research_id', verifyToken, updatePaper);

router.delete('/research-delete/:id', verifyToken, deleteResearchPaper);

router.get('/analysis-papers', verifyToken, fetchPaperForAnalysis);
router.get('/research-type/student', verifyToken, getStudentTypePapers);
router.get('/research-type/faculty', verifyToken, getFacultyTypePapers);
router.get('/research/commonSDG', verifyToken, getMostCommonSDG);

router.post('/history-report', verifyToken, addHistoryReport);

//------------------------------------------------------------RESEARCH PRESENTATION-------------------------------------------------------------------------------------------------
router.post("/presentation/add", verifyToken, addResearchPresentation);

router.get('/presentation/title-checker', verifyToken, presentationTitleChecker);
router.get("/presentation/department", verifyToken, getResearchPresentationsByDepartment);
router.get('/presentation/user-current-upload', verifyToken, getCurrentUploadedPresentationUser);
router.get("/presentation/indexes", verifyToken, getPresentationIndexes);
router.get('/presentation/selected-table', verifyToken, getPresentationRows);

router.delete("/presentation/delete/:id", verifyToken, deleteResearchPresentation);

//------------------------------------------------------------RESEARCH PUBLICATION-------------------------------------------------------------------------------------------------
router.post("/publication/add", verifyToken, addResearchPublication);

router.get("/publication/department", verifyToken, getResearchPublicationsByDepartment);
router.get("/publication/title-checker", verifyToken, publicationTitleChecker);
router.get("/publication/indexes", verifyToken, getPublicationIndexes);

router.delete("/publication/delete/:id", verifyToken, deleteResearchPublication);


module.exports = router;
