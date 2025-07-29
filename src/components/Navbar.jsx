import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { useUser } from '../context/UserContext';
import { getAuth, signOut } from 'firebase/auth';
import { app, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import {
  collection,
  getDocs,
} from 'firebase/firestore';

const categories = [
  'guest posting',
  'profile creation',
  'micro blogging',
  'directory submission',
  'social bookmarks',
];

const Navbar = () => {
  const { user, role } = useUser();
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [showReminderList, setShowReminderList] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      alert('Logout failed');
    }
  };

  useEffect(() => {
    const fetchReminders = async () => {
      const projectsSnap = await getDocs(collection(db, 'projects'));
      const today = new Date().toISOString().split('T')[0];

      const backlinkCountMap = {};

      for (const project of projectsSnap.docs) {
        const projectId = project.id;
        const projectTitle = project.data().title || 'Untitled';
        if (project.data().isDeleted) continue;

        let backlinkTotal = 0;

        for (const cat of categories) {
          const catSnap = await getDocs(collection(db, 'projects', projectId, cat));
          backlinkTotal += catSnap.size;
        }

        backlinkCountMap[projectId] = backlinkTotal;

        const goalsSnap = await getDocs(collection(db, 'projects', projectId, 'goals'));
        const goalList = goalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        goalList.forEach(goal => {
          if (!goal.target || !goal.dueDate) return;

          const isDue = goal.dueDate <= today;
          const isCompleted = backlinkCountMap[projectId] >= goal.target;

          if (isDue && !isCompleted) {
            reminders.push({
              id: goal.id,
              title: goal.title,
              project: projectTitle,
              dueDate: goal.dueDate,
            });
          }
        });
      }

      setReminders(reminders);
    };

    fetchReminders();
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-left">
        <h3>Welcome 👋</h3>
        <p className="role-tag">{role?.toUpperCase()}</p>
      </div>

      <div className={`navbar-right ${menuOpen ? 'open' : ''}`}>
        {reminders.length > 0 && (
          <div className="navbar-notifications">
            <button
              className="bell-btn"
              onClick={() => setShowReminderList(!showReminderList)}
            >
              🔔 {reminders.length}
            </button>

            {showReminderList && (
              <ul className="navbar-reminder-list">
                {reminders.map((r) => (
                  <li key={r.id}>
                    <strong>{r.project}</strong>: {r.title}<br />
                    Due: <span>{r.dueDate}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
      </div>
    </div>
  );
};

export default Navbar;
