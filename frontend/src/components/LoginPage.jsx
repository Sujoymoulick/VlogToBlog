import React, { useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from '../firebase';
import './LoginPage.css';

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password fields.');
      return;
    }

    if (activeTab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      console.error('Authentication Error:', err);
      // Clean up Firebase error messages for user readability
      let friendlyMsg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMsg = 'Invalid email or password credential. Please verify your details.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = 'This email is already linked to another account. Try logging in instead.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMsg = 'Please enter a valid email address.';
      }
      setError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google authentication was cancelled or encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error('Anonymous Sign In Error:', err);
      setError(err.message || 'Failed to start anonymous guest session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="swiss-login-container">
      <div className="swiss-login-card">
        
        {/* Header segment */}
        <header className="swiss-login-header">
          <h1 className="swiss-login-logo">VlogToBlog</h1>
          <p className="swiss-login-subtitle">Authentication Required</p>
        </header>

        {/* Tab switcher */}
        <div className="swiss-login-tabs">
          <button
            type="button"
            className={`swiss-login-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signin'); setError(null); }}
            disabled={isLoading}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`swiss-login-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
            onClick={() => { setActiveTab('signup'); setError(null); }}
            disabled={isLoading}
          >
            Register
          </button>
        </div>

        {/* Alert Error Box */}
        {error && (
          <div className="swiss-login-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i> {error}
          </div>
        )}

        {/* Form panel */}
        <form onSubmit={handleEmailSubmit} className="swiss-form">
          <div className="swiss-form-group">
            <label className="swiss-form-label">Email Address</label>
            <input
              type="email"
              className="swiss-form-input"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="swiss-form-group">
            <label className="swiss-form-label">Password</label>
            <input
              type="password"
              className="swiss-form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {activeTab === 'signup' && (
            <div className="swiss-form-group">
              <label className="swiss-form-label">Confirm Password</label>
              <input
                type="password"
                className="swiss-form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <button
            type="submit"
            className="swiss-btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : activeTab === 'signin' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        {/* Social Dividers */}
        <div className="swiss-login-divider">Or continue with</div>

        {/* Federated logins */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            type="button"
            className="swiss-btn-social"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <span className="swiss-btn-social-icon"><i className="fa-brands fa-google"></i></span>
            Sign in with Google
          </button>

          <button
            type="button"
            className="swiss-btn-social"
            onClick={handleAnonymousSignIn}
            disabled={isLoading}
            style={{ borderStyle: 'dashed' }}
          >
            <span className="swiss-btn-social-icon"><i className="fa-solid fa-user-ninja"></i></span>
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}
