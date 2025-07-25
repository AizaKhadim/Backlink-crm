import React, { useState, useEffect } from 'react';
import './SettingsPage.css';
import { useUser } from '../../context/UserContext';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { role } = useUser();

  const [projects, setProjects] = useState([]);

  // 🔄 Fetch all projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'projects'));
        const projectData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProjects(projectData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  // 🗑 Remove project
  const handleRemoveProject = async (id) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects(prev => prev.filter(project => project.id !== id));
    } catch (error) {
      console.error('Error deleting project:', error);
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
        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}>
          User Access
        </button>
        <button onClick={() => setActiveTab('projects')} className={activeTab === 'projects' ? 'active' : ''}>
          Projects
        </button>
        <button onClick={() => setActiveTab('custom')} className={activeTab === 'custom' ? 'active' : ''}>
          Visibility
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'users' && (
          <div>
            <h3>Team Members</h3>
            <ul>
              <li>Aiza — Admin <button>Remove</button></li>
              <li>Aimen — Viewer <button>Remove</button></li>
            </ul>
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
                    <button onClick={() => handleRemoveProject(project.id)}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <div>
            <h3>Dashboard Visibility</h3>
            <label><input type="checkbox" defaultChecked /> Show Backlinks</label>
            <label><input type="checkbox" defaultChecked /> Show Reports</label>
            <label><input type="checkbox" /> Show Goals</label>
            <label><input type="checkbox" /> Show Team</label>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
