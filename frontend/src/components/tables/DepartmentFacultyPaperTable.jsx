import React, { useMemo, useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../utils/ConfirmModal";
import { showToast } from "../../utils/toast";
import useSortableTable from "../../hooks/useSortableTable";

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

  const [researchers, setResearchers] = useState('');
  const [yearRange, setYearRange] = useState({ start: '', end: '' });

  const filteredData = useMemo(() => {
    return fPapers.filter(item => {
      // Author filter
      const matchedResearchers = researchers
        ? Array.isArray(item.researchers)
          ? item.researchers.some(r => r.toLowerCase().includes(researchers.toLowerCase()))
          : item.researchers?.toLowerCase().includes(researchers.toLowerCase())
        : true;

      // Year range filter
      const matchesYear = yearRange.start || yearRange.end
        ? (() => {
          const raw = String(item.academic_year);

          // Extract all 4-digit years from the string
          const years = raw.match(/\d{4}/g)?.map(y => parseInt(y)) || [];

          // If no year found, skip
          if (years.length === 0) return true;

          // If it's a range like "May-June 2025", years will just be [2025]
          // If it's "2024-2025", years will be [2024, 2025]
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);

          const start = yearRange.start ? parseInt(yearRange.start) : null;
          const end = yearRange.end ? parseInt(yearRange.end) : null;

          // Check overlap between presentation year(s) and filter range
          return (!start || maxYear >= start) && (!end || minYear <= end);
        })()
        : true;

      return matchedResearchers && matchesYear;
    });
  }, [fPapers, researchers, yearRange]);

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
              
            </div>

            <div className="right">
              <div>
                <input 
                  placeholder='Enter A Researcher' 
                  name='dep-faculty'
                  type="text" 
                  value={researchers} 
                  onChange={(e) => setResearchers(e.target.value)} 
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
                    setResearchers('');
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

      <div className={`count-div ${researchers !== '' || yearRange.start !== '' || yearRange.end !== '' ? 'active' : ''}`}>
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

export default DepartmentFacultyPaperTable;