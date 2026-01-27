import React, { useMemo, useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../utils/ConfirmModal";
import { showToast } from "../../utils/toast";
import useSortableTable from "../../hooks/useSortableTable";
import SummaryModal from "../SummaryModal";
import { useGroupedByField } from "../../hooks/useGroupedByField";
import Select from 'react-select'
import reactSelect from '../../styles/reactSelect';
import '../../styles/editingModal.css';

const DepartmentFacultyPaperTable = ({ fPapers, loading, role, dep_id, fetchFacultyPapers }) => {
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

  const [yearRange, setYearRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentCourses, setDepartmentCourses] = useState([]);

  const { isOpen, open, close, grouped } = useGroupedByField(fPapers, "researchers");

  const [editingPaperId, setEditingPaperId] = useState(null);
  const editingPaper = fPapers.find(p => p.research_id === editingPaperId);
  const [editingData, setEditingData] = useState({
    status: '',
    funding_source: '',
    semester: '',
    sy: null,
    course_id: null,
    researchers: [],
    title: '',
    abstract: '',
    keywords: '',
    sdg_number: [],
    sdg_labels: [],
  });

  const sdgs = [
    { number: 1, label: "No Poverty" },
    { number: 2, label: "Zero Hunger" },
    { number: 3, label: "Good Health and Well-being" },
    { number: 4, label: "Quality Education" },
    { number: 5, label: "Gender Equality" },
    { number: 6, label: "Clean Water and Sanitation" },
    { number: 7, label: "Affordable and Clean Energy" },
    { number: 8, label: "Decent Work and Economic Growth" },
    { number: 9, label: "Industry, Innovation and Infrastructure" },
    { number: 10, label: "Reduced Inequalities" },
    { number: 11, label: "Sustainable Cities and Communities" },
    { number: 12, label: "Responsible Consumption and Production" },
    { number: 13, label: "Climate Action" },
    { number: 14, label: "Life Below Water" },
    { number: 15, label: "Life on Land" },
    { number: 16, label: "Peace, Justice and Strong Institutions" },
    { number: 17, label: "Partnerships for the Goals" }
  ];

  const funding_source = [
    {value: 'self-funded', label: 'Self-Funded'},
    {value: 'earist', label: 'EARIST'},
  ]

  const status = [
    {value: 'proposed', label: 'Proposed'},
    {value: 'on-going', label: 'Ongoing'},
    {value: 'completed', label: 'Completed'},
  ]

  const semester = [
    {value: '1st', label: '1st'},
    {value: '2nd', label: '2nd'}
  ]

  const handleEdit = (paper) => {
    getDepartmentCourses();
    setEditingPaperId(paper.research_id);
    setEditingData({
      research_id: paper.research_id,
      funding_source: paper.funding_source || '',
      status: paper.status || '',
      semester: paper.semester || '',
      sy: paper.academic_year || null,
      course_id: paper.course_id || null,
      researchers: Array.isArray(paper.researchers) 
        ? paper.researchers 
        : paper.researchers 
          ? [paper.researchers]
          : [],
      title: paper.research_title || '',
      abstract: paper.research_abstract || '',
      keywords: paper.research_conclusion || '',
      sdg_number: paper.sdg_number || [],
      sdg_labels: paper.sdg_labels || [],
    });
  };

  const saveEdit = async (editingData) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/users/research-faculty-paper/${editingData.research_id}`, 
        editingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Update paper success:", res.data);
      setEditingData(null);
      fetchFacultyPapers();
    } catch (error) {
      console.error("Error updating paper:", error.response?.data || error.message);
    }
  };

  // GET DEPARTMENT COURSES
  const getDepartmentCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/department-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { department_id: dep_id },
      });

      if (Array.isArray(response.data)) {
        setDepartmentCourses(response.data);
        // console.log('Courses fetched:', response.data);
      } else {
        setDepartmentCourses([]);
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

 const filteredData = useMemo(() => {
    return fPapers.filter(item => {
      // Multi-field search
      const matchesSearch = searchTerm
        ? ['research_title', 'funding_source', 'sdg_labels', 'researchers'].some(key => {
            const value = item[key];
            if (!value) return false;

            if (Array.isArray(value)) {
              return value.some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
            }

            return String(value).toLowerCase().includes(searchTerm.toLowerCase());
          })
        : true;

      // Year range filter
      const matchesYear = yearRange.start || yearRange.end
        ? (() => {
            const raw = String(item.academic_year);
            const years = raw.match(/\d{4}/g)?.map(y => parseInt(y)) || [];
            if (years.length === 0) return true;

            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);

            const start = yearRange.start ? parseInt(yearRange.start) : null;
            const end = yearRange.end ? parseInt(yearRange.end) : null;

            return (!start || maxYear >= start) && (!end || minYear <= end);
          })()
        : true;

      return matchesSearch && matchesYear;
    });
  }, [fPapers, searchTerm, yearRange]);

// Functions to open/close modal
const openSummaryModal = () => setIsSummaryOpen(true);
const closeSummaryModal = () => setIsSummaryOpen(false);

  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    hoveredColumn, 
    setHoveredColumn, 
    handleSort,
    resetSort
  } = useSortableTable(filteredData);

  // DELETE PAPER
  const handleDeletePaper = (id) => {
    const paper = fPapers.find((p) => p.research_id === id)
      || fPapers.find((p) => p.research_id === id);

    if (!paper) return showToast('error', 'Not Found', 'Paper not found.');

    showModal(
      'Deleting Paper',
      <>Are you sure you want to delete this Faculty Research paper?
        <br/><br/>
        Title: <strong>"{paper.research_title}"</strong>?</>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/research-delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('success', 'Paper Deleted', 'Paper deleted successfully.');
          fetchFacultyPapers();
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete paper.');
        } finally {
          closeModal();
        }
      },
      'Delete Paper'
    );
  }

  const sdgColors = [
    "#e5233d", "#dda73a", "#4ca146", "#c7212f",
    "#ef402d", "#27bfe6", "#fbc412", "#fbc412",
    "#f26a2e", "#e01483", "#f89d2a", "#bf8d2c",
    "#407f46", "#1f97d4", "#59ba47", "#136a9f",
    "#14496b"
  ];

  function getSdgColor(numbers) {
    if (!numbers || numbers.length === 0) return '#0f172a';
    const num = Array.isArray(numbers) ? numbers[0] : numbers;
    const index = parseInt(num, 10) - 1;

    return sdgColors[index] || '#0f172a';
  }


  return (
    <>
      {loading 
        ? <div className="department-buttons-filter-container">
            <div className="left">
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
            </div>
            <div className="right">
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
              <ShimmerButton size="lg"/>
            </div>
          </div>
        : <div className="department-buttons-filter-container">
            <div className="left">
              <div className="slider-button">
                <button
                  type="button"
                  onClick={() => navigate(`/user/department/${dep_id}/research_add`)}
                  name="dep-faculty"
                >
                  <span className="material-symbols-outlined">
                    add
                  </span>
                  <div className="slide-info">
                    Add Faculty Research
                  </div>
                </button>
                
              </div>

              {role !== 'faculty' && (
                <div className="slider-button">
                  <button 
                    type="button" 
                    onClick={() => navigate(`/user/department/${dep_id}/ai_report`)}
                    name="dep-faculty"
                    >
                      <span className="material-symbols-outlined">
                        article_shortcut
                      </span>
                      <div className="slide-info">
                        AI Analysis Report
                      </div>
                  </button>
                </div>
              )}

              <div className="slider-button">
                <button 
                  type="button" 
                  onClick={open}
                  name="dep-faculty"
                  >
                    <span className="material-symbols-outlined">
                    article
                    </span>
                    <div className="slide-info">
                      Report Count of Produce Research
                    </div>
                </button>
              </div>
            </div>

            <div className="right">
              <div>
                <input 
                  placeholder='Search' 
                  name='dep-faculty'
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}  
                  />
              </div>

              <div className="year-range">
                <input 
                  type="number"
                  name="dep-faculty" 
                  placeholder="Start Year (YYYY)" 
                  value={yearRange.start} 
                  onChange={(e) => setYearRange({ 
                    ...yearRange, start: e.target.value 
                  })} 
                  /> 
                -
                <input 
                  type="number" 
                  name="dep-faculty"
                  placeholder="End Year (YYYY)" 
                  value={yearRange.end} 
                  onChange={(e) => setYearRange({ 
                    ...yearRange, end: e.target.value 
                    })} 
                  />
              </div>

              <div className="slider-button">
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setYearRange({ start: '', end: '' });
                    resetSort();
                  }} 
                  type="button"
                  name="dep-faculty"
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

      <div className={`count-div ${searchTerm !== '' || yearRange.start !== '' || yearRange.end !== '' ? 'active' : ''}`}>
        <h4>Total Faculty Research Found: <span>{sortedData.length}</span></h4>
      </div>

      {loading ? <ShimmerTable row={5} col={4} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-faculty-thead">
              <tr className="esp-tr faculty">
                <th
                  onMouseEnter={() => setHoveredColumn('research_title')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('research_title')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Title of Research</span>
                      <div className={`filter-arrow ${sortColumn === 'research_title' ? 'active' : ''}`}>
                        {(hoveredColumn === 'research_title' || sortColumn === 'research_title') && ( 
                          <span> 
                            {sortColumn === 'research_title' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('researchers')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('researchers')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Name of Researchers</span>
                      <div className={`filter-arrow ${sortColumn === 'researchers' ? 'active' : ''}`}>
                        {(hoveredColumn === 'researchers' || sortColumn === 'researchers') && ( 
                          <span> 
                            {sortColumn === 'researchers' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('funding_source')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('funding_source')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Funding&nbsp;Source<br/>(if any)</span>
                      <div className={`filter-arrow ${sortColumn === 'funding_source' ? 'active' : ''}`}>
                        {(hoveredColumn === 'funding_source' || sortColumn === 'funding_source') && ( 
                          <span> 
                            {sortColumn === 'funding_source' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('semester')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('semester')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Academic&nbsp;Year<br/>Sem&nbsp;and&nbsp;SY</span>
                      <div className={`filter-arrow ${sortColumn === 'semester' ? 'active' : ''}`}>
                        {(hoveredColumn === 'semester' || sortColumn === 'semester') && ( 
                          <span> 
                            {sortColumn === 'semester' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('sdg_labels')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('sdg_labels')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>SDG Label</span>
                      <div className={`filter-arrow ${sortColumn === 'sdg_labels' ? 'active' : ''}`}>
                        {(hoveredColumn === 'sdg_labels' || sortColumn === 'sdg_labels') && ( 
                          <span> 
                            {sortColumn === 'sdg_labels' ? sortDirection === 'asc' 
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
                <th className="action-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((paper) => {
                  const color = getSdgColor(paper.sdg_number);

                  return (
                    <tr key={paper.research_id} style={{ borderLeft: `8px solid ${color}` }}>
                      <td>
                        {paper.research_title}
                      </td>

                      <td>
                        {Array.isArray(paper.researchers)
                          ? paper.researchers.map((name, index) => (
                              <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{name}</div>
                            ))
                          : <div style={{textAlign: 'left'}}>{paper.researchers}</div>}
                      </td>

                      <td>
                        {
                          paper.funding_source === 'self-funded' 
                          ? 'Self-Funded' : paper.funding_source === 'earist' 
                          ? 'EARIST' 
                          : 'N/A'
                        }
                      </td> 
                      
                      <td>
                        {paper.semester}  {paper.academic_year}-{paper.academic_year + 1}
                      </td>

                      <td style={{color: color, fontWeight: '500'}}>
                        {Array.isArray(paper.sdg_labels) 
                        ? paper.sdg_labels.map((label, index) => (
                          <div key={index} style={{margin: '8px 0', textAlign: 'left'}}>{label}</div>
                          ))
                        : <div style={{textAlign: 'left'}}>{paper.sdg_labels}</div>}
                      </td>

                      <td className="action-column">
                        <button onClick={() => handleEdit(paper)}>
                          <span className="material-symbols-outlined edit-icon">edit</span>
                          <span className="tooltip">Edit Paper</span>
                        </button>
                        <button onClick={() => navigate(`/user/department/${dep_id}/paper/${paper.research_id}`)}>
                          <span className="material-symbols-outlined view-icon">visibility</span>
                          <span className="tooltip">View Paper</span>
                        </button>
                        <button onClick={() => handleDeletePaper(paper.research_id)}>
                          <span className="material-symbols-outlined delete-icon">delete</span>
                          <span className="tooltip">Delete Paper</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">No papers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editingPaperId && editingData && (
        <React.Fragment>
          <div className="edit-overlay">
            <div className="edit-container">
              <div className="edit-content">
                <div className="edit-content-header">
                  <h1>Editing: {editingPaper?.research_id}</h1>
                </div>
                <div className="edit-content-body">
                  <div className="body-input">
                    <label className="b-label">Title</label>
                    <input 
                      value={editingData.title} 
                      onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                      />
                  </div>
                  
                  <div className="body-input">
                    <label className="b-label">Abstract</label>
                    <textarea 
                      value={editingData.abstract} 
                      onChange={(e) => setEditingData({ ...editingData, abstract: e.target.value })}
                      rows={4}
                      />
                  </div>

                  <div className="body-input">
                    <label className="b-label">Keywords</label>
                    <input 
                      value={editingData.keywords} 
                      onChange={(e) => setEditingData({ ...editingData, keywords: e.target.value })}
                      />
                  </div>

                  <div className="body-input">
                    <label className="b-label">Researchers</label>
                    {editingData.researchers.map((researcher, index) => (
                      <input
                      key={index}
                      value={researcher}
                      onChange={(e) => {
                        const updatedResearchers = [...editingData.researchers];
                        updatedResearchers[index] = e.target.value;
                        setEditingData({ ...editingData, researchers: updatedResearchers });
                      }}
                      placeholder={`Researcher ${index + 1}`}
                    />
                  ))}
                  </div>

                  <div className="group-body-input">
                    <div className="body-input">
                      <label className="b-label">Academic Year</label>
                      <input 
                        value={editingData.sy} 
                        onChange={(e) => setEditingData({ ...editingData, sy: e.target.value })}
                        />
                    </div>

                    <div className="body-input"> 
                      <label className="b-label">Semester</label>
                      <Select 
                        name="semester" 
                      options={semester} 
                      value={ 
                        editingData.semester ? semester.find((s) => s.value === editingData.semester)
                        : null
                        }
                      onChange={(selected) =>
                        setEditingData({ ...editingData, semester: selected.value })
                        }
                      placeholder="-- Select Semester --"
                      styles={reactSelect}
                      />
                    </div>

                    <div className="body-input">
                      <label className="b-label">Status</label>
                      <Select 
                        name="status" 
                        options={status} 
                        value={ 
                          editingData.status ? status.find((s) => s.value === editingData.status)
                        : null
                        }
                      onChange={(selected) =>
                        setEditingData({ ...editingData, status: selected.value })
                        }
                      placeholder="-- Select Status --"
                      styles={reactSelect}
                      />
                    </div>

                    <div className="body-input"> 
                      <label className="b-label">Funding Source</label>
                      <Select 
                        name="funding_source" 
                      options={funding_source} 
                      value={ 
                        editingData.funding_source ? funding_source.find((s) => s.value === editingData.funding_source)
                        : null
                        }
                      onChange={(selected) =>
                        setEditingData({ ...editingData, funding_source: selected.value })
                        }
                      placeholder="-- Select Funding Source --"
                      styles={reactSelect}
                      />
                    </div>
                  </div>

                  <div className="body-input">
                    <label className="b-label">Course</label>
                    <Select name="course" options={departmentCourses.map((c) => ({
                      value: c.course_id,
                      label: c.course_name
                    }))}
                    value={
                      editingData.course_id
                        ? {
                            value: editingData.course_id,
                            label: departmentCourses.find(
                              (c) => c.course_id === editingData.course_id
                            )?.course_name
                          }
                        : null
                    }
                    onChange={(selected) =>
                      setEditingData({ ...editingData, course_id: selected.value })
                    }
                    placeholder="-- Select Course --"
                    styles={reactSelect}
                  />
                  </div>
                  <div className="sdg-checkbox-group">
                    <label>Select SDG</label>
                    {sdgs.map((goal) => (
                      <div key={goal.number}>
                        <label>
                          <input
                            type="checkbox"
                            value={goal.label}
                            checked={editingData.sdg_labels.includes(goal.label)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const label = goal.label;
                              const number = goal.number;

                              setEditingData((prev) => {
                                const updatedLabels = checked
                                  ? [...prev.sdg_labels, label]
                                  : prev.sdg_labels.filter((l) => l !== label);

                                const updatedNumbers = checked
                                  ? [...prev.sdg_number, number]
                                  : prev.sdg_number.filter((n) => n !== number);

                                return {
                                  ...prev,
                                  sdg_labels: updatedLabels,
                                  sdg_number: updatedNumbers,
                                };
                              });
                            }}
                          />
                          {goal.number}. {goal.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="edit-content-action">
                <button onClick={() => saveEdit(editingData)}>Save</button>
                <button className="close-button" onClick={() => setEditingPaperId(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}

      <ConfirmModal
        show={modalConfig.show}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        onCancel={closeModal}
        />

       <SummaryModal 
          isOpen={isOpen} 
          onClose={close} 
          grouped={grouped} 
          fields={["research_title", "sdg_labels", "department_name", 'course_abb', 'academic_year']}
/>

      <div className="toast-box" id="toast-box"></div>
    </>
  );
};

export default DepartmentFacultyPaperTable;