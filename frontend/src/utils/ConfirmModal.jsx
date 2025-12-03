import React from "react";
import '../styles/confirmModal.css';
import '../styles/style.css';

const ConfirmModal = ({ show, title, message, onConfirm, confirmText = "Confirm", onCancel, cancelText = "Cancel", onClose }) => {
  if (!show) return null;

  const isInfoOnly = !onConfirm || !onCancel;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{title || "Confirm Action"}</h2>
        <p>{message || "Are you sure you want to proceed?"}</p>

        <div className="modal-buttons">
          {isInfoOnly ? (
            <button type="button" onClick={onClose}>
              OK
            </button>
          ) : (
            <>
              <button onClick={onCancel} type="button">
                {cancelText}
              </button>
              <button onClick={onConfirm} type="submit">
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal;