import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { showToast } from "../utils/toast";
import { ShimmerButton, ShimmerTable, ShimmerTitle } from "react-shimmer-effects";
import ConfirmModal from "../utils/ConfirmModal";
import axios from "axios";
import DepartmentUserTable from "./tables/DepartmentUserTable";
import DepartmentStudentPaperTable from "./tables/DepartmentStudentPaperTable";
import DepartmentFacultyPaperTable from "./tables/DepartmentFacultyPaperTable";
import DepartmentResearchPresentationTable from "./tables/DepartmentResearchPresentationTable";
import DepartmentResearchPublicationTable from "./tables/DepartmentResearchPublicationTable";
import DepartmentCourseTable from "./tables/DepartmentCourseTable";
import '../styles/department.css';
import '../styles/style.css';
import '../styles/table.css';



const Department = () => {
  const [pageLoading, setPageLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmn',
  });
  const [userData, setUserData] = useState(null);
  const [department, setDepartment] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [departmentStudentPapers, setDepartmentStudentPapers] = useState([]);
  const [departmentFacultyPapers, setDepartmentFacultyPapers] = useState([]);
  const [departmentCourse, setDepartmentCourse] = useState([]);
  const [activeTable, setActiveTable] = useState('users');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const userRef = useRef(null);
  const studentPaperRef = useRef(null);
  const facultyPaperRef = useRef(null);
  const courseRef = useRef(null);
  const {dep_id} = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const researchPresentationRef = useRef(null);
  const researchPublicationRef = useRef(null);
  const [departmentResearchPresentation, setDepartmentResearchPresentation] = useState([]);
  const [departmentResearchPublications, setDepartmentResearchPublications] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;

  const now = new Date();

  const showModal = (title, message, onConfirm, confirmText) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm,
      confirmText,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({...prev, show:false}));
  };

  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];


  // GET USER DATA
  const getUserData = () => {
    return axios.get(`${API_URL}/api/users/user-info`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { id: userId }
    }).then(response => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        setUserData(response.data[0]);
        // console.log('User fetched2:', response.data[0]);
      } else {
        console.log('No user found');
        setUserData(null);
      }
    }).catch(err => {
      console.error('Failed to fetch user', err);
      setUserData(null);
    });
  };

  // GET DEPARTMENT INFO
  const fetchDepartment = () => {
    return axios.get(`${API_URL}/api/users/department/info`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setDepartment(res.data);
    }).catch(err => {
      console.error('Error fetching department', err);
    });
  }

  // GET DEPARTMENT USERS
  const fetchDepartmentUsers = () => {
    setTableLoading(true);
    return axios.get(`${API_URL}/api/users/user-department`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Users fetched`);
      } else {
        console.log(`Department (${dep_id}): No users fetched`);
      }
      setDepartmentUsers(res.data);
    }).catch(err => {console.error('Error fetching user:', err);
      setDepartmentUsers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  };

  // GET DEPARTMENT STUDENT PAPERS
  const fetchStudentPapers = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-papers`, {
      params: { department_id: dep_id, type: 'student' },
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Papers fetched`);
        // console.log(res.data);
      } else {
        console.log(`Department (${dep_id}): No papers found`);
      }
      setDepartmentStudentPapers(res.data);
    }).catch(err => {console.error('Error fetching faculty papers:', err);
      setDepartmentStudentPapers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  }

  // GET DEPARTMENT FACULTY PAPERS
  const fetchFacultyPapers = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-papers-faculty`, {
      params: { department_id: dep_id, type: 'faculty' },
      headers: { Authorization: `Bearer ${token}`}
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Papers fetched`);
      } else {
        console.log(`Department (${dep_id}): No papers found`);
      }
      setDepartmentFacultyPapers(res.data);
    }).catch(err => {console.error('Error fetching faculty papers:', err);
      setDepartmentFacultyPapers([]);
    }).finally(() => {
      setTableLoading(false);
    });
  }

  // GET PRESENTATION PAPERS
  const fetchResearchPresentation = async () => {
    setTableLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/presentation/department`, {
        params: { department_id: dep_id },
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data.map(item => ({
        ...item,
        co_authors: Array.isArray(item.co_authors) ? item.co_authors : [],
        sdg_alignment: Array.isArray(item.sdg_alignment)
          ? item.sdg_alignment
          : (() => {
              try {
                return JSON.parse(item.sdg_alignment || "[]");
              } catch {
                return [];
              }
            })()
      }));

      setDepartmentResearchPresentation(data);
    } catch (err) {
      console.error("Error fetching research presentations:", err);
      setDepartmentResearchPresentation([]);
    } finally {
      setTableLoading(false);
    };
  };

  // GET DEPARTMENT RESEARCH PUBLICATIONS
  const fetchResearchPublications = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/publication/department`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setDepartmentResearchPublications(res.data);
    })
    .catch(err => {
      console.error("Error fetching research publications:", err);
      setDepartmentResearchPublications([]);
    })
    .finally(() => {
      setTableLoading(false);
    });
  };

  // GET DEPARTMENT COURSES
  const fetchDepartmentCourses = () => {
    setTableLoading(true);
    axios.get(`${API_URL}/api/users/department-courses`, {
      params: { department_id: dep_id },
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Department (${dep_id}): Courses fetched`);
      } else {
        console.log(`Department (${dep_id}):No courses fetched`);
      }
      setDepartmentCourse(res.data);
    }).catch(err => {console.error('Error fetching courses:', err);
      setDepartmentCourse([]);
    }).finally(() => {
      setTableLoading(false);
    });
  };

  useEffect(() => {
    if (!dep_id) return;

    setPageLoading(true);
    setActiveTable('users');

    Promise.all([
      getUserData(),
      fetchDepartment(),
      fetchDepartmentUsers()
    ])
    .finally(() => {
      setPageLoading(false);
    });
  }, [dep_id]);


  useEffect(() => {
    const updateIndicator = () => {
      const activeRef = activeTable === 'users' ? userRef : activeTable === 'student-paper' ? studentPaperRef : activeTable === 'faculty-paper' ? facultyPaperRef : activeTable === 'research-presentation' ? researchPresentationRef : activeTable === 'research-publications' ? researchPublicationRef: courseRef;

      if (activeRef && activeRef.current) {
        const { offsetLeft, offsetWidth } = activeRef.current;
        setIndicatorStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`
        });
      }
    };

    // run once when dependencies change (including when page finishes loading)
    updateIndicator();

    // update on window resize to keep indicator aligned
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTable, pageLoading]);


  return (
    <>
      <div className="department-container">
        {pageLoading ? <ShimmerTitle line={1} gap={10} variant="primary"/> : <h1>{department.department_name}</h1>}

        <div className="table-selector">
          {pageLoading ? <ShimmerTitle line={1} gap={10} variant="primary"/> : <>
            <div className="tab-group">
              {/* <p>Select: </p> */}
              <div className="tab-labels">
                <h3
                  ref={userRef}
                  className={activeTable === 'users' ? 'active-tab user' : ''}
                  onClick={() => {
                    fetchDepartmentUsers();
                    setActiveTable('users');
                  }}
                >
                  Users
                </h3>
                <h3
                  ref={studentPaperRef}
                  className={activeTable === 'student-paper' ? 'active-tab student' : ''}
                  onClick={() => {
                    fetchStudentPapers();
                    setActiveTable('student-paper');
                  }}
                >
                  Student&nbsp;Thesis
                </h3>
                <h3
                  ref={facultyPaperRef}
                  className={activeTable === 'faculty-paper' ? 'active-tab faculty' : ''}
                  onClick={() => {
                    fetchFacultyPapers();
                    setActiveTable('faculty-paper');
                  }}
                >
                  Faculty&nbsp;Research
                </h3>

                {userData?.role !== 'faculty' && (
                  <>
                    <h3
                    ref={researchPresentationRef}
                    className={activeTable === 'research-presentation' ? 'active-tab presentation' : ''}
                    onClick={() => {
                      fetchResearchPresentation();
                      setActiveTable('research-presentation');
                    }}
                  >
                    Research&nbsp;Presentation
                  </h3>
                  <h3
                    ref={researchPublicationRef}
                    className={activeTable === 'research-publications' ? 'active-tab publication' : ''}
                    onClick={() => {
                      fetchResearchPublications();
                      setActiveTable('research-publications');
                    }}
                  >
                    Research&nbsp;Publications
                  </h3>
                  </>
                )}

                <h3
                  ref={courseRef}
                  className={activeTable === 'course' ? 'active-tab course' : ''}
                  onClick={() => {
                    fetchDepartmentCourses();
                    setActiveTable('course');
                  }}
                >
                  Course
                </h3>
                <div
                  className={`tab-indicator ${
                    activeTable === 'users' 
                    ? 'user' 
                    : activeTable === 'student-paper' 
                    ? 'student' 
                    : activeTable === 'faculty-paper' 
                    ? 'faculty' 
                    : activeTable === 'research-presentation' 
                    ? 'presentation' 
                    : activeTable === 'research-publications' 
                    ? 'publication' 
                    : activeTable === 'course'
                    ? 'course'
                    : ``
                  }`}
                  style={indicatorStyle}
                />
              </div>
            </div>
          </>}
        </div>

        {/* color: 3B060A */}
        {activeTable === 'users' && (
          <DepartmentUserTable users={departmentUsers} loading={tableLoading} />
        )}
        
        {/* color: 1e293b */}
        {activeTable === 'student-paper' && (
          <DepartmentStudentPaperTable sPapers={departmentStudentPapers} loading={tableLoading} role={userData?.role} dep_id={dep_id} fetchStudentPapers={fetchStudentPapers}/>
        )}

        {/* color: 490346 */}
        {activeTable === 'faculty-paper' && (
          <DepartmentFacultyPaperTable fPapers={departmentFacultyPapers} loading={tableLoading} role={userData?.role} dep_id={dep_id} fetchFacultyPapers={fetchFacultyPapers}/>
        )}
        
        {/* color: 1E4A40 */}
        {activeTable === 'research-presentation' && (
          <DepartmentResearchPresentationTable presentations={departmentResearchPresentation} loading={tableLoading} department={department} user={userData} fetchPresentation={fetchResearchPresentation}/>
        )}

        {/* color: 000f3f */}
        {activeTable === "research-publications" && (
          <DepartmentResearchPublicationTable publication={departmentResearchPublications} loading={tableLoading} department={department} user={userData} fetchPublications={fetchResearchPublications}/>
        )}
  
        {/* color: C83F12 */}
        {activeTable === 'course' && (
          <DepartmentCourseTable courses={departmentCourse} loading={tableLoading} role={userData?.role} fetchCourse={fetchDepartmentCourses}/>
        )}
      </div>

      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        onCancel={closeModal}
        />

      <div className="toast-box" id="toast-box"></div>
    </>
  );
};

export default Department;