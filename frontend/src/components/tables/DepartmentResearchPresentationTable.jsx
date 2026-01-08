import React, { useState, useMemo } from "react";
import axios from "axios";
import ConfirmModal from "../../utils/ConfirmModal";
import {ShimmerButton, ShimmerTable} from "react-shimmer-effects";
import {useNavigate} from "react-router-dom";
import * as XLSX from 'xlsx';
import { showToast } from "../../utils/toast";
import PresentationPrint from "../../utils/print/PresentationPrint";
import '../../styles/department.css';
import '../../styles/table.css';
import useSortableTable from "../../hooks/useSortableTable";

const DepartmentResearchPresentationTable = ({ presentations, loading, department, user, fetchPresentation }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;
  const dep_id = department.department_id;

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

  const [author, setAuthor] = useState('');
  const [yearRange, setYearRange] = useState({ start: '', end: '' });

  const filteredData = useMemo(() => {
    return presentations.filter(item => {
      // Author filter
      const matchesAuthor = author
        ? item.author?.toLowerCase().includes(author.toLowerCase())
        : true;

      // Year range filter
      const matchesYear = yearRange.start || yearRange.end
        ? (() => {
            const year = new Date(item.date_presented).getFullYear();
            const start = yearRange.start ? parseInt(yearRange.start) : null;
            const end = yearRange.end ? parseInt(yearRange.end) : null;
            return (!start || year >= start) && (!end || year <= end);
          })()
        : true;

      return matchesAuthor && matchesYear;
    });
  }, [presentations, author, yearRange]);

  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    hoveredColumn, 
    setHoveredColumn, 
    handleSort,
    resetSort
  } = useSortableTable(filteredData);

  const facultyCounts = useMemo(() => {
    // use sortedData if you want counts to reflect the table as displayed
    const baseData = sortedData ?? presentations ?? [];
    
    return baseData.reduce((acc, item) => {
      const faculty = item.faculty || 'Unknown';
      acc[faculty] = (acc[faculty] || 0) + 1;
      return acc;
    }, {});
  }, [sortedData, presentations]);


  function formatDateRange(startDate, endDate) {
    if (!startDate) return '';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    const monthDay = { month: 'long', day: 'numeric' };

    // If same day
    if (start.getTime() === end.getTime()) {
      return start.toLocaleDateString('en-US', { ...monthDay, year: 'numeric' });
    }

    // Same month + year → "May 16–18, 2025"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'long' })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    }

    // Different months/years
    return `${start.toLocaleDateString('en-US', monthDay)} - ${end.toLocaleDateString('en-US', monthDay)}, ${end.getFullYear()}`;
  }

  // PRINT PRESENTATION
  const handleExportPresentationToExcel = () => {
    try {
      const exportData = presentations.map((item, index) => ({
        'Department': item.department_abb || department?.department_abb || '',
        'Author': item.author || '',
        'Co-author': Array.isArray(item.co_authors) ? item.co_authors.filter(co => co && co.trim()).join(', ') : (item.co_authors || ''),
        'Title of Research Paper': item.research_title || '',
        'SDG Alignment': Array.isArray(item.sdg_alignment) ? item.sdg_alignment.join(', ') : (item.sdg_alignment || ''),
        'Conference Title': item.conference_title || '',
        'Organizer': item.organizer || '',
        'Venue': item.venue || '',
        'Date Presented': formatDateRange(item.date_presented, item.end_date_presented) || '',
        'Type of Conference': item.conference_category || '',
        'Special Order No.': item.special_order_no || '',
        'Status': item.status_engage || '',
        'Funding Source': item.funding_source_engage || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better alignment
      ws['!cols'] = [
        { wch: 12 },  // Department
        { wch: 25 },  // Author
        { wch: 25 },  // Co-author
        { wch: 50 },  // Title of Research Paper
        { wch: 35 },  // SDG Alignment
        { wch: 40 },  // Conference Title
        { wch: 35 },  // Organizer
        { wch: 30 },  // Venue
        { wch: 20 },  // Date Presented
        { wch: 25 },  // Type of Conference
        { wch: 20 },  // Special Order No.
        { wch: 12 },  // Status
        { wch: 18 }   // Funding Source
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Research Presentation');
      
      XLSX.writeFile(wb, `Research_Presentation_${department[0]?.department_abb || 'Export'}_${new Date().getFullYear()}.xlsx`);
      
      showToast('success', 'Export Successful', 'Research Presentation data exported to Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('error', 'Export Failed', 'Failed to export data to Excel');
    }
  };

  // DELETE PRESENTATION PAPERS
  const handleDeletePresentation = (id) => {
    const presentation = presentations.find(p => p.id === id);
    if (!presentation) return showToast('error', 'Not Found', 'Presentation not found.');

    showModal(
      'Deleting Presentation',
      <>
        Are you sure you want to delete this presentation? <br/><br/>
        Title: <strong>{presentation.research_title}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/presentation/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast('success', 'Deleted', 'Presentation deleted successfully.');
          fetchPresentation(); // refresh list
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete presentation.');
        } finally {
          closeModal();
        }
      },
      'Delete Presentation'
    );
  };

  return (
    <>
      {loading ? 
      <div className="department-buttons-filter-container">
        <div className="left">
          <ShimmerButton size="lg"/>
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
                onClick={() => navigate(`/user/department/${dep_id}/research-presentation-add`)}
                name="dep-presentation"
              >
                <span className="material-symbols-outlined">
                  add
                </span>
                <div className="slide-info">
                  Add Research Presentation
                </div>
              </button>
              
            </div>

            <div className="slider-button">
              <button 
                type="button" 
                onClick={() => PresentationPrint(showModal, closeModal)} 
                name="dep-presentation"
                >
                  <span className="material-symbols-outlined">
                    print
                  </span>
                  <div className="slide-info">
                    Print Current Presentation Table
                  </div>
              </button>
            </div>

            <div className="slider-button">
              <button 
                type="button" 
                onClick={handleExportPresentationToExcel}
                name="dep-presentation"
                >
                  <span className="material-symbols-outlined">
                    file_export
                    </span>
                  <div className="slide-info">
                    Save Current Table as Excel
                  </div>
              </button>
            </div>
          </div>
          
          <div className="right">

            <div>
              <input 
                placeholder='Enter Author' 
                name='dep-presentation'
                type="text" 
                value={author} 
                onChange={(e) => setAuthor(e.target.value)} 
                />
            </div>

            <div className="year-range">
              <input 
                type="number" 
                name="dep-presentation"
                placeholder="Start Year (YYYY)" 
                value={yearRange.start} 
                onChange={(e) => setYearRange({ 
                  ...yearRange, start: e.target.value 
                })} 
                /> 
              -
              <input 
                type="number" 
                name="dep-presentation"
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
                  setAuthor('');
                  setYearRange({ start: '', end: '' });
                  resetSort();
                }} 
                type="button"
                name="dep-presentation"
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

      <div className={`count-div ${author !== '' || yearRange.start !== '' || yearRange.end !== '' ? 'active' : ''}`}>
        <h4>Total Presentations Found: <span>{sortedData.length}</span></h4>
      </div>
      
      {loading ? <ShimmerTable row={6} col={4} /> : (
        <div className="table-container sticky" id="printable-table">
          <table>
            <thead className="hid-default stick-header dep-presentation-thead">
              <tr>
                <th colSpan={3} style={{textAlign: 'left', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase'}}>FACULTY RESEARCH ENGAGEMENT<br/></th>
                <th colSpan={8} style={{textAlign: 'center', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase'}}>RESEARCH PAPER PRESENTATION<br/></th>
                <th colSpan={3} style={{textAlign: 'right', border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold'}}>{new Date().getFullYear()}</th>
                <th style={{display: 'none'}}></th>
              </tr>

              <tr className="esp-tr">
                <th className="hid-th">Department</th>
                <th
                  onMouseEnter={() => setHoveredColumn('author')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('author')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                       <span>Author</span>
                      <div className={`filter-arrow ${sortColumn === 'author' ? 'active' : ''}`}>
                        {(hoveredColumn === 'author' || sortColumn === 'author') && ( 
                          <span> 
                            {sortColumn === 'author' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('co_authors')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('co_authors')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Co-author</span>
                      <div className={`filter-arrow ${sortColumn === 'co_authors' ? 'active' : ''}`}>
                        {(hoveredColumn === 'co_authors' || sortColumn === 'co_authors') && ( 
                          <span> 
                            {sortColumn === 'co_authors' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('research_title')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('research_title')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Title of Research Paper</span>
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
                  onMouseEnter={() => setHoveredColumn('sdg_alignment')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('sdg_alignment')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>SDG Alignment</span>
                      <div className={`filter-arrow ${sortColumn === 'sdg_alignment' ? 'active' : ''}`}>
                        {(hoveredColumn === 'sdg_alignment' || sortColumn === 'sdg_alignment') && ( 
                          <span> 
                            {sortColumn === 'sdg_alignment' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('conference_title')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('conference_title')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Conference Title</span>
                      <div className={`filter-arrow ${sortColumn === 'conference_title' ? 'active' : ''}`}>
                        {(hoveredColumn === 'conference_title' || sortColumn === 'conference_title') && ( 
                          <span> 
                            {sortColumn === 'conference_title' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('organizer')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('organizer')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Organizer</span>
                      <div className={`filter-arrow ${sortColumn === 'organizer' ? 'active' : ''}`}>
                        {(hoveredColumn === 'organizer' || sortColumn === 'organizer') && ( 
                          <span> 
                            {sortColumn === 'organizer' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('venue')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('venue')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Venue</span>
                      <div className={`filter-arrow ${sortColumn === 'venue' ? 'active' : ''}`}>
                        {(hoveredColumn === 'venue' || sortColumn === 'venue') && ( 
                          <span> 
                            {sortColumn === 'venue' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('date_presented')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('date_presented')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Date Presented</span>
                      <div className={`filter-arrow ${sortColumn === 'date_presented' ? 'active' : ''}`}>
                        {(hoveredColumn === 'date_presented' || sortColumn === 'date_presented') && ( 
                          <span> 
                            {sortColumn === 'date_presented' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('conference_category')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('conference_category')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Type of Conference</span>
                      <div className={`filter-arrow ${sortColumn === 'conference_category' ? 'active' : ''}`}>
                        {(hoveredColumn === 'conference_category' || sortColumn === 'conference_category') && ( 
                          <span> 
                            {sortColumn === 'conference_category' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('special_order_no')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('special_order_no')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Special Order No.</span>
                      <div className={`filter-arrow ${sortColumn === 'special_order_no' ? 'active' : ''}`}>
                        {(hoveredColumn === 'special_order_no' || sortColumn === 'special_order_no') && ( 
                          <span> 
                            {sortColumn === 'special_order_no' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('status_engage')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('status_engage')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Status</span>
                      <div className={`filter-arrow ${sortColumn === 'status_engage' ? 'active' : ''}`}>
                        {(hoveredColumn === 'status_engage' || sortColumn === 'status_engage') && ( 
                          <span> 
                            {sortColumn === 'status_engage' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('funding_source_engage')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('funding_source_engage')}
                  className="filter-col"
                  >
                    <div className="filter-inner"> 
                      <span>Funding Source</span>
                      <div className={`filter-arrow ${sortColumn === 'funding_source_engage' ? 'active' : ''}`}>
                        {(hoveredColumn === 'funding_source_engage' || sortColumn === 'funding_source_engage') && ( 
                          <span> 
                            {sortColumn === 'funding_source_engage' ? sortDirection === 'asc' 
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
                sortedData.map(item => {
                  const isSelfFunded = item.funding_source_engage?.toLowerCase() === "self funded";

                  return (
                    <tr key={item.id} className={isSelfFunded ? "self-funded" : ""}>
                      <td className="hid-td">{item.department_abb || department[0]?.department_abb || 'N/A'}</td>
                      <td>{item.author}</td>
                      <td>
                        {Array.isArray(item.co_authors) && item.co_authors.length > 0
                          ? item.co_authors.filter(co => co && co.trim()).map((co, idx) => <div key={idx} style={{marginBottom: '4px'}}>{co}</div>)
                          : item.co_authors || 'N/A'}
                      </td>
                      <td>{item.research_title}</td>
                      <td>
                        {Array.isArray(item.sdg_alignment) && item.sdg_alignment.length > 0
                          ? item.sdg_alignment.map((sdg, i) => (
                              <div key={i} style={{marginBottom: '4px'}}>{sdg}</div>
                            ))
                          : typeof item.sdg_alignment === 'string' 
                            ? (() => {
                                try {
                                  const parsed = JSON.parse(item.sdg_alignment);
                                  return Array.isArray(parsed) && parsed.length > 0 
                                    ? parsed.map((sdg, i) => <div key={i} style={{marginBottom: '4px'}}>{sdg}</div>)
                                    : 'N/A';
                                } catch {
                                  return item.sdg_alignment || 'N/A';
                                }
                              })()
                            : 'N/A'}
                      </td>
                      <td>{item.conference_title}</td>
                      <td>{item.organizer}</td>
                      <td>{item.venue}</td>
                      <td>{formatDateRange(item.date_presented, item.end_date_presented)}</td>
                      <td>{item.conference_category}</td>
                      <td>{item.special_order_no || "N/A"}</td>
                      <td>{
                        item.status_engage ? 
                          item.status_engage === 'completed'
                          ? 'Completed'
                          : item.status_engage === 'ongoing'
                          ? 'Ongoing'
                          : item.status_engage === 'proposed'
                          && 'Proposed'
                        : ''
                      }</td>
                      <td>{item.funding_source_engage}</td>
                      <td className="action-column">
                        <button
                          onClick={() => handleDeletePresentation(item.id)}
                          className="delete-btn"
                        >
                          <span className="material-symbols-outlined delete-icon">delete</span>
                          <span className="tooltip">Delete Presentation</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={15}>No research presentation records found.</td>
                </tr>
              )}
            </tbody>
          </table> 
          <div className="print-footer-left">
            PREPARED BY: {user ? `${user.firstname} ${user.lastname}` : ""}
          </div>
          <div className="print-footer-center">
            {department.department_name}
          </div>
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

export default DepartmentResearchPresentationTable;