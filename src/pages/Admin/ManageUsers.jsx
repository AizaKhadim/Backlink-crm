import React, { useEffect, useState } from 'react';
import './ManageUsers.css';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore';
import { app } from '../../firebase';

const db = getFirestore(app);

const ManageUsers = () => {
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const userList = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleRoleChange = async (uid, newRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      alert('✅ Role updated!');
      fetchUsers(); // Refresh UI
    } catch (err) {
      console.error('Error updating role:', err);
      alert('❌ Failed to update role.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="manage-users-page">
      <h2>👥 Manage Users</h2>
      <div className="table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Change Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td>{user.fullName || '—'}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>{user.role}</span>
                </td>
                <td>
                  <select
                    value={user.role}
                    onChange={e => handleRoleChange(user.uid, e.target.value)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
