import React, { useMemo, useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../utils/ConfirmModal";
import { showToast } from "../../utils/toast";
import useSortableTable from "../../hooks/useSortableTable";

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

  const [course, setCourse] = useState('');

  const filteredData = useMemo(() => {
    return courses.filter(item => {
      // Course Filter
      const matchesCourse = course
        ? item.course_name?.toLowerCase().includes(course.toLowerCase())
        : true;

      return matchesCourse;
    });
  }, [courses, course]);

  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    hoveredColumn, 
    setHoveredColumn, 
    handleSort,
    resetSort
  } = useSortableTable(filteredData);

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
        ? <div className="department-buttons-filter-container">
            <div className="left">
              <ShimmerButton size="lg"/>
            </div>
            <div className="right">
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
            </div>
          </div> 
        : <div className="department-buttons-filter-container">
            <div className="left">
              <div className="slider-button">
                <button
                  type="button"
                  onClick={() => navigate('/user/course_add')}
                  name="dep-course"
                >
                  <span className="material-symbols-outlined">
                    add
                  </span>
                  <div className="slide-info">
                    Add New Course
                  </div>
                </button>
                
              </div>
            </div>

            <div className="right">
              <div>
                <input 
                  placeholder='Enter Course Name' 
                  name='dep-course'
                  type="text" 
                  value={course} 
                  onChange={(e) => setCourse(e.target.value)} 
                  />
              </div>

              <div className="slider-button">
                <button 
                  onClick={() => {
                    setCourse('');
                    resetSort();
                  }} 
                  type="button"
                  name="dep-course"
                  >
                    <span className="material-symbols-outlined">
                      reset_settings
                    </span>
                    <div className="slide-info">
                      Reset Filter
                    </div>
                </button>
              </div>
            </div>
          </div>
      }

      <div className={`count-div ${course !== '' ? 'active' : ''}`}>
        <h4>Total Courses Found: <span>{sortedData.length}</span></h4>
      </div>

      {loading ? <ShimmerTable row={3} col={4} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-course-thead">
              <tr>
                <th
                  onMouseEnter={() => setHoveredColumn('course_name')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('course_name')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Course&nbsp;Name</span>
                      <div className={`filter-arrow ${sortColumn === 'course_name' ? 'active' : ''}`}>
                        {(hoveredColumn === 'course_name' || sortColumn === 'course_name') && ( 
                          <span> 
                            {sortColumn === 'course_name' ? sortDirection === 'asc' 
                            ? <span className="material-symbols-outlined">
                                arrow_upward
                              </span> 
                            : <span className="material-symbols-outlined">
                                arrow_downward
                              </span>
                            : <span className="material-symbols-outlined">
                                filter_alt
                              </span> 
                            } 
                          </span> 
                        )}
                      </div>
                    </div>
                  </th>
                <th
                  onMouseEnter={() => setHoveredColumn('course_abb')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('course_abb')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Course&nbsp;Abbreviation</span>
                      <div className={`filter-arrow ${sortColumn === 'course_abb' ? 'active' : ''}`}>
                        {(hoveredColumn === 'course_abb' || sortColumn === 'course_abb') && ( 
                          <span> 
                            {sortColumn === 'course_abb' ? sortDirection === 'asc' 
                            ? <span className="material-symbols-outlined">
                                arrow_upward
                              </span> 
                            : <span className="material-symbols-outlined">
                                arrow_downward
                              </span>
                            : <span className="material-symbols-outlined">
                                filter_alt
                              </span> 
                            } 
                          </span> 
                        )}
                      </div>
                    </div>
                </th>
                {role === 'admin' && <th className="action-column">Action</th>}
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((course) => {

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