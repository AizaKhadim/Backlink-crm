import React from 'react';
import './BacklinkTypes.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const types = [
{ id: 1, name: 'Guest Posting', icon: '📝' },
{ id: 2, name: 'Profile Creation', icon: '👤' },
{ id: 3, name: 'Directory Submission', icon: '📁' },
{ id: 4, name: 'Blog Comments', icon: '💬' },
{ id: 5, name: 'Social Bookmarks', icon: '🔖' },
{ id: 6, name: 'Custom Backlinks', icon: '⚙️' },
];

const BacklinkTypes = () => {
const navigate = useNavigate();
const { role } = useUser();

if (role === 'viewer') {
return (
<div className="backlink-types-page">
<h2>🔒 Access Denied</h2>
<p>You do not have permission to add backlinks.</p>
</div>
);
}

return (
<div className="backlink-types-page">
<h2>Select Backlink Type</h2>
<div className="type-cards">
{types.map((type) => (
<div
key={type.id}
className="type-card"
onClick={() => navigate('/backlinks/${type.id}')}
>
<span className="icon">{type.icon}</span>
<h4>{type.name}</h4>
</div>
))}
</div>
</div>
);
};

export default BacklinkTypes;