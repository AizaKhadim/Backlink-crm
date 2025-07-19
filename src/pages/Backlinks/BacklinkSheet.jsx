import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import './BacklinkSheet.css';
import { useUser } from '../../context/UserContext';

const mockData = {
  1: {
    type: 'Guest Posting',
    entries: [
      {
        site: 'example-blog.com',
        link: 'https://example-blog.com/guest-post-1',
        status: 'Pending',
        date: '2025-07-10',
      },
      {
        site: 'marketingguru.net',
        link: 'https://marketingguru.net/post/abc',
        status: 'Approved',
        date: '2025-07-12',
      },
    ],
  },
  2: {
    type: 'Profile Creation',
    entries: [
      {
        site: 'forums.tech',
        link: 'https://forums.tech/user/aiza',
        status: 'Approved',
        date: '2025-06-22',
      },
    ],
  },
};

const BacklinkSheet = () => {
  const { id } = useParams();
  const { role } = useUser();
  const data = mockData[id];

  const [entries, setEntries] = useState(data?.entries || []);
  const [newEntry, setNewEntry] = useState({
    site: '',
    link: '',
    status: 'Pending',
    date: '',
  });

  if (!data) return <div className="backlink-sheet"><h2>❌ No data found</h2></div>;

  const handleAddEntry = () => {
    if (!newEntry.site || !newEntry.link || !newEntry.date) return alert("Fill all fields");
    setEntries([...entries, newEntry]);
    setNewEntry({ site: '', link: '', status: 'Pending', date: '' });
  };

  const toggleStatus = (index) => {
    const updated = [...entries];
    updated[index].status = updated[index].status === 'Pending' ? 'Approved' : 'Pending';
    setEntries(updated);
  };

  return (
    <div className="backlink-sheet">
      <h2>{data.type} Backlinks</h2>

      {(role === 'admin' || role === 'editor') && (
        <div className="add-backlink-form">
          <input
            type="text"
            placeholder="Website"
            value={newEntry.site}
            onChange={(e) => setNewEntry({ ...newEntry, site: e.target.value })}
          />
          <input
            type="url"
            placeholder="Link"
            value={newEntry.link}
            onChange={(e) => setNewEntry({ ...newEntry, link: e.target.value })}
          />
          <input
            type="date"
            value={newEntry.date}
            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
          />
          <button onClick={handleAddEntry}>➕ Add Backlink</button>
        </div>
      )}

      <table className="sheet-table">
        <thead>
          <tr>
            <th>Website</th>
            <th>Link</th>
            <th>Status</th>
            <th>Date</th>
            {(role === 'admin' || role === 'editor') && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index}>
              <td>{entry.site}</td>
              <td>
                <a href={entry.link} target="_blank" rel="noopener noreferrer">
                  Visit
                </a>
              </td>
              <td>
                <span className={`status ${entry.status.toLowerCase()}`}>
                  {entry.status}
                </span>
              </td>
              <td>{entry.date}</td>
              {(role === 'admin' || role === 'editor') && (
                <td>
                  <button onClick={() => toggleStatus(index)}>🔁 Toggle</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BacklinkSheet;
