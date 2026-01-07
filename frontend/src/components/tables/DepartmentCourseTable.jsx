import React, { useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../utils/ConfirmModal";
import { showToast } from "../../utils/toast";

const DepartmentCourseTable = ({ courses, loading, role, fetchCourse }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;

  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirmn',
  });
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

  // DELETE COURSE
  const handleDeleteCourse = (id) => {
    const course = courses.find((c) => c.course_id === id);
    
    if (!course) return showToast('error', 'Not Found', 'Course not found.');

    showModal(
      'Deleting Course',
      <>
        Are you sure you want to delete this course?
        <br/><br/>
        Course: <strong>{course.course_name}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/course/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
            showToast('success', 'Course Deleted', 'Course deleted successfully.');
            fetchCourse();
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
  return (
    <>
      {loading
        ? <div className="department-buttons-container">
          <ShimmerButton size="lg" />
        </div>
        : <div className="department-buttons-container">
          <button onClick={() => navigate('/user/course_add')} type="button" name="dep-course">
            Add A Course
          </button>
        </div>
      }
      {loading ? <ShimmerTable row={3} col={4} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-course-thead">
              <tr>
                <th>Course&nbsp;Name</th>
                <th>Course&nbsp;Abbreviation</th>
                {role === 'admin' && <th className="action-column">Action</th>}
              </tr>
            </thead>
            <tbody>
              {courses.length > 0 ? (
                courses.map((course) => {

                  return (
                    <tr key={course.course_id}>
                      <td>{course.course_name}</td>
                      <td>{course.course_abb}</td>
                      {role === 'admin' && (
                        <td className="action-column">
                          <button onClick={() => handleDeleteCourse(course.course_id)}>
                            <span className="material-symbols-outlined delete-icon">delete</span>
                            <span className="tooltip">Delete Course</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="2">No papers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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

export default DepartmentCourseTable;