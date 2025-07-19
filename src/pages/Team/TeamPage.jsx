// src/pages/Team/TeamPage.jsx
import React, { useEffect, useState } from 'react';
import './TeamPage.css';
import { useUser } from '../../context/UserContext';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from '../../firebase';

const db = getFirestore(app);

const TeamPage = () => {
  const { role } = useUser();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    role: 'viewer',
  });

  const fetchTeam = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, 'users'));
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTeamMembers(members);
    setLoading(false);
  };

  const handleAddMember = async () => {
    try {
      await addDoc(collection(db, 'users'), {
        fullName: newMember.fullName,
        email: newMember.email,
        role: newMember.role,
        createdAt: serverTimestamp(),
      });
      setShowModal(false);
      setNewMember({ fullName: '', email: '', role: 'viewer' });
      fetchTeam();
      alert('Team member added. Share login manually.');
    } catch (err) {
      alert('Failed to add member');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

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

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="team-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Access Level</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map((member, index) => (
              <tr key={index}>
                <td>{member.fullName}</td>
                <td>{member.email}</td>
                <td>
                  <span className={`role-badge ${member.role.toLowerCase()}`}>
                    {member.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="add-member-btn" onClick={() => setShowModal(true)}>
        ➕ Add Member
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Team Member</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={newMember.fullName}
              onChange={(e) =>
                setNewMember({ ...newMember, fullName: e.target.value })
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
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
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
