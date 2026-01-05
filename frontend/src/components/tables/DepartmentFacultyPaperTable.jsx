import React, { useState } from "react";
import axios from "axios";
import { ShimmerTable, ShimmerButton } from "react-shimmer-effects";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../utils/ConfirmModal";
import { showToast } from "../../utils/toast";

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
      {loading ? <ShimmerButton size="lg" /> : (
        <div className="department-buttons-container">
          <button onClick={() => navigate(`/user/department/${dep_id}/research_add`)} type="button" name="dep-faculty">
            Add Paper
          </button>
          {role !== 'faculty' && (
            <button onClick={() => navigate(`/user/department/${dep_id}/ai_report`)} type="button" name="dep-faculty">
              AI Analysis
              </button>
          )}
        </div>
      )}

      {loading ? <ShimmerTable row={5} col={4} /> : (
        <div className="table-container sticky">
          <table>
            <thead className="stick-header dep-faculty-thead">
              <tr className="esp-tr faculty">
                <th>Title of Research</th>
                <th>Name&nbsp;of&nbsp;Researcher/s</th>
                <th>Funding&nbsp;Source<br/>(if any)</th>
                <th>Academic&nbsp;Year<br/>Sem&nbsp;and&nbsp;SY</th>
                <th>SDG Label</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fPapers.length > 0 ? (
                fPapers.map((paper) => {
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

                      <td>
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