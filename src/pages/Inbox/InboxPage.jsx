import React, { useState, useEffect } from 'react';
import './InboxPage.css';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../context/UserContext';

const avatarColors = ['#764ba2', '#667eea', '#f39c12', '#16a085', '#d35400'];

const getInitials = (name) => {
  const parts = name.split(' ');
  return parts.length > 1 ? parts[0][0] + parts[1][0] : name[0];
};

const TeamCommentsPage = () => {
  const { user } = useUser(); // Contains .uid and .email
  const [fullName, setFullName] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Fetch full name from Firestore
  useEffect(() => {
    const fetchFullName = async () => {
      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setFullName(userSnap.data().fullName || user.email);
      } else {
        setFullName(user.email); // fallback
      }
    };

    fetchFullName();
  }, [user]);

  // Realtime comment fetching
  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetched);
    });

    return () => unsubscribe();
  }, []);

  // Post new comment
  const handlePost = async () => {
    if (!newComment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        author: fullName,
        text: newComment,
        createdAt: serverTimestamp(),
      });
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  return (
    <div className="inbox-page">
      <h2>Team Comments</h2>
      <div className="chat-box">
        {comments.map((c, index) => {
          const initials = getInitials(c.author);
          const color = avatarColors[index % avatarColors.length];
          const time = c.createdAt?.toDate?.().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }) || '...';

          return (
            <div key={c.id} className="chat-message other">
              <div className="avatar" style={{ backgroundColor: color }}>
                {initials}
              </div>
              <div className="comment-content">
                <div className="sender">{c.author}</div>
                <div className="text">{c.text}</div>
                <div className="time">{time}</div>
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
