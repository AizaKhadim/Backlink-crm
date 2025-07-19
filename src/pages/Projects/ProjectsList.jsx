import React from 'react';
import { useParams } from 'react-router-dom';
import './ProjectDetails.css';

const allProjects = [
{
id: 1,
title: 'SEO for ShopX',
description: 'This project focuses on building backlinks for ShopX e-commerce store.',
targetUrl: 'https://shopx.com',
status: 'In Progress',
progress: 65,
milestones: ['Initial backlinks created', 'Guest posts submitted', 'Waiting for approvals'],
team: ['Aiza', 'Aimen']
},
{
id: 2,
title: 'Backlinks for TechZone',
description: 'Full outreach and backlink generation for TechZone blog.',
targetUrl: 'https://techzone.com',
status: 'Completed',
progress: 100,
milestones: ['All backlinks built', 'Reports submitted'],
team: ['Aimen']
},
{
id: 3,
title: 'E-commerce Outreach',
description: 'Initial setup and guest posts for E-commerce platform.',
targetUrl: 'https://ecomstore.com',
status: 'Pending',
progress: 0,
milestones: [],
team: []
}
];

const ProjectDetails = () => {
const { id } = useParams();
const project = allProjects.find((proj) => proj.id === parseInt(id));

if (!project) return <div style={{ padding: 30 }}>❌ Project not found</div>;

return (
<div className="project-details">
<h2>{project.title}</h2>
<p className="description">{project.description}</p>
  <div className="detail-row">
    <strong>Status:</strong>
    <span className={`status-badge ${project.status.toLowerCase().replace(' ', '-')}`}>
      {project.status}
    </span>
  </div>

  <div className="detail-row">
    <strong>Target URL:</strong>
    <a href={project.targetUrl} target="_blank" rel="noopener noreferrer">
      {project.targetUrl}
    </a>
  </div>

  <div className="detail-row">
    <strong>Progress:</strong>
    <div className="progress-bar">
      <div className="filled" style={{ width: `${project.progress}%` }}></div>
    </div>
    <span className="progress-text">{project.progress}%</span>
  </div>

  <div className="detail-section">
    <h4>Milestones</h4>
    <ul>
      {project.milestones.length === 0
        ? <li>❌ No milestones yet</li>
        : project.milestones.map((m, i) => <li key={i}>✅ {m}</li>)}
    </ul>
  </div>

  <div className="detail-section">
    <h4>Team Members</h4>
    <ul>
      {project.team.length === 0
        ? <li>👥 No members assigned</li>
        : project.team.map((m, i) => <li key={i}>👩‍💻 {m}</li>)}
    </ul>
  </div>
</div>
);
};

export default ProjectDetails;