import React, { useState } from 'react';
import './InboxPage.css';

const avatarColors = ['#764ba2', '#667eea', '#f39c12', '#16a085', '#d35400'];

const getInitials = (name) => {
const parts = name.split(' ');
return parts.length > 1 ? parts[0][0] + parts[1][0] : name[0];
};

const TeamCommentsPage = () => {
const [comments, setComments] = useState([
{ author: 'Aimen Khan', text: 'Hey! Please update the backlinks for ShopX.', time: '10:00 AM' },
{ author: 'Aiza Raza', text: 'Sure! I’ll complete it by today.', time: '10:05 AM' },
]);

const [newComment, setNewComment] = useState('');

const handlePost = () => {
if (newComment.trim() !== '') {
const newEntry = {
author: 'Team Member',
text: newComment,
time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};
setComments([...comments, newEntry]);
setNewComment('');
}
};

return (
<div className="inbox-page">
<h2>Team Comments</h2>  <div className="chat-box">
    {comments.map((c, index) => {
      const initials = getInitials(c.author);
      const color = avatarColors[index % avatarColors.length];

      return (
        <div key={index} className="chat-message other">
          <div className="avatar" style={{ backgroundColor: color }}>
            {initials}
          </div>
          <div className="comment-content">
            <div className="sender">{c.author}</div>
            <div className="text">{c.text}</div>
            <div className="time">{c.time}</div>
          </div>
        </div>
      );
    })}
  </div>

  <div className="chat-input">
    <input
      type="text"
      placeholder="Add a comment..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handlePost()}
    />
    <button onClick={handlePost}>Post</button>
  </div>
</div>
);
};

export default TeamCommentsPage;