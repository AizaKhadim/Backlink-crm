import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { useUser } from '../../context/UserContext';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  or,
} from 'firebase/firestore';
import { db } from '../../firebase';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { role } = useUser();

  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // 🔄 Fetch active (non-deleted) projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Firebase workaround: fetch all and filter manually
        const snapshot = await getDocs(collection(db, 'projects'));
        const allProjects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filtered = allProjects.filter(project => !project.isDeleted);
        setProjects(filtered);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  // 🔄 Fetch team members
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTeamMembers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // 🗑 Soft delete project (move to trash)
  const handleSoftDeleteProject = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project?");
    if (!confirmDelete) return;

    try {
      await updateDoc(doc(db, 'projects', id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      setProjects(prev => prev.filter(project => project.id !== id));
      alert("Project moved to trash.");
    } catch (error) {
      console.error('Error soft-deleting project:', error);
    }
  };

  // 🗑 Remove user
  const handleRemoveUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this user?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'users', id));
      setTeamMembers(prev => prev.filter(user => user.id !== id));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="settings-page">
        <h2>🔒 Access Denied</h2>
        <p>You do not have permission to access settings.</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>

      <div className="settings-tabs">
        <button
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'active' : ''}
        >
          User Access
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={activeTab === 'projects' ? 'active' : ''}
        >
          Projects
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'users' && (
          <div>
            <h3>Team Members</h3>
            {teamMembers.length === 0 ? (
              <p>No team members found.</p>
            ) : (
              <ul>
                {teamMembers
                  .filter((member) => member.role !== 'admin')
                  .map((member) => (
                    <li key={member.id}>
                      {member.fullName} — {member.role}{' '}
                      <button onClick={() => handleRemoveUser(member.id)}>Remove</button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <h3>Projects</h3>
            {projects.length === 0 ? (
              <p>No projects found.</p>
            ) : (
              <ul>
                {projects.map((project) => (
                  <li key={project.id}>
                    {project.title}{' '}
                    <button onClick={() => handleSoftDeleteProject(project.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
