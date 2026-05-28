import React, { useState, useEffect } from 'react';
import './LandingPage.css';

function TypingText({ text, speed = 35 }) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  return (
    <>
      {displayedText}
      <span className="swiss-typing-cursor" style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.15s ease' }}>|</span>
    </>
  );
}

export default function LandingPage({ onLaunchApp }) {
  const [showNavMenu, setShowNavMenu] = useState(false);

  // Smooth scroll helper for landing page anchors
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="swiss-landing">
      {/* 1. Header Navigation */}
      <nav className="swiss-nav">
        <div className="swiss-nav-logo" onClick={() => scrollToSection('about')}>VlogToBlog</div>
        
        {/* Desktop Links */}
        <div className="swiss-nav-links desktop-only">
          <a className="swiss-nav-link" onClick={() => scrollToSection('about')}>About</a>
          <a className="swiss-nav-link" onClick={() => scrollToSection('features')}>Features</a>
          <a className="swiss-nav-link" onClick={() => scrollToSection('how-it-works')}>How it works</a>
        </div>
        <button className="swiss-nav-btn desktop-only" onClick={onLaunchApp}>
          Launch App
        </button>

        {/* Mobile 3-Dot Toggle Button */}
        <button 
          type="button"
          className="swiss-nav-mobile-toggle"
          onClick={() => setShowNavMenu(!showNavMenu)}
          title="Menu Options"
        >
          <i className="fa-solid fa-ellipsis-vertical"></i>
        </button>

        {/* Mobile Menu Dropdown */}
        {showNavMenu && (
          <>
            <div 
              className="swiss-nav-mobile-backdrop"
              onClick={() => setShowNavMenu(false)}
            />
            <div className="swiss-nav-mobile-dropdown">
              <div className="swiss-nav-mobile-header">
                <span className="swiss-nav-mobile-title">Explore</span>
                <button 
                  type="button"
                  className="swiss-nav-mobile-close"
                  onClick={() => setShowNavMenu(false)}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="swiss-nav-mobile-items">
                <button 
                  type="button"
                  className="swiss-nav-mobile-item"
                  onClick={() => {
                    scrollToSection('about');
                    setShowNavMenu(false);
                  }}
                >
                  About
                </button>
                <button 
                  type="button"
                  className="swiss-nav-mobile-item"
                  onClick={() => {
                    scrollToSection('features');
                    setShowNavMenu(false);
                  }}
                >
                  Features
                </button>
                <button 
                  type="button"
                  className="swiss-nav-mobile-item"
                  onClick={() => {
                    scrollToSection('how-it-works');
                    setShowNavMenu(false);
                  }}
                >
                  How It Works
                </button>
                <div className="swiss-nav-mobile-divider" />
                <button 
                  type="button"
                  className="swiss-nav-mobile-btn"
                  onClick={() => {
                    onLaunchApp();
                    setShowNavMenu(false);
                  }}
                >
                  Launch App
                </button>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* 2. Hero Section */}
      <header className="swiss-hero-grid" id="about">
        {/* Left Hero Column */}
        <div className="swiss-hero-left">
          <div>
            <h1>
              <span className="swiss-reveal-line">
                <span className="swiss-reveal-text" style={{ animationDelay: '0.1s' }}>Content is a decision.</span>
              </span>
              <span className="swiss-reveal-line">
                <span className="swiss-reveal-text" style={{ animationDelay: '0.25s' }}>Made once.</span>
              </span>
              <span className="swiss-reveal-line">
                <span className="swiss-reveal-text" style={{ animationDelay: '0.4s' }}>Read everywhere.</span>
              </span>
            </h1>
            <p>
              Transform arbitrary YouTube videos into highly structured, search-engine-optimized, and readable blog posts. Crafted in seconds using Google Gemini AI.
            </p>
          </div>
          <button className="swiss-hero-left-btn" onClick={onLaunchApp}>
            Start Converting <span>→</span>
          </button>
        </div>

        {/* Right Hero Column (Swiss Curved Graphic) */}
        <div className="swiss-hero-right">
          <div className="swiss-hero-curved-graphic">
            <p>
              <TypingText 
                text="Most videos fill time. VlogToBlog distills it. What stays is what matters—the idea, the structure, the core message that holds when the noise is stripped away." 
                speed={35}
              />
            </p>
          </div>
        </div>
      </header>

      {/* 3. Typographic Accent Spacer (Smooth Endless Marquee) */}
      <div className="swiss-marquee-container">
        <div className="swiss-marquee-track">
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          
          {/* Duplicated track for seamless loop alignment */}
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
          <span className="swiss-marquee-item">DISTILL</span>
          <span className="swiss-marquee-dot">•</span>
        </div>
      </div>

      {/* 4. Features Showcase Section */}
      <section className="swiss-features-section" id="features">
        <div className="swiss-features-header">
          <h2>Core features made for modern creators</h2>
          <p>
            VlogToBlog combines timing transcript scraping with state-of-the-art AI synthesis to deliver professional-grade written assets.
          </p>
        </div>

        <div className="swiss-features-grid">
          {/* Feature 01 */}
          <div className="swiss-feature-card">
            <div className="swiss-feature-num">01</div>
            <div>
              <h3 className="swiss-feature-title">Caption Scraper</h3>
              <p className="swiss-feature-desc">
                Direct transcription retrieval using YouTube's internal timing API. Completely bypasses owner OAuth limitations and captions restrictions.
              </p>
            </div>
          </div>

          {/* Feature 02 */}
          <div className="swiss-feature-card">
            <div className="swiss-feature-num">02</div>
            <div>
              <h3 className="swiss-feature-title">Gemini Synthesis</h3>
              <p className="swiss-feature-desc">
                Processes video context and transcripts using Google's high-speed Gemini AI engine to organize speech into structured layouts.
              </p>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="swiss-feature-card">
            <div className="swiss-feature-num">03</div>
            <div>
              <h3 className="swiss-feature-title">Tailored Tone</h3>
              <p className="swiss-feature-desc">
                Fine-tune layouts (Tutorials, Q&As, Listicles), output lengths (~600 to ~2000 words), languages, and writing tones (Conversational, Professional, Technical).
              </p>
            </div>
          </div>

          {/* Feature 04 */}
          <div className="swiss-feature-card">
            <div className="swiss-feature-num">04</div>
            <div>
              <h3 className="swiss-feature-title">Rich Workspace</h3>
              <p className="swiss-feature-desc">
                Interactive real-time Markdown preview editor, interactive timing transcripts, dynamic word counts, downloading, and swift copy options.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="swiss-steps-section" id="how-it-works">
        <div className="swiss-steps-left">
          <h2>Converting is a simple three-step rhythm</h2>
          <p>
            Skip manual video summaries. Simply copy the link, adjust the tone configuration, and export your structured blog post.
          </p>
        </div>

        <div className="swiss-steps-grid">
          {/* Step 1 */}
          <div className="swiss-step-card">
            <div className="swiss-step-badge">Step 01</div>
            <h3 className="swiss-step-title">Paste Video URL</h3>
            <p className="swiss-step-desc">
              Input any public YouTube link. The system extracts captions automatically in real-time.
            </p>
          </div>

          {/* Step 2 */}
          <div className="swiss-step-card">
            <div className="swiss-step-badge">Step 02</div>
            <h3 className="swiss-step-title">Tailor Tone</h3>
            <p className="swiss-step-desc">
              Select conversational styles, lengths, standard structures, and the desired translation language.
            </p>
          </div>

          {/* Step 3 */}
          <div className="swiss-step-card">
            <div className="swiss-step-badge">Step 03</div>
            <h3 className="swiss-step-title">Edit & Publish</h3>
            <p className="swiss-step-desc">
              Refine inside our inline markdown previewer, download as file, or copy directly.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Section */}
      <section className="swiss-cta-section">
        <h2>Transform your videos into writing</h2>
        <p>
          Generate search-engine-friendly articles, structured tutorials, and comprehensive transcripts in seconds.
        </p>
        <button className="swiss-cta-btn" onClick={onLaunchApp}>
          Launch Converter <span>→</span>
        </button>
      </section>

      {/* 7. Footer */}
      <footer className="swiss-footer">
        <p>VlogToBlog &copy; 2026. Premium AI Web Engine.</p>
        <p>Swiss Style Typographic System. Minimalist Design.</p>
      </footer>
    </div>
  );
}
