import React, { useState } from "react";
import axios from "axios";
import ConfirmModal from "../../utils/ConfirmModal";
import {ShimmerButton, ShimmerTable} from "react-shimmer-effects";
import {useNavigate} from "react-router-dom";
import * as XLSX from 'xlsx';
import { showToast } from "../../utils/toast";
import '../../styles/department.css';
import '../../styles/table.css';

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

  const confirmPrint = () => {
    showModal(
      'Printing Presentation',
      `This presentation will be printed. Do you want to continue?`,
      async () => {
        try {
          const printContents = document.getElementById('printable-table')?.innerHTML;
          if (!printContents) return;

          const printWindow = window.open('', '_blank', 'width=1200,height=800');

          printWindow.document.write(`
            <html>
            <head>
            <title>Research Presentation</title>
            <style>
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              body { 
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; 
                font-size: 0.85em; 
                background: #fff; 
                color: #000; 
                margin: 0;
                padding: 20px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse !important;
                page-break-inside: auto;
                border-left: none;
              }
              tbody tr {
                border-left: 2px solid #1e293b;
              }

              th, td { 
                border: none !important;
                padding: 8px 6px; 
                text-align: left; 
                vertical-align: top;
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead th {
                border: none !important;
              }
              tbody td {
                border: none !important;
              }
              tfoot td {
                border: none !important;
              }
              thead tr:first-child th {
                border: none !important;
                font-size: 1em;
                font-weight: bold;
                padding: 15px 10px;
                background: transparent;
                text-transform: uppercase;
              }
              thead tr:nth-child(2) th {
                background-color: #1e293b !important;
                color: white !important;
                font-weight: 600;
                padding: 10px 6px;
                border: none !important;
                text-transform: none;
                text-align: left;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              tbody td {
                font-size: 0.85em;
                line-height: 1.4;
                font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
              }
              tbody tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              tr.self-funded {
                background-color: #FFFF00 !important;
              }
              .print-footer {
                border-top: 1px solid #000;
                font-weight: 600;
                text-transform: uppercase;
                white-space: nowrap !important;
                vertical-align: middle;
              }

              .hid-th,
              .hid-td {
                visibility: visible;
              }

              @media print {
                
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                    @bottom-right {
                    content: "Page " counter(page);
                    font-size: 1em;
                    font-weight: 600;
                    font-family: 'Arial';
                  }
                }
                  
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }

                html {
                  counter-reset: page;
                }

                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }

                

                .print-footer-left,
                .print-footer-center {
                  display: block;
                  position: fixed;
                  bottom: 0mm;
                  font-size: 1em;
                  font-weight: 600;
                  text-transform: uppercase;
                }

                .print-footer-left { left: 10mm; text-align: left; }
                .print-footer-center { left: 50%; transform: translateX(-30%); text-align: center; }
                
                .print-header {
                  display: table-header-group;
                }
                .print-footer {
                  display: table-cell !important;
                  padding: 30px 10px 10px 10px !important;
                  font-weight: 600 !important;
                  font-size: 11px !important;
                  text-transform: uppercase !important;
                  white-space: nowrap !important;
                  vertical-align: middle !important;
                  visibility: visible !important;
                }
                
                
                tbody tr {
                  border-left: 2px solid #1e293b;
                  page-break-inside: auto !important;
                }
                tfoot {
                  display: table-footer-group !important;
                  visibility: visible !important;
                }
                tfoot tr {
                  display: table-row !important;
                  page-break-inside: auto !important;
                  visibility: visible !important;
                }
                tfoot td {
                  display: table-cell !important;
                  white-space: nowrap !important;
                  padding: 10px !important;
                  font-size: 1em !important;
                  visibility: visible !important;
                }
                
                table {
                  border-collapse: collapse;
                  width: 100%;
                  border: 1px solid #000 !important;
                  page-break-inside: auto;
                }
                thead {
                  display: table-header-group;
                }
                tfoot {
                  display: table-footer-group;
                }
                thead tr:first-child th {
                  border: none !important;
                  font-size: 1em;
                  font-weight: bold;
                  padding: 15px 10px;
                  background: transparent !important;
                  text-transform: uppercase;
                }
                thead tr:nth-child(2) th {
                  background-color: #1e293b !important;
                  color: white !important;
                  font-weight: 600 !important;
                  border: none !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  padding: 10px 6px !important;
                  text-transform: none !important;
                  text-align: left !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table {
                  border-collapse: collapse !important;
                  border: none !important;
                }
                table th, table td {
                  border: none !important;
                }
                thead th {
                  border: none !important;
                }
                tbody td {
                  border: none !important;
                }
                tfoot td {
                  border: none !important;
                }
                tbody tr {
                  page-break-after: auto;
                }
                tr.self-funded {
                  background-color: #FFFF00 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                table th, table td {
                  border: none !important;
                  font-size: 0.85em;
                  padding: 8px 6px;
                  text-align: left;
                  vertical-align: top;
                  page-break-inside: avoid;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                }
                table td:first-child {
                  text-align: center;
                }
                table tr {
                  border: none;
                }
                thead tr:first-child, tfoot tr {
                  border: none;
                }
                thead tr.esp-tr th {
                  background-color: #1E4A40 !important;
                  color: white !important;
                  text-transform: none !important;
                  text-align: left !important;
                  font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                table th:last-child,
                table tbody td:last-child,
                .delete-btn,
                .department-buttons-container,
                button[onclick="confirmPrint()"],
                .add-form-container,
                .action-column {
                  display: none !important;
                }
                tfoot,
                tfoot tr,
                tfoot td {
                  visibility: visible !important;
                }
              }
            </style>
            </head>
            <body>
              <div id="page-marker"></div>
              <div id="page-number"></div>
              ${printContents}
            </body>
            </html>
            `);


          printWindow.document.close();

          printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
          };

          // No audit log for printing

        } catch (err) {
          console.error("Error printing presentation:", err);
          showToast("error", "Print Error", "Something went wrong while printing."); 
        } finally {
          closeModal();
        }
      },
      'Print presentation'
    );
  };

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
      <div className="department-buttons-container">
        <ShimmerButton size="lg"/>
        <ShimmerButton size="lg"/>
        <ShimmerButton size="lg"/>
      </div>
      : <div className="department-buttons-container">
          <button
            type="button"
            onClick={() => navigate(`/user/department/${dep_id}/research-presentation-add`)}
            name="dep-presentation"
          >
            Add Research Presentation
          </button>
          <button type="button" onClick={confirmPrint} name="dep-presentation">Print Table</button>
          <button type="button" onClick={handleExportPresentationToExcel} name="dep-presentation">Save as Excel</button>
        </div>
      }
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
                <th>Author</th>
                <th>Co-author</th>
                <th>Title of Research Paper</th>
                <th>SDG Alignment</th>
                <th className="hid-th">Conference Title</th>
                <th className="hid-th">Organizer</th>
                <th className="hid-th">Venue</th>
                <th>Date Presented</th>
                <th className="hid-th">Type of Conference</th>
                <th className="hid-th">Special Order No.</th>
                <th className="hid-th">Status</th>
                <th className="hid-th">Funding Source</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {presentations.length > 0 ? (
                presentations.map(item => {
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
                          : item.sdg_alignment || 'N/A'}
                      </td>
                      <td className="hid-th">{item.conference_title}</td>
                      <td className="hid-th">{item.organizer}</td>
                      <td className="hid-th">{item.venue}</td>
                      <td>{formatDateRange(item.date_presented, item.end_date_presented)}</td>
                      <td className="hid-th">{item.conference_category}</td>
                      <td className="hid-th">{item.special_order_no || "N/A"}</td>
                      <td className="hid-th">{item.status_engage}</td>
                      <td className="hid-th">{item.funding_source_engage}</td>
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