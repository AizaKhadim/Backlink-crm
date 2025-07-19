import React, { useState } from 'react';
import './TeamPage.css';
import { useUser } from '../../context/UserContext';

const TeamPage = () => {
  const { role } = useUser();

  const [teamMembers, setTeamMembers] = useState([
    {
      name: 'Aiza Khan',
      email: 'aiza@example.com',
      projects: ['ShopX SEO', 'TechZone Backlinks'],
      role: 'Admin',
    },
    {
      name: 'Aimen Ali',
      email: 'aimen@example.com',
      projects: ['Ecom Outreach'],
      role: 'Editor',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'Viewer',
  });

  const handleAddMember = () => {
    setTeamMembers([...teamMembers, { ...newMember, projects: [] }]);
    setNewMember({ name: '', email: '', role: 'Viewer' });
    setShowModal(false);
  };

  if (role !== 'admin') {
    return (
      <div className="team-page">
        <h2>🔒 Access Denied</h2>
        <p>You do not have permission to view the team members.</p>
      </div>
    );
  }

  return (
    <div className="team-page">
      <h2>Team Members</h2>

      <table className="team-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Projects</th>
            <th>Access Level</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {teamMembers.map((member, index) => (
            <tr key={index}>
              <td>{member.name}</td>
              <td>{member.email}</td>
              <td>
                <ul>
                  {member.projects.map((proj, i) => (
                    <li key={i}>{proj}</li>
                  ))}
                </ul>
              </td>
              <td>
                <span className={`role-badge ${member.role.toLowerCase()}`}>
                  {member.role}
                </span>
              </td>
              <td>
                <button className="edit-btn">✏️</button>
                <button className="remove-btn">🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="add-member-btn" onClick={() => setShowModal(true)}>
        ➕ Add Member
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Team Member</h3>
            <input
              type="text"
              placeholder="Name"
              value={newMember.name}
              onChange={(e) =>
                setNewMember({ ...newMember, name: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              value={newMember.email}
              onChange={(e) =>
                setNewMember({ ...newMember, email: e.target.value })
              }
            />
            <select
              value={newMember.role}
              onChange={(e) =>
                setNewMember({ ...newMember, role: e.target.value })
              }
            >
              <option>Admin</option>
              <option>Editor</option>
              <option>Viewer</option>
            </select>
            <div className="modal-actions">
              <button onClick={handleAddMember}>Add</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
