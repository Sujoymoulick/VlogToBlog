import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ConverterForm from './components/ConverterForm';
import ProgressStepper from './components/ProgressStepper';
import BlogPreview from './components/BlogPreview';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import { ref, set, get } from 'firebase/database';
import { 
  auth, 
  db, 
  rtdb,
  signOut, 
  onAuthStateChanged,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  linkWithCredential,
  EmailAuthProvider,
  doc,
  getDoc,
  setDoc,
  triggerAlert
} from './firebase';

// Support backend running locally (port 5001) or configured via environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [workspaceView, setWorkspaceView] = useState('chat'); // 'chat' | 'drafts'
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [settings, setSettings] = useState({
    tone: 'casual',
    format: 'standard',
    length: 'medium',
    language: 'english'
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' | 'warning' }
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Guest upgrade state parameters
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeError, setUpgradeError] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [conversionData, setConversionData] = useState(null);

  // 1. Listen to Firebase Authentication State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      
      // Reset view states on sign out
      if (!currentUser) {
        setConversionData(null);
        setError(null);
        setWorkspaceView('chat');
        setShowProfileMenu(false);
        setShowUpgradeModal(false);
      }
    });
    return unsubscribe;
  }, []);

  // Listen to premium Swiss alerts dispatch
  useEffect(() => {
    const handleSwissAlert = (e) => {
      const { message, type } = e.detail;
      setToast({ message, type });
    };
    window.addEventListener('swiss-alert', handleSwissAlert);
    return () => window.removeEventListener('swiss-alert', handleSwissAlert);
  }, []);

  // 2. Fetch User Drafts from Firebase Realtime Database
  const fetchDrafts = async () => {
    if (!user) return;
    try {
      const dbRef = ref(rtdb, `drafts/${user.uid}`);
      const snapshot = await get(dbRef);
      const draftsList = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          draftsList.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
      }
      // Sort chronologically by updatedAt descending on client
      draftsList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setSavedDrafts(draftsList);
    } catch (err) {
      console.error('Error fetching drafts from Realtime Database:', err);
    }
  };

  useEffect(() => {
    if (user && workspaceView === 'drafts') {
      fetchDrafts();
    }
  }, [user, workspaceView]);

  // Fetch Settings from Firebase Realtime Database
  const fetchSettings = async () => {
    if (!auth.currentUser) return;
    try {
      const dbRef = ref(rtdb, `settings/${auth.currentUser.uid}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        setSettings(snapshot.val());
      }
    } catch (err) {
      console.error('Error fetching settings from Realtime Database:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const handleSettingsChange = async (newSettings) => {
    setSettings(newSettings);
    if (!auth.currentUser) return;
    try {
      const dbRef = ref(rtdb, `settings/${auth.currentUser.uid}`);
      await set(dbRef, newSettings);
    } catch (err) {
      console.error('Error saving settings to Realtime Database:', err);
    }
  };

  // Stepper animation logic
  useEffect(() => {
    let timer1, timer2, timer3;

    if (isLoading) {
      setCurrentStep(1);
      
      timer1 = setTimeout(() => {
        setCurrentStep(2);
      }, 1500);

      timer2 = setTimeout(() => {
        setCurrentStep(3);
      }, 3500);

      timer3 = setTimeout(() => {
        setCurrentStep(4);
      }, 7500);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading]);

  const handleConvert = async (options) => {
    setIsLoading(true);
    setError(null);
    setConversionData(null);

    try {
      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server responded with an error. Please try again.');
      }

      setCurrentStep(4);
      setTimeout(() => {
        setConversionData(data);
        setIsLoading(false);
      }, 600);

    } catch (err) {
      console.error('API Error:', err);
      setError({
        title: 'Conversion Failed',
        desc: err.message || 'Unable to communicate with the conversion backend. Please ensure the server is active.'
      });
      setIsLoading(false);
    }
  };

  // Sync edits from raw markdown tab
  const handleBlogUpdate = (newBlog) => {
    setConversionData(prev => ({
      ...prev,
      blog: newBlog
    }));
  };

  // 3. Link Anonymous Guest to Permanent Account (Upgrade)
  const handleUpgradeAccount = async (e) => {
    e.preventDefault();
    if (!upgradeEmail.trim() || !upgradePassword.trim()) {
      setUpgradeError('Please provide both email and password fields.');
      return;
    }
    setIsUpgrading(true);
    setUpgradeError(null);

    try {
      const credential = EmailAuthProvider.credential(upgradeEmail.trim(), upgradePassword);
      await linkWithCredential(auth.currentUser, credential);
      
      // Success: Close modal and fetch fresh settings/drafts if any
      setShowUpgradeModal(false);
      setUpgradeEmail('');
      setUpgradePassword('');
      triggerAlert('Your guest account has been successfully upgraded to a permanent account! All drafts are preserved.', 'success');
    } catch (err) {
      console.error('Upgrade Linking Error:', err);
      let friendly = err.message;
      if (err.code === 'auth/email-already-in-use') {
        friendly = 'This email is already linked to another Firebase account.';
      } else if (err.code === 'auth/credential-already-in-use') {
        friendly = 'This email account is already associated with a permanent user.';
      }
      setUpgradeError(friendly);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  // Render Loader if Authentications are in progress
  if (isAuthLoading) {
    return (
      <div className="gemini-app-layout" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF6F0' }}>
        <div className="gemini-loader-container">
          <svg viewBox="0 0 24 24" className="gemini-loader-logo">
            <path d="M12,2L14.8,8.4L21.2,9.2L16.3,13.6L17.8,20L12,16.5L6.2,20L7.7,13.6L2.8,9.2L9.2,8.4L12,2Z" fill="url(#loading-grad)" />
            <defs>
              <linearGradient id="loading-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E63E26" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <div className="gemini-loader-status" style={{ marginTop: '1rem' }}>Authenticating Session...</div>
        </div>
      </div>
    );
  }

  // Renders the Public Swiss Landing Page
  if (view === 'landing') {
    return <LandingPage onLaunchApp={() => setView('app')} />;
  }

  // Forces LoginPage render if user is unauthenticated
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="gemini-app-layout">
      
      {/* Mobile Floating 3-Dot Toggle Button */}
      <button 
        type="button"
        className="gemini-mobile-menu-toggle"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        title="Menu Options"
      >
        <i className="fa-solid fa-ellipsis-vertical"></i>
      </button>
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="gemini-sidebar">
        <div className="gemini-sidebar-top">
          <div className="gemini-logo-wrapper">
            <svg viewBox="0 0 24 24" className="gemini-ai-star">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6.5A5.5,5.5 0 0,0 6.5,12A5.5,5.5 0 0,0 12,17.5A5.5,5.5 0 0,0 17.5,12A5.5,5.5 0 0,0 12,6.5Z" fill="url(#gemini-gradient)" />
              <defs>
                <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E63E26" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        <div className="gemini-sidebar-middle">
          {/* Go back to public Landing page */}
          <button 
            className="gemini-sidebar-btn" 
            onClick={() => setView('landing')} 
            title="Go back to Landing Page"
          >
            <i className="fa-solid fa-house"></i>
          </button>
          
          {/* Create new blog post Chat prompt */}
          <button 
            className={`gemini-sidebar-btn ${workspaceView === 'chat' ? 'active' : ''}`} 
            onClick={() => { setWorkspaceView('chat'); setConversionData(null); setError(null); }} 
            title="Start New Distill"
          >
            <i className="fa-solid fa-comment-dots"></i>
          </button>

          {/* Cloud Database Saved Drafts dashboard */}
          <button 
            className={`gemini-sidebar-btn ${workspaceView === 'drafts' ? 'active' : ''}`} 
            onClick={() => setWorkspaceView('drafts')} 
            title="Saved Drafts Database"
          >
            <i className="fa-solid fa-folder-open"></i>
          </button>
        </div>
        
        <div className="gemini-sidebar-bottom">
          {user.isAnonymous && (
            <button 
              className="gemini-sidebar-btn" 
              onClick={() => setShowUpgradeModal(true)} 
              title="Upgrade Guest Account" 
              style={{ color: '#E63E26', border: '2px solid #E63E26', animation: 'pulseGrad 2s infinite ease-in-out' }}
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
            </button>
          )}
          <button className="gemini-sidebar-btn" title="Settings">
            <i className="fa-solid fa-gear"></i>
          </button>
          
          {/* Profile capsule with dropdown menu */}
          <div style={{ position: 'relative' }}>
            <div 
              className="gemini-user-profile" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="User Profile Menu"
            >
              {user.isAnonymous ? 'G' : (user.email ? user.email[0].toUpperCase() : 'U')}
            </div>

            {showProfileMenu && (
              <div 
                className="gemini-popover-menu" 
                style={{ bottom: 'calc(100% + 12px)', left: '10px', transform: 'none' }}
              >
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #111111', fontSize: '0.8rem', fontWeight: '800', color: '#767676' }}>
                  {user.isAnonymous ? 'GUEST USER' : user.email}
                </div>
                {user.isAnonymous && (
                  <button
                    type="button"
                    className="gemini-popover-item"
                    style={{ color: '#E63E26' }}
                    onClick={() => { setShowUpgradeModal(true); setShowProfileMenu(false); }}
                  >
                    Link Account
                  </button>
                )}
                <button
                  type="button"
                  className="gemini-popover-item"
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace Area */}
      <div className="gemini-workspace">
        <div className="gemini-glow-vignette"></div>

        <main className="gemini-main-scrollable">
          
          {workspaceView === 'chat' ? (
            /* ========================================== */
            /* A. Conversational distills prompt view    */
            /* ========================================== */
            (!conversionData && !isLoading ? (
              /* A1. Startup Centered prompt */
              <div className="gemini-start-panel">
                <h2 className="gemini-greeting">What video shall we distill today?</h2>
                <ConverterForm 
                  onConvert={handleConvert} 
                  isLoading={isLoading} 
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              </div>
            ) : (
              /* A2. Conversational response grid */
              <div className="gemini-chat-container">
                <div className="gemini-chat-row user-row">
                  <div className="gemini-user-avatar">
                    {user.isAnonymous ? 'G' : (user.email ? user.email[0].toUpperCase() : 'U')}
                  </div>
                  <div className="gemini-chat-bubble user-bubble">
                    <div className="gemini-source-attachment">
                      <span className="source-icon"><i className="fa-solid fa-link"></i></span>
                      <span className="source-url-text">Distill YouTube Source Link</span>
                    </div>
                  </div>
                </div>

                <div className="gemini-chat-row ai-row">
                  <div className="gemini-ai-avatar">
                    <svg viewBox="0 0 24 24" className="gemini-star-spark">
                      <path d="M12,2L14.8,8.4L21.2,9.2L16.3,13.6L17.8,20L12,16.5L6.2,20L7.7,13.6L2.8,9.2L9.2,8.4L12,2Z" fill="url(#spark-grad)" />
                      <defs>
                        <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E63E26" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="gemini-chat-bubble ai-bubble">
                    {isLoading && (
                      <ProgressStepper currentStep={currentStep} />
                    )}

                    {conversionData && !isLoading && (
                      <BlogPreview 
                        data={conversionData} 
                        onBlogUpdate={handleBlogUpdate}
                      />
                    )}

                    {error && (
                      <div className="error-panel">
                        <span style={{ fontSize: '1.5rem', color: '#E63E26' }}><i className="fa-solid fa-triangle-exclamation"></i></span>
                        <div>
                          <div className="error-title">{error.title}</div>
                          <div className="error-desc">{error.desc}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* ========================================== */
            /* B. Saved Drafts Cloud Database dashboard   */
            /* ========================================== */
            <div className="gemini-chat-container">
              <h2 className="gemini-greeting" style={{ textAlign: 'left', marginBottom: '1.5rem', fontSize: '2rem' }}>Saved Blog Drafts</h2>
              {savedDrafts.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  {savedDrafts.map(draft => {
                    const draftTitle = draft.metadata?.title || draft.title || 'Untitled YouTube Video';
                    const draftAuthor = draft.metadata?.author || draft.author || 'Unknown Channel';
                    const draftThumbnail = draft.metadata?.thumbnail || draft.thumbnail || '';
                    const savedDate = new Date(
                      draft.updatedAt?.seconds 
                        ? draft.updatedAt.seconds * 1000 
                        : (typeof draft.updatedAt === 'number' ? draft.updatedAt : Date.now())
                    ).toLocaleDateString();

                    return (
                      <div 
                        key={draft.id} 
                        className="meta-card" 
                        style={{ 
                          flexDirection: 'column', 
                          cursor: 'pointer', 
                          gap: '1rem', 
                          margin: 0,
                          transition: 'transform 0.2s ease',
                          border: '2px solid #111111'
                        }}
                        onClick={() => {
                          setConversionData(draft);
                          setWorkspaceView('chat');
                        }}
                      >
                        <img 
                          src={draftThumbnail} 
                          alt={draftTitle} 
                          className="meta-thumb" 
                          style={{ width: '100%', aspectRatio: '16/9', margin: 0 }}
                        />
                        <div className="meta-details" style={{ width: '100%', gap: '0.25rem' }}>
                          <h4 className="meta-title" style={{ fontSize: '0.95rem', height: '2.4rem', overflow: 'hidden' }}>{draftTitle}</h4>
                          <span className="meta-channel" style={{ fontSize: '0.8rem' }}><i className="fa-solid fa-tv" style={{ marginRight: '0.35rem' }}></i> {draftAuthor}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Saved: {savedDate}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="meta-card" style={{ padding: '3rem', textAlign: 'center', justifyContent: 'center', borderRadius: 0 }}>
                  <div style={{ maxWidth: '480px' }}>
                    <h4 className="meta-title" style={{ marginBottom: '0.5rem' }}>No Saved Drafts Yet</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                      Generate blog posts from YouTube videos and save them as drafts to access them later here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Floating bottom prompt bar: Shown when conversionData exists or is loading under chat view */}
        {workspaceView === 'chat' && (conversionData || isLoading) && (
          <div className="gemini-bottom-input-bar">
            <ConverterForm 
              onConvert={handleConvert} 
              isLoading={isLoading} 
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
          </div>
        )}
      </div>

      {/* ==========================================
          3. Link Account (Guest Upgrade) Modal      
          ========================================== */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 27, 38, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="swiss-login-card" style={{ maxWidth: '440px' }}>
            <header className="swiss-login-header">
              <h1 className="swiss-login-logo" style={{ fontSize: '1.8rem' }}>Upgrade Guest</h1>
              <p className="swiss-login-subtitle" style={{ fontSize: '0.85rem' }}>Link your account securely</p>
            </header>

            {upgradeError && (
              <div className="swiss-login-error">
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.5rem' }}></i> {upgradeError}
              </div>
            )}

            <form onSubmit={handleUpgradeAccount} className="swiss-form">
              <div className="swiss-form-group">
                <label className="swiss-form-label">Email Address</label>
                <input
                  type="email"
                  className="swiss-form-input"
                  placeholder="example@mail.com"
                  value={upgradeEmail}
                  onChange={(e) => setUpgradeEmail(e.target.value)}
                  required
                  disabled={isUpgrading}
                />
              </div>

              <div className="swiss-form-group">
                <label className="swiss-form-label">Password</label>
                <input
                  type="password"
                  className="swiss-form-input"
                  placeholder="••••••••"
                  value={upgradePassword}
                  onChange={(e) => setUpgradePassword(e.target.value)}
                  required
                  disabled={isUpgrading}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="swiss-btn-social"
                  onClick={() => { setShowUpgradeModal(false); setUpgradeEmail(''); setUpgradePassword(''); setUpgradeError(null); }}
                  disabled={isUpgrading}
                  style={{ flex: 1, borderStyle: 'solid' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="swiss-btn-primary"
                  disabled={isUpgrading}
                  style={{ flex: 1 }}
                >
                  {isUpgrading ? 'Linking...' : 'Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          4. Custom Premium Swiss Alert/Toast Popup  
          ========================================== */}
      {toast && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26, 27, 38, 0.4)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="swiss-login-card" style={{ maxWidth: '380px', textAlign: 'center', animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ fontSize: '2.5rem', color: toast.type === 'error' ? 'var(--swiss-red)' : (toast.type === 'warning' ? '#E63E26' : '#22c55e'), marginBottom: '1rem' }}>
              {toast.type === 'error' ? (
                <i className="fa-solid fa-circle-xmark"></i>
              ) : toast.type === 'warning' ? (
                <i className="fa-solid fa-triangle-exclamation"></i>
              ) : (
                <i className="fa-solid fa-circle-check"></i>
              )}
            </div>
            <h3 style={{ textTransform: 'uppercase', fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em', color: '#111111' }}>
              {toast.type === 'error' ? 'Error' : toast.type === 'warning' ? 'Alert' : 'Success'}
            </h3>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#555555', lineHeight: 1.45, marginBottom: '1.5rem', padding: '0 0.5rem' }}>
              {toast.message}
            </p>
            <button
              type="button"
              className="swiss-btn-primary"
              onClick={() => setToast(null)}
              style={{ width: '100%' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          5. Mobile Menu 3-Dot Navigation Popover
          ========================================== */}
      {showMobileMenu && (
        <>
          <div 
            className="swiss-mobile-menu-backdrop"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="swiss-mobile-menu-dropdown">
            <div className="swiss-mobile-menu-header">
              <span className="swiss-mobile-menu-title">Menu Options</span>
              <button 
                type="button"
                className="swiss-mobile-menu-close" 
                onClick={() => setShowMobileMenu(false)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="swiss-mobile-menu-items">
              <button 
                type="button"
                className={`swiss-mobile-menu-item ${view === 'landing' ? 'active' : ''}`}
                onClick={() => {
                  setView('landing');
                  setShowMobileMenu(false);
                }}
              >
                <i className="fa-solid fa-house"></i> Home (Landing)
              </button>

              <button 
                type="button"
                className={`swiss-mobile-menu-item ${workspaceView === 'chat' && view === 'app' ? 'active' : ''}`}
                onClick={() => {
                  setView('app');
                  setWorkspaceView('chat');
                  setConversionData(null);
                  setError(null);
                  setShowMobileMenu(false);
                }}
              >
                <i className="fa-solid fa-comment-dots"></i> Start New Distill
              </button>

              <button 
                type="button"
                className={`swiss-mobile-menu-item ${workspaceView === 'drafts' && view === 'app' ? 'active' : ''}`}
                onClick={() => {
                  setView('app');
                  setWorkspaceView('drafts');
                  setShowMobileMenu(false);
                }}
              >
                <i className="fa-solid fa-folder-open"></i> Saved Drafts
              </button>

              {user.isAnonymous && (
                <button 
                  type="button"
                  className="swiss-mobile-menu-item upgrade-btn"
                  onClick={() => {
                    setShowUpgradeModal(true);
                    setShowMobileMenu(false);
                  }}
                >
                  <i className="fa-solid fa-triangle-exclamation"></i> Upgrade Guest Account
                </button>
              )}

              <div className="swiss-mobile-menu-divider" />

              <div className="swiss-mobile-menu-profile">
                <div className="profile-label">Signed in as:</div>
                <div className="profile-email">{user.isAnonymous ? 'GUEST USER' : user.email}</div>
              </div>

              <button 
                type="button"
                className="swiss-mobile-menu-item signout-btn"
                onClick={() => {
                  handleSignOut();
                  setShowMobileMenu(false);
                }}
              >
                <i className="fa-solid fa-right-from-bracket"></i> Sign Out
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
