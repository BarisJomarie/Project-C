import React, { useMemo, useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";
import ConfirmModal from "../../utils/ConfirmModal";
import PublicationPrint from "../../utils/print/PublicationPrint";
import * as XLSX from 'xlsx';
import useSortableTable from "../../hooks/useSortableTable";

const DepartmentResearchPublicationTable = ({ publication, loading, department, user, fetchPublications }) => {
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
    return publication.filter(item => {
      // Author filter
      const matchesAuthor = author
        ? item.pub_author?.toLowerCase().includes(author.toLowerCase())
        : true;

      // Year range filter
      const matchesYear = yearRange.start || yearRange.end
        ? (() => {
          const raw = item.date_of_publication;

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

      return matchesAuthor && matchesYear;
    });
  }, [publication, author, yearRange]);
  
  const { 
    sortedData, 
    sortColumn, 
    sortDirection, 
    hoveredColumn, 
    setHoveredColumn, 
    handleSort,
    resetSort
  } = useSortableTable(filteredData);

  const handleExportPublicationToExcel = () => {
    try {
      const exportData = publication.map((item, index) => ({
        '#': index + 1,
        'Published Title': item.published_title || '',
        'Author': item.pub_author || '',
        'Co-author': Array.isArray(item.co_authors) ? item.co_authors.filter(co => co && co.trim()).join(', ') : (item.co_authors || ''),
        'Title of Journal / Publication': item.journal_title || '',
        'Conference / Proceedings': item.conference_or_proceedings || '',
        'Publisher': item.publisher || '',
        'Date of Publication': item.date_of_publication ? item.date_of_publication : '',
        'DOI': item.doi || '',
        'ISSN / ISBN': item.issn_isbn || '',
        'Volume & Issue No.': item.volume_issue || '',
        'Index': Array.isArray(item.index_type) ? item.index_type.filter(idx => idx && idx.trim()).join(', ') : (item.index_type || '')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths for better alignment
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 50 },  // Published Title
        { wch: 25 },  // Author
        { wch: 25 },  // Co-author
        { wch: 40 },  // Title of Journal
        { wch: 35 },  // Conference
        { wch: 30 },  // Publisher
        { wch: 20 },  // Date
        { wch: 40 },  // DOI
        { wch: 25 },  // ISSN/ISBN
        { wch: 20 },  // Volume
        { wch: 30 }   // Index
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Research Publication');
      
      XLSX.writeFile(wb, `Research_Publication_${department.department_abb || 'Export'}_${new Date().getFullYear()}.xlsx`);
      
      showToast('success', 'Export Successful', 'Research Publication data exported to Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showToast('error', 'Export Failed', 'Failed to export data to Excel');
    }
  };

  // DELETE RESEARCH PUBLICATION
  const handleDeletePublication = (id) => {
    const publications = publication.find(p => p.id === id);
    if (!publications) return showToast('error', 'Not Found', 'Publication not found.');

    showModal(
      'Deleting Publication',
      <>
        Are you sure you want to delete this publication? <br/><br/>
        Title: <strong>{publications.published_title}</strong>
      </>,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/publication/delete/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          showToast('success', 'Deleted', 'Publication deleted successfully.');
          fetchPublications();
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete publication.');
        } finally {
          closeModal();
        }
      },
      'Delete Publication'
    );
  };

  return (
    <>
      {loading 
        ? <div className="department-buttons-filter-container">
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
                  onClick={() => navigate(`/user/department/${dep_id}/research-publication-add`)}
                  name="dep-publication"
                >
                  <span className="material-symbols-outlined">
                    add
                  </span>
                  <div className="slide-info">
                    Add Research Publication
                  </div>
                </button>
                
              </div>

              <div className="slider-button">
                <button 
                  type="button" 
                  onClick={() => PublicationPrint(showModal, closeModal)}
                  name="dep-publication"
                  >
                    <span className="material-symbols-outlined">
                      print
                    </span>
                    <div className="slide-info">
                      Print Current Publication Table
                    </div>
                </button>
              </div>

              <div className="slider-button">
                <button 
                  type="button" 
                  onClick={handleExportPublicationToExcel}
                  name="dep-publication"
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
                  name='dep-publication'
                  type="text" 
                  value={author} 
                  onChange={(e) => setAuthor(e.target.value)} 
                  />
              </div>

              <div className="year-range">
                <input 
                  type="number"
                  name="dep-publication" 
                  placeholder="Start Year (YYYY)" 
                  value={yearRange.start} 
                  onChange={(e) => setYearRange({ 
                    ...yearRange, start: e.target.value 
                  })} 
                  /> 
                -
                <input 
                  type="number" 
                  name="dep-publication"
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
                  name="dep-publication"
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
        <h4>Total Publications Found: <span>{sortedData.length}</span></h4>
      </div>

      {loading ? <ShimmerTable row={6} col={4} /> : (
        <div className="table-container sticky" id="printable-table">
          <table>
            <thead className="hid-default stick-header dep-publication-thead">
              <tr>
                <th colSpan={3} style={{ textAlign: "left", border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  FACULTY RESEARCH ENGAGEMENT<br />
                </th>
                <th colSpan={7} style={{ textAlign: "center", border: 'none', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  RESEARCH PUBLICATIONS<br />
                </th>
                <th colSpan={3} style={{ textAlign: "right", border: '1px solid black', padding: '15px 10px', fontSize: '1em', fontWeight: 'bold' }}>
                  {new Date().getFullYear()}
                </th>
                <th style={{display: 'none'}}></th>
              </tr>

              <tr className="esp-tr">
                <th className="hid-th">#</th>
                <th
                  onMouseEnter={() => setHoveredColumn('published_title')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('published_title')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Published Title</span>
                      <div className={`filter-arrow ${sortColumn === 'published_title' ? 'active' : ''}`}>
                        {(hoveredColumn === 'published_title' || sortColumn === 'published_title') && ( 
                          <span> 
                            {sortColumn === 'published_title' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('pub_author')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('pub_author')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Author</span>
                      <div className={`filter-arrow ${sortColumn === 'pub_author' ? 'active' : ''}`}>
                        {(hoveredColumn === 'pub_author' || sortColumn === 'pub_author') && ( 
                          <span> 
                            {sortColumn === 'pub_author' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('journal_title')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('journal_title')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Title of Journal / Publication</span>
                      <div className={`filter-arrow ${sortColumn === 'journal_title' ? 'active' : ''}`}>
                        {(hoveredColumn === 'journal_title' || sortColumn === 'journal_title') && ( 
                          <span> 
                            {sortColumn === 'journal_title' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('conference_or_proceedings')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('conference_or_proceedings')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Conference / Proceedings</span>
                      <div className={`filter-arrow ${sortColumn === 'conference_or_proceedings' ? 'active' : ''}`}>
                        {(hoveredColumn === 'conference_or_proceedings' || sortColumn === 'conference_or_proceedings') && ( 
                          <span> 
                            {sortColumn === 'conference_or_proceedings' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('publisher')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('publisher')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Publisher</span>
                      <div className={`filter-arrow ${sortColumn === 'publisher' ? 'active' : ''}`}>
                        {(hoveredColumn === 'publisher' || sortColumn === 'publisher') && ( 
                          <span> 
                            {sortColumn === 'publisher' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('date_of_publication')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('date_of_publication')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Date of Publication</span>
                      <div className={`filter-arrow ${sortColumn === 'date_of_publication' ? 'active' : ''}`}>
                        {(hoveredColumn === 'date_of_publication' || sortColumn === 'date_of_publication') && ( 
                          <span> 
                            {sortColumn === 'date_of_publication' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('doi')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('doi')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>DOI</span>
                      <div className={`filter-arrow ${sortColumn === 'doi' ? 'active' : ''}`}>
                        {(hoveredColumn === 'doi' || sortColumn === 'doi') && ( 
                          <span> 
                            {sortColumn === 'doi' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('issn_isbn')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('issn_isbn')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>ISSN / ISBN</span>
                      <div className={`filter-arrow ${sortColumn === 'issn_isbn' ? 'active' : ''}`}>
                        {(hoveredColumn === 'issn_isbn' || sortColumn === 'issn_isbn') && ( 
                          <span> 
                            {sortColumn === 'issn_isbn' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('volume_issue')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('volume_issue')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Volume & Issue No.</span>
                      <div className={`filter-arrow ${sortColumn === 'volume_issue' ? 'active' : ''}`}>
                        {(hoveredColumn === 'volume_issue' || sortColumn === 'volume_issue') && ( 
                          <span> 
                            {sortColumn === 'volume_issue' ? sortDirection === 'asc' 
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
                  onMouseEnter={() => setHoveredColumn('index_type')}
                  onMouseLeave={() => setHoveredColumn(null)}
                  onClick={() => handleSort('index_type')}
                  className="filter-col"
                  >
                    <div className="filter-inner">
                      <span>Index</span>
                      <div className={`filter-arrow ${sortColumn === 'index_type' ? 'active' : ''}`}>
                        {(hoveredColumn === 'index_type' || sortColumn === 'index_type') && ( 
                          <span> 
                            {sortColumn === 'index_type' ? sortDirection === 'asc' 
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
                sortedData.map((item, index) => (
                  <tr key={item.id}>
                    <td className="hid-td">{index + 1}</td>
                    <td>{item.published_title}</td>
                    <td>{item.pub_author}</td>
                    <td>
                      {Array.isArray(item.co_authors) && item.co_authors.length > 0
                        ? item.co_authors.filter(co => co && co.trim() !== "").map((co, idx) => <div key={idx} style={{marginBottom: '4px'}}>{co}</div>)
                        : 'N/A'}
                    </td>
                    <td>{item.journal_title}</td>
                    <td>{item.conference_or_proceedings || "N/A"}</td>
                    <td>{item.publisher}</td>
                    <td>{item.date_of_publication ? item.date_of_publication : "N/A"}</td>
                    <td>{item.doi || "N/A"}</td>
                    <td>{item.issn_isbn}</td>
                    <td>{item.volume_issue || "N/A"}</td>
                    <td>
                      {Array.isArray(item.index_type) && item.index_type.length > 0
                        ? item.index_type.map((index, idx) => <div key={idx} style={{marginBottom: '4px'}}>{index}</div>)
                        : 'N/A'}
                    </td>
                    <td className="action-column">
                      <button
                        onClick={() => handleDeletePublication(item.id)}
                        className="delete-btn"
                        >
                        <span className="material-symbols-outlined delete-icon">delete</span>
                        <span className="tooltip">Delete Publication</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="15">No research publication records found.</td>
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

export default DepartmentResearchPublicationTable;