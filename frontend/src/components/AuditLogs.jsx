import { useEffect, useState } from "react";
import { showToast } from "../utils/toast";
import axios from "axios";
import ConfirmModal from "../utils/ConfirmModal";
import '../styles/style.css';
import '../styles/table.css';
import '../styles/auditLogs.css';


const AuditLogs = () => {
  const [modalConfig, setModalConfig] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
  })
  const [audit, setAudit] = useState([]);
  const [selectionToggle, setSelectionToggle] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;



  const showModal = (title, message, onConfirm) => {
    setModalConfig({
      show: true,
      title,
      message,
      onConfirm,
    });
  }

  const closeModal = () => {
    setModalConfig(prev => ({...prev, show: false}));
  }



  // GET AUDIT LOGS PAGE AND LIMIT
  const getAuditLogs = () => {
    axios.get(`${API_URL}/api/users/audit-logs-all`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: currentPage, limit: rowsPerPage === "All" ? 0 : rowsPerPage }
    })
    .then(res => {
      setAudit(res.data.data);
      setTotalPages(res.data.totalPages);
      setTotalRows(res.data.totalRows);
      setSelectedLogs([]); // reset selection
    })
    .catch(err => console.error(err));
  };



  // TOGGLE ROW SELECTION
  const toggleRowSelection = (id) => {
    if (selectedLogs.includes(id)) {
      setSelectedLogs(selectedLogs.filter(logId => logId !== id));
    } else {
      setSelectedLogs([...selectedLogs, id]);
    }
  };



  // SELECT / DESELECT ROWS
  const toggleSelectAll = () => {
    if (selectedLogs.length === audit.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(audit.map(a => a.id));
    }
  };

  const handleRowsChange = (e) => {
    const value = parseInt(e.target.value);
    setRowsPerPage(value);
    setCurrentPage(1); // reset to first page
  };



  useEffect(() => {
    getAuditLogs();
  }, [currentPage, rowsPerPage]);



  // DELETE LOG/S
  const handleDeleteLogs = (selectedIds) => {
    if (selectedIds.length === 0) return;

    showModal(
      'Delete Rows',
      `Are you sure you want to delete (${selectedIds.length}) logs?`,
      async () => {
        try {
          await axios.delete(`${API_URL}/api/users/audit-delete`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { ids: selectedIds },
          });
          showToast('success', 'Logs Deleted', 'Logs deleted successfully.');
          getAuditLogs();
        } catch (err) {
          console.error('Delete failed:', err);
          showToast('error', 'Delete Failed', 'Could not delete logs.');
        } finally {
          closeModal();
        };
      },
    )
  };



  return (
    <>
      <h1 style={{textAlign: 'center'}}>Audit Logs</h1>
      <div className='line'></div>
      <div className="selection-container">
        <div className="selection">
          <input type="checkbox" checked={selectionToggle} onChange={() => setSelectionToggle(!selectionToggle)} id="selection-toggle" disabled={selectedLogs.length > 0}/>
          <label htmlFor="selection-toggle">Delete Multiple Logs</label>
        </div>
        <div className="selection">
          <select id="table-rows" name="table-rows" onChange={handleRowsChange} value={rowsPerPage}>
            <option>25</option>
            <option>50</option>
            <option>100</option>
            <option>250</option>
            <option>500</option>
          </select>
          <label htmlFor="table-rows">Table Rows</label>
        </div>
        <div className="selection">
          <div className="pagination">
            <button type="button" onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages}>Next</button>
          </div>
        </div>
      </div>
      {selectionToggle && audit.length > 0 && (
        <div className="selection-buttons-1">
          <button type="submit" onClick={() => handleDeleteLogs(selectedLogs)} disabled={selectedLogs.length === 0} > Delete Selected </button>
          <button type="button" onClick={toggleSelectAll}>
            {selectedLogs.length === audit.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {selectionToggle && <th>Select</th>}
              <th>ID</th>
              <th>User Code</th>
              <th>User Role</th>
              <th>Action</th>
              <th>Actor Type</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {audit.length > 0 ? (
              audit.map((a) => (
                <tr key={a.id} className={selectedLogs.includes(a.id) ? 'selected' : ''}>
                  {selectionToggle && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(a.id)}
                        onChange={() => toggleRowSelection(a.id)}
                      />
                    </td>
                  )}
                  <td>{a.id}</td>
                  <td>{a.user_code}</td>
                  <td>{a.user_role}</td>
                  <td>{a.action}</td>
                  <td>{a.actor_type.charAt(0).toUpperCase() + a.actor_type.slice(1)}</td>
                  <td>{new Date(a.timestamp).toLocaleString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No logs at the moment...</td>
              </tr>
            )}
          </tbody>
        </table>
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
};

export default AuditLogs;
