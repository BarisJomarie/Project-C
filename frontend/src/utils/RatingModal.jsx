// RatingModal.jsx
import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { showToast } from './toast';

const RatingModal = ({ show, onClose, children, onSave }) => {
  const [step, setStep] = useState('rating'); // 'rating' or 'content'
  const [rating, setRating] = useState(null);

  const handleStarClick = (value) => {
    setRating(value);
  };

  const handleNext = () => {
    if (!rating) {
      showToast('warning', 'Missing Rating', 'Please select a rating first.');
      return;
    }
    setStep('content');
  };

  const handleSave = async () => {
    if (onSave) await onSave(rating);
    onClose();
  };

  return (
    <ConfirmModal
      show={show}
      onClose={onClose}
      onCancel={onClose}
      confirmText={step === 'rating' ? 'Next' : 'Save'}
      onConfirm={step === 'rating' ? handleNext : handleSave}
      title={step === 'rating' ? 'Rate the AI Report' : 'Save Report'}
      message={
        step === 'rating' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <p>Please rate the AI-generated report:</p>
            <div style={{ display: 'flex', gap: '8px', fontSize: '28px', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  style={{ color: rating >= star ? '#facc15' : '#ccc' }}
                  onClick={() => handleStarClick(star)}
                >
                  ★
                </span>
              ))}
            </div>
            <p style={{ fontSize: '14px', color: '#555' }}>
              {rating ? `You rated ${rating}/5` : 'No rating yet'}
            </p>
          </div>
        ) : (
          children
        )
      }
    />
  );
};

export default RatingModal;
