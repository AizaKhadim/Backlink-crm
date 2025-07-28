import React, { useState } from 'react';
import './Auth.css';
import bg from '../../assets/background.png';
import { useNavigate } from 'react-router-dom';
import { app, auth } from '../../firebase.js';
import { signInWithEmailAndPassword } from 'firebase/auth';

const SignIn = () => {
const navigate = useNavigate();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleSignIn = async () => {
try {
await signInWithEmailAndPassword(auth, email, password);
navigate('/dashboard'); // or wherever you want to go after login
} catch (err) {
setError('Invalid email or password');
}
};

return (
<div className="auth-page" style={{ backgroundImage: `url(${bg})` }}>
<div className="auth-overlay">
<div className="auth-card">
<h2>Welcome Back</h2>
<p>Please sign in to your account</p>
      <input
        type="email"
        placeholder="Email"
        className="auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}

      <button className="auth-submit" onClick={handleSignIn}>
        Sign In
      </button>

      <p className="auth-footer">
        Don’t have an account?{' '}
        <span onClick={() => navigate('/signup')}>Sign Up</span>
      </p>
    </div>
  </div>
</div>
);
};

export default SignIn;