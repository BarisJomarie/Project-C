import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
import { ShimmerButton, ShimmerTable } from "react-shimmer-effects";
import ConfirmModal from "../utils/ConfirmModal";
import axios from "axios";
import '../styles/addPage.css';
import '../styles/style.css';
import '../styles/form.css'


const AddCourse = () => {;
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const [courses, setCourses] = useState([]);
  const [openCourseForm, setOpenCourseForm] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseAbbreviation, setCourseAbbreviation] = useState("");
  const [department, setDepartment] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editCourse, setEditCourses] = useState({
    course_name: '',
    course_abb: ''
  })
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const API_URL = import.meta.env.VITE_API_URL;



  const showModal = (title, message, onConfirm) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({...prev, show: false}));
  }



  // FETCH DEPARTMENT
  const fetchDepartment = () => {
    return axios.get(`${API_URL}/api/users/departments`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data) {
        // console.log("Department fetched");
        setDepartment(res.data);
      } else {
        console.log("No department found.");
        setDepartment([]);
      }
    }).catch(err => {
      console.error("Error fetching department:", err);
      setDepartment([]);
    });
  };

  const fetchCourses = () => {
    return axios.get(`${API_URL}/api/users/all-course`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (Array.isArray(res.data) && res.data.length > 0) {
        // console.log(`Courses fetched`);
      } else {
        console.log(`No courses fetched`);
      }
      setCourses(res.data);
    }).catch(err => {console.error('Error fetching courses:', err);
      setCourses([]);
    });
  };
  

  useEffect(() => {
    setPageLoading(true);
    Promise.all([fetchDepartment(), fetchCourses()]).finally(() => {
      setPageLoading(false);
    })
  }, []);



  // ADD COURSE
  const addCourse = async (e) => {
    e.preventDefault();

    if (!courseName.trim() || !courseAbbreviation.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill all required.');
      return;
    }

    const departmentObj = department.find(dep => dep.department_id === parseInt(selectedDepartment));

    showModal(
      "Add Course Confirmation",
      <>
        Are you sure you want to add this course <br/><br/>
        Course: <strong>{courseName}</strong>
        <br/><br/> To
        <br/><br/> 
        Department: <strong>{departmentObj?.department_name || "Unknown"}</strong>?
      </>,
      async () => {
        closeModal();
        try {
          const payload = {
            department_id: selectedDepartment,
            course_name: courseName,
            course_abbreviation: courseAbbreviation
          };
          const res = await axios.post(`${API_URL}/api/users/course/add`, payload, {
            headers: { Authorization: `Bearer ${token}`}
          });

          if (res.status === 201) {
            showToast('success', 'Course Added', 'Course added successfully');
            clearField();
            fetchCourses();
          }
        } catch (err) {
          console.error(err);
          const message = err.response?.data?.message || "Failed to add course";
          showToast('error', 'Error', message);
        }
      }
    );
  };


  //HANDLE UPDATE COURSE
  const handleSave = (courseId) => {
    showModal(
      "Confirm Update",
      "Are you sure you want to save changes to this Course?",
      async () => {
        closeModal();
        try {
          const res = await axios.put(
              `${API_URL}/api/users/course-edit/${courseId}`,
              editCourse,
              { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.status === 200) {
              showToast("success", "Update", "Course updated successfully.");
              setEditingIndex(null);
              fetchCourses();
          }
        } catch (error) {
          console.error("Error updating course:", error);
          showToast("error", "Error", "Error updating course");
        }
      }
    );
  };


  // DELETE COURSE
  const handleDeleteCourse = (courseId) => {
    showModal(
      'Deleting Course',
      <>
        Are you sure you want to delete this course?
        <br/><br/>
        Course: <strong>{courseId.course_name}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/course/delete/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
            showToast('success', 'Course Deleted', 'Course deleted successfully.');
            fetchCourses();
        } catch(err) {
              console.error('Delete failed:', err);
              showToast('error', 'Delete Failed', 'Could not delete course.');
        } finally {
          closeModal();
        };
      },
      'Delete Course'
    );
  }

  const clearField = () => {
    setCourseName("");
    setCourseAbbreviation("");
    setSelectedDepartment("");
  };

  return (
    <>
      <div>
        <div className="department-buttons-container">
            {openCourseForm ? (
                <button onClick={() => setOpenCourseForm(false)} type="button">Close Form</button>
            ) : (
                pageLoading ? <ShimmerButton size="lg" />
                :   <button onClick={() => setOpenCourseForm(true)} type="button">Add Course</button>
            )}
        </div>
        <div className={`form-container ${openCourseForm ? 'slide-down' : 'slide-up'}`}>
          <form onSubmit={addCourse}>
            <div className="form-input">
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} name="dep" required>
                <option value="">-- Select a Department --</option>
                {department.map(dep => (
                  <option key={dep.department_id} value={dep.department_id}>
                    {dep.department_name}
                  </option>
                ))}
              </select>
              <label htmlFor="dep">Select a Department</label>
            </div>
            <div className="form-input">
              <input name="course-name" type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} required />
              <label htmlFor="course-name">Course Name</label>
            </div>

            <div className="form-input">
              <input name="course-abb" type="text" value={courseAbbreviation} onChange={(e) => setCourseAbbreviation(e.target.value)} required />
              <label htmlFor="course-abb">Course Abbreviation</label>
            </div>
            <div className="form-button-container">
              <button type="submit">Add Course</button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="line"></div>

      {pageLoading ? <ShimmerTable row={5} col={4} />
      : <>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Course Department</th>
                <th>Course Name</th>
                <th>Course Abbreviation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((c, index) => (
                  <tr key={c.course_id}>
                    <td>{c.department_name}</td>
                    <td>
                      {editingIndex === index ? (
                        <input
                          value={editCourse.course_name || ''}
                          onChange={(e) => setEditCourses({...editCourse, course_name: e.target.value})} 
                         />
                      ) : (
                        c.course_name
                      )}
                    </td>
                    <td>
                      {editingIndex === index ? (
                        <input
                          value={editCourse.course_abb || ''}
                          onChange={(e) => setEditCourses({...editCourse, course_abb: e.target.value})} 
                         />
                      ) : (
                        c.course_abb
                      )}
                    </td>
                    <td>
                      {editingIndex === index ? (
                        <>
                          <button onClick={() => handleSave(c.course_id)}>
                            <span className="material-symbols-outlined save-icon">save</span>
                            <span className="tooltip">Save Edit</span>
                          </button>
                          <button onClick={() => setEditingIndex(null)}>
                            <span className="material-symbols-outlined cancel-icon">cancel</span>
                            <span className="tooltip">Cancel Edit</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => {
                            setEditingIndex(index);
                            setEditCourses(c);
                            }}>
                            <span className="material-symbols-outlined edit-icon">edit</span>
                            <span className="tooltip">Edit Course</span>
                          </button>
                          <button onClick={() => handleDeleteCourse(c.course_id)}>
                            <span className="material-symbols-outlined delete-icon">delete</span>
                            <span className="tooltip">Delete Course</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}> No fetched courses... </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>}

      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />

      <div className="toast-box" id="toast-box"></div>
    </>
  );
}

export default AddCourse;