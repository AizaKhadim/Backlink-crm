import React from 'react';
import './Navbar.css';
import { useUser } from '../context/UserContext';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebase';

const Navbar = () => {
const { user, role } = useUser();
const auth = getAuth(app);
const navigate = useNavigate();

const handleLogout = async () => {
try {
await signOut(auth);
navigate('/'); // redirect to home or login
} catch (error) {
alert('Logout failed');
}
};

return (
<div className="navbar">
<div className="navbar-left">
<h3>Welcome, {user?.name || 'User'} 👋</h3>
<p className="role-tag">{role?.toUpperCase()}</p>
</div>
<div className="navbar-right">
<input type="text" className="search-input" placeholder="Search..." />
<button className="logout-btn" onClick={handleLogout}>Logout</button>
</div>
</div>
);
};

export default Navbar;