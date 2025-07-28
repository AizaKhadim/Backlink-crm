import React, { useState } from 'react';
import './Homescreen.css';
import AuthModal from './AuthModal';
import bg from '../../assets/background.png';

const HomeScreen = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="home-screen"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        width: '100%',
        height: '100%',
      }}
    >
      <div className="overlay">
        <div className="content-box">
          <p className="product-label">Products</p>
          <h1 className="title">Backlink Manager</h1>
          <p className="subtitle">Simple tool to centralize your link management!</p>
          <button className="cta-button" onClick={() => setShowModal(true)}>
            Start for free
          </button>
        </div>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    </div>
  );
};

export default HomeScreen;
