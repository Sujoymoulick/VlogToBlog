import React, { useState } from 'react';

const TONES = [
  { id: 'casual', title: 'Conversational', icon: 'fa-solid fa-comments' },
  { id: 'formal', title: 'Professional', icon: 'fa-solid fa-briefcase' },
  { id: 'educational', title: 'Educational', icon: 'fa-solid fa-graduation-cap' },
  { id: 'technical', title: 'Technical', icon: 'fa-solid fa-laptop-code' },
  { id: 'inspirational', title: 'Inspirational', icon: 'fa-solid fa-wand-magic-sparkles' },
  { id: 'humorous', title: 'Humorous', icon: 'fa-solid fa-masks-theater' }
];

const FORMATS = [
  { id: 'standard', title: 'Standard Article' },
  { id: 'tutorial', title: 'Step-by-Step Tutorial' },
  { id: 'qa', title: 'Q&A / FAQs' },
  { id: 'listicle', title: 'Numbered Listicle' }
];

const LENGTHS = [
  { id: 'short', title: 'Short (~600 words)' },
  { id: 'medium', title: 'Medium (~1200 words)' },
  { id: 'long', title: 'Deep-Dive (~2000 words)' }
];

const LANGUAGES = [
  { id: 'english', title: 'English' },
  { id: 'spanish', title: 'Spanish (Español)' },
  { id: 'french', title: 'French (Français)' },
  { id: 'german', title: 'German (Deutsch)' },
  { id: 'italian', title: 'Italian (Italiano)' },
  { id: 'portuguese', title: 'Portuguese (Português)' }
];

export default function ConverterForm({ onConvert, isLoading, settings, onSettingsChange }) {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [activePopover, setActivePopover] = useState(null); // 'tone' | 'format' | 'length' | 'language' | null

  // Support controlled props with standard defaults
  const tone = settings?.tone || 'casual';
  const format = settings?.format || 'standard';
  const length = settings?.length || 'medium';
  const language = settings?.language || 'english';

  const updateSetting = (key, val) => {
    if (onSettingsChange) {
      onSettingsChange({
        tone,
        format,
        length,
        language,
        [key]: val
      });
    }
  };

  // Live URL validation
  const handleUrlChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    
    const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    setIsValidUrl(regex.test(val.trim()));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidUrl) return;
    
    onConvert({
      url: url.trim(),
      tone,
      format,
      length,
      language
    });
  };

  return (
    <div className="gemini-prompt-wrapper">
      {/* 1. Rounded Prompt input pill */}
      <form onSubmit={handleSubmit} className="gemini-prompt-pill">
        <span className="gemini-prompt-icon-left"><i className="fa-solid fa-link"></i></span>
        <input
          type="text"
          className="gemini-prompt-input"
          placeholder="Paste YouTube Video Link..."
          value={url}
          onChange={handleUrlChange}
          disabled={isLoading}
        />
        <div className="gemini-prompt-actions-right">
          <button
            type="submit"
            className="gemini-prompt-submit-btn"
            disabled={!isValidUrl || isLoading}
            title="Distill Video"
          >
            {isLoading ? (
              <span className="spinner" style={{ border: '2px solid rgba(11,87,208,0.3)', borderTopColor: '#0b57d0' }}></span>
            ) : (
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            )}
          </button>
        </div>
      </form>

      {/* 2. Custom configuration capsules row */}
      <div className="gemini-capsules-row">
        
        {/* Tone capsule popover */}
        <div className="gemini-capsule-wrapper" style={{ position: 'relative' }}>
          <div 
            className={`gemini-capsule ${tone ? 'active' : ''}`}
            onClick={() => setActivePopover(activePopover === 'tone' ? null : 'tone')}
          >
            <span><i className={TONES.find(t => t.id === tone)?.icon} style={{ marginRight: '0.4rem' }}></i> Tone: {TONES.find(t => t.id === tone)?.title}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }}></i>
          </div>
          {activePopover === 'tone' && (
            <div className="gemini-popover-menu">
              {TONES.map(t => (
                <button
                  type="button"
                  key={t.id}
                  className={`gemini-popover-item ${tone === t.id ? 'active' : ''}`}
                  onClick={() => { updateSetting('tone', t.id); setActivePopover(null); }}
                >
                  <span><i className={t.icon} style={{ marginRight: '0.5rem', width: '1.2rem', textAlign: 'center' }}></i> {t.title}</span>
                  {tone === t.id && <i className="fa-solid fa-check"></i>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Format capsule popover */}
        <div className="gemini-capsule-wrapper" style={{ position: 'relative' }}>
          <div 
            className={`gemini-capsule ${format ? 'active' : ''}`}
            onClick={() => setActivePopover(activePopover === 'format' ? null : 'format')}
          >
            <span><i className="fa-solid fa-file-invoice" style={{ marginRight: '0.4rem' }}></i> Format: {FORMATS.find(f => f.id === format)?.title}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }}></i>
          </div>
          {activePopover === 'format' && (
            <div className="gemini-popover-menu">
              {FORMATS.map(f => (
                <button
                  type="button"
                  key={f.id}
                  className={`gemini-popover-item ${format === f.id ? 'active' : ''}`}
                  onClick={() => { updateSetting('format', f.id); setActivePopover(null); }}
                >
                  <span>{f.title}</span>
                  {format === f.id && <i className="fa-solid fa-check"></i>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Length capsule popover */}
        <div className="gemini-capsule-wrapper" style={{ position: 'relative' }}>
          <div 
            className={`gemini-capsule ${length ? 'active' : ''}`}
            onClick={() => setActivePopover(activePopover === 'length' ? null : 'length')}
          >
            <span><i className="fa-solid fa-hourglass-half" style={{ marginRight: '0.4rem' }}></i> Length: {LENGTHS.find(l => l.id === length)?.title.split(' ')[0]}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }}></i>
          </div>
          {activePopover === 'length' && (
            <div className="gemini-popover-menu">
              {LENGTHS.map(l => (
                <button
                  type="button"
                  key={l.id}
                  className={`gemini-popover-item ${length === l.id ? 'active' : ''}`}
                  onClick={() => { updateSetting('length', l.id); setActivePopover(null); }}
                >
                  <span>{l.title}</span>
                  {length === l.id && <i className="fa-solid fa-check"></i>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language capsule popover */}
        <div className="gemini-capsule-wrapper" style={{ position: 'relative' }}>
          <div 
            className={`gemini-capsule ${language ? 'active' : ''}`}
            onClick={() => setActivePopover(activePopover === 'language' ? null : 'language')}
          >
            <span><i className="fa-solid fa-globe" style={{ marginRight: '0.4rem' }}></i> Lang: {LANGUAGES.find(lang => lang.id === language)?.title}</span>
            <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', marginLeft: '0.4rem' }}></i>
          </div>
          {activePopover === 'language' && (
            <div className="gemini-popover-menu">
              {LANGUAGES.map(lang => (
                <button
                  type="button"
                  key={lang.id}
                  className={`gemini-popover-item ${language === lang.id ? 'active' : ''}`}
                  onClick={() => { updateSetting('language', lang.id); setActivePopover(null); }}
                >
                  <span>{lang.title}</span>
                  {language === lang.id && <i className="fa-solid fa-check"></i>}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
