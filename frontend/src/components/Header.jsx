import React from 'react';

export default function Header({ onBackHome }) {
  return (
    <header className="header-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
      {onBackHome && (
        <div style={{ alignSelf: 'flex-start', width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '0.5rem' }}>
          <button 
            className="swiss-back-home-btn" 
            onClick={onBackHome}
          >
            ← Back to Home
          </button>
        </div>
      )}
      <h1 className="glow-title">VlogToBlog</h1>
      <p className="sub-title">
        Convert any <span className="text-gradient">YouTube Video</span> into a structured, engaging, and SEO-optimized blog post in seconds.
      </p>
    </header>
  );
}
