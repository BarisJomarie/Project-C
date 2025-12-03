import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { showToast } from "../utils/toast";
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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseAbbreviation, setCourseAbbreviation] = useState("");
  const [department, setDepartment] = useState([]);
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
    axios.get(`${API_URL}/api/users/departments`, {
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



  useEffect(() => {
    fetchDepartment();
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
          }
        } catch (err) {
          console.error(err);
          const message = err.response?.data?.message || "Failed to add course";
          showToast('error', 'Error', message);
        }
      }
    );
  };

  const clearField = () => {
    setCourseName("");
    setCourseAbbreviation("");
    setSelectedDepartment("");
  };

  return (
    <>
      <div>
        <h1 style={{textAlign: 'center'}}>Add Course to a Department</h1>
        <div className="line"></div>
        <div className="form-container default">
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
              <button type="button" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit">Add Course</button>
            </div>
          </form>
        </div>
      </div>

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