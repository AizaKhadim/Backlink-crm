import React, { useState } from 'react';
import './ReportsPage.css';
import { useUser } from '../../context/UserContext';

const sampleData = [
{
linkType: 'Guest Post',
url: 'https://example.com/blog-1',
status: 'Created',
date: '2025-07-10',
},
{
linkType: 'Profile',
url: 'https://example.com/user123',
status: 'Pending',
date: '2025-07-12',
},
{
linkType: 'Directory',
url: 'https://example.com/listing',
status: 'Created',
date: '2025-07-14',
},
];

const ReportsPage = () => {
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');
const { role } = useUser();

return (
<div className="reports-page">
<h2>Project Reports</h2>  {role !== 'viewer' && (
    <div className="filters">
      <select>
        <option>Select Project</option>
        <option>ShopX SEO</option>
        <option>TechZone Backlinks</option>
      </select>

      <div className="date-filters">
        <label>
          From:
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          To:
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
      </div>
    </div>
  )}

  <div className="stats">
    <div className="stat-card">
      <h3>3</h3>
      <p>Total Links</p>
    </div>
    <div className="stat-card">
      <h3>2</h3>
      <p>Created</p>
    </div>
    <div className="stat-card">
      <h3>1</h3>
      <p>Pending</p>
    </div>
  </div>

  <table className="report-table">
    <thead>
      <tr>
        <th>Link Type</th>
        <th>URL</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      {sampleData.map((row, i) => (
        <tr key={i}>
          <td>{row.linkType}</td>
          <td>
            <a href={row.url} target="_blank" rel="noopener noreferrer">
              {row.url}
            </a>
          </td>
          <td>
            <span className={`status-badge ${row.status.toLowerCase()}`}>
              {row.status}
            </span>
          </td>
          <td>{row.date}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
);
};

export default ReportsPage;