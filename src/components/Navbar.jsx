import React, { useState } from 'react';
import './Navbar.css';
import { useUser } from '../context/UserContext';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebase';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { user, role } = useUser();
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      alert('Logout failed');
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h3>Welcome 👋</h3>
        <p className="role-tag">{role?.toUpperCase()}</p>
      </div>

      <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
        <input type="text" className="search-input" placeholder="Search..." />
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </div>
    </div>
  );
};

export default Navbar;
