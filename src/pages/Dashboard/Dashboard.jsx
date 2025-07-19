import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h2 className="dashboard-title">📊 Dashboard Overview</h2>

      <div className="dashboard-cards">
        <div className="card summary-card gradient-card">
          <h3>Total Projects</h3>
          <p>8</p>
        </div>
        <div className="card summary-card gradient-card2">
          <h3>Total Backlinks</h3>
          <p>134</p>
        </div>
        <div className="card summary-card gradient-card3">
          <h3>Goals Completed</h3>
          <p>5 / 7</p>
        </div>
      </div>

      <div className="dashboard-chart glass-card">
        <h3>Performance Chart</h3>
        <div className="chart-placeholder">
          <p>📈 Interactive chart coming soon...</p>
        </div>
      </div>

      <div className="dashboard-activity glass-card">
        <h3>Recent Activity</h3>
        <ul>
          <li>✅ Backlink added to Project A</li>
          <li>📅 Goal deadline approaching for Project B</li>
          <li>🧑‍💼 New team member added: Aimen</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
