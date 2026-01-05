import React, { useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";
import ConfirmModal from "../../utils/ConfirmModal";
import * as XLSX from 'xlsx';

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
            <title>Research Publication</title>
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
                border: none;
              }

              th, td { 
                border: 1px solid black !important;
                padding: 8px 6px; 
                text-align: left; 
                vertical-align: top;
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead th {
                border: 1px solid grey !important;
              }
              tbody td {
                border: 1px solid grey !important;
              }
              tfoot td {
                border: 1px solid grey !important;
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
                background-color: #000f3f !important;
                color: white !important;
                font-weight: 600;
                padding: 10px 6px;
                border: none !important;
                text-transform: none;
                text-align: center;
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
                  border: none !important;
                }
                .print-page-number::after {
                  counter-increment: page;
                  content: " " counter(page);
                }
                tfoot {
                  display: table-footer-group !important;
                  visibility: visible !important;
                  border: none;
                }
                tfoot tr {
                  display: table-row !important;
                  page-break-inside: avoid !important;
                  page-break-after: avoid !important;
                  visibility: visible !important;
                  border: none;
                }
                tfoot td {
                  display: table-cell !important;
                  white-space: nowrap !important;
                  padding: 10px !important;
                  font-size: 11px !important;
                  visibility: visible !important;
                  border: none;
                }
                
                table {
                  border-collapse: collapse;
                  width: 100%;
                  border: 1px solid #D3D3D3 !important;
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
                  background-color: #000f3f !important;
                  color: white !important;
                  border: 1px solid #D3D3D3 !important;
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
                  border: 1px solid #D3D3D3 !important;
                }
                thead th {
                  border: 1px solid #D3D3D3 !important;
                }
                tbody td {
                  border: 1px solid #D3D3D3 !important;
                }
                tfoot td {
                  border: none !important;
                }
                tbody tr {
                  page-break-inside: avoid;
                  page-break-after: auto;
                }
                table th, table td {
                  border: 1px solid #D3D3D3 !important;
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
                  background-color: #000f3f !important;
                  color: white !important;
                  text-transform: none !important;
                  text-align: center !important;
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
                  border: none;
                }

                .print-footer {
                  border: none;
                }
              }
            </style>
            </head>
            <body>${printContents}</body>
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
        ? <div className="department-buttons-container">
            <ShimmerButton size="lg" />
            <ShimmerButton size="lg" />
            <ShimmerButton size="lg" />
          </div> 
        : <div className="department-buttons-container">
            <button
              type="button"
              onClick={() => navigate(`/user/department/${dep_id}/research-publication-add`)}
              name="dep-publication"
            >
              Add Research Publication
            </button>

            <button type="button" onClick={confirmPrint} name="dep-publication">Print Table</button>
            <button type="button" onClick={handleExportPublicationToExcel} name="dep-publication">Save as Excel</button>
          </div>
      }

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
                <th>Published Title</th>
                <th>Author</th>
                <th>Co-author</th>
                <th className="hid-th">Title of Journal / Publication</th>
                <th className="hid-th">Conference / Proceedings</th>
                <th>Publisher</th>
                <th>Date of Publication</th>
                <th className="hid-th">DOI</th>
                <th className="hid-th">ISSN / ISBN</th>
                <th className="hid-th">Volume & Issue No.</th>
                <th className="hid-th">Index</th>
                <th className="action-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {publication.length > 0 ? (
                publication.map((item, index) => (
                  <tr key={item.id}>
                    <td className="hid-td">{index + 1}</td>
                    <td>{item.published_title}</td>
                    <td>{item.pub_author}</td>
                    <td>
                      {Array.isArray(item.co_authors) && item.co_authors.length > 0
                        ? item.co_authors.filter(co => co && co.trim() !== "").map((co, idx) => <div key={idx} style={{marginBottom: '4px'}}>{co}</div>)
                        : 'N/A'}
                    </td>
                    <td className="hid-td">{item.journal_title}</td>
                    <td className="hid-td">{item.conference_or_proceedings || "N/A"}</td>
                    <td>{item.publisher}</td>
                    <td>{item.date_of_publication ? item.date_of_publication : "N/A"}</td>
                    <td className="hid-td">{item.doi || "N/A"}</td>
                    <td className="hid-td">{item.issn_isbn}</td>
                    <td className="hid-td">{item.volume_issue || "N/A"}</td>
                    <td className="hid-td">
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