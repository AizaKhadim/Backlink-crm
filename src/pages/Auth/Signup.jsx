import React, { useState } from 'react';
import './Auth.css';
import bg from '../../assets/background.png';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore, serverTimestamp } from 'firebase/firestore';
import { app } from '../../firebase';

const SignUp = () => {
const navigate = useNavigate();
const auth = getAuth(app);
const db = getFirestore(app);

const [fullName, setFullName] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSignUp = async () => {
try {
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
  // Add user to Firestore with default role
  await setDoc(doc(db, 'users', user.uid), {
    fullName,
    email,
    role: 'viewer',
    createdAt: serverTimestamp()
  });

  navigate('/signin'); // or your intended route
} catch (err) {
  alert(err.message);
}
};

return (
<div className="auth-page" style={{ backgroundImage: `url(${bg})` }}>
<div className="auth-overlay">
<div className="auth-card">
<h2>Create Account</h2>
<p>Sign up to get started</p>      <input type="text" placeholder="Full Name" className="auth-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input type="email" placeholder="Email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} />

      <button className="auth-submit" onClick={handleSignUp}>Sign Up</button>

      <p className="auth-footer">
        Already have an account? <span onClick={() => navigate('/signin')}>Sign In</span>
      </p>
    </div>
  </div>
</div>
);
};

export default SignUp;