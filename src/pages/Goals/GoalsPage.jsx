import React, { useState } from 'react';
import './GoalsPage.css';

const GoalsPage = () => {
const [goals, setGoals] = useState([
{
title: 'Create 50 backlinks for ShopX',
project: 'ShopX SEO',
assignedTo: 'Aimen',
dueDate: '2025-07-30',
status: 'In Progress',
},
{
title: 'Outreach for TechZone blog links',
project: 'TechZone Backlinks',
assignedTo: 'Aiza',
dueDate: '2025-07-20',
status: 'Pending',
},
]);

const [newGoal, setNewGoal] = useState({
title: '',
project: '',
assignedTo: '',
dueDate: '',
});

const handleAddGoal = () => {
if (newGoal.title && newGoal.project && newGoal.assignedTo && newGoal.dueDate) {
setGoals([...goals, { ...newGoal, status: 'Pending' }]);
setNewGoal({ title: '', project: '', assignedTo: '', dueDate: '' });
}
};

return (
<div className="goals-page">
<h2>Team Goals</h2>
  <div className="goal-form">
    <input
      type="text"
      placeholder="Goal Title"
      value={newGoal.title}
      onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
    />
    <input
      type="text"
      placeholder="Project"
      value={newGoal.project}
      onChange={(e) => setNewGoal({ ...newGoal, project: e.target.value })}
    />
    <input
      type="text"
      placeholder="Assigned To"
      value={newGoal.assignedTo}
      onChange={(e) => setNewGoal({ ...newGoal, assignedTo: e.target.value })}
    />
    <input
      type="date"
      value={newGoal.dueDate}
      onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
    />
    <button onClick={handleAddGoal}>Add Goal</button>
  </div>

  <div className="goals-list">
    {goals.map((goal, index) => (
      <div key={index} className="goal-card">
        <h4>{goal.title}</h4>
        <p><strong>Project:</strong> {goal.project}</p>
        <p><strong>Assigned To:</strong> {goal.assignedTo}</p>
        <p><strong>Due:</strong> {goal.dueDate}</p>
        <span className={`status ${goal.status.toLowerCase().replace(' ', '-')}`}>{goal.status}</span>
      </div>
    ))}
  </div>
</div>
);
};

export default GoalsPage;