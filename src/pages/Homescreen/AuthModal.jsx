import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="modal-backdrop">
      <div className="auth-modal">
        <h2>Welcome!</h2>
        <p>Choose an option:</p>
        <div className="auth-buttons">
          <button className="auth-btn" onClick={() => navigate('/signin')}>Sign In</button>
          <button className="auth-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default AuthModal;
