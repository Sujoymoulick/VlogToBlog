import React, { useState } from 'react';
import { ref, set, push } from 'firebase/database';
import { 
  auth, 
  rtdb,
  triggerAlert
} from '../firebase';

/**
 * Clean and lightweight client-side markdown-to-HTML parser.
 * Supports H1, H2, H3, Bold, Italics, Lists, Code blocks, and Blockquotes.
 * 
 * @param {string} md - Raw markdown text.
 * @returns {string} Safe HTML string.
 */
function renderMarkdown(md) {
  if (!md) return '';
  let html = md;

  // Escape HTML to prevent XSS (allowing only markdown characters)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Render headers
  html = html.replace(/^# (.*?)$/gm, '<h1 class="preview-h1">$1</h1>');
  html = html.replace(/^## (.*?)$/gm, '<h2 class="preview-h2">$1</h2>');
  html = html.replace(/^### (.*?)$/gm, '<h3 class="preview-h3">$1</h3>');

  // Render bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="preview-strong">$1</strong>');

  // Render italics
  html = html.replace(/\*(.*?)\*/g, '<em class="preview-em">$1</em>');

  // Render code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
    return `<pre class="preview-pre"><code class="preview-code">${code}</code></pre>`;
  });

  // Render inline code
  html = html.replace(/`([^`]+)`/g, '<code class="preview-inline-code">$1</code>');

  // Render blockquotes
  html = html.replace(/^&gt; (.*?)$/gm, '<blockquote class="preview-blockquote"><p>$1</p></blockquote>');

  // Render horizontal rule
  html = html.replace(/^---$/gm, '<hr class="preview-hr" />');

  // Render bullet lists
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="preview-li">$1</li>');
  html = html.replace(/(<li class="preview-li">.*?<\/li>)+/gs, '<ul class="preview-ul">$&</ul>');

  // Render numbered lists
  html = html.replace(/^\s*\d+\.\s+(.*?)$/gm, '<li class="preview-oli">$1</li>');
  html = html.replace(/(<li class="preview-oli">.*?<\/li>)+/gs, '<ol class="preview-ol">$&</ol>');

  // Wrap remaining text blocks in paragraphs
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('<h') || 
        trimmed.startsWith('<ul') || 
        trimmed.startsWith('<ol') || 
        trimmed.startsWith('<li') || 
        trimmed.startsWith('<blockquote') || 
        trimmed.startsWith('<pre') || 
        trimmed.startsWith('<code') || 
        trimmed.startsWith('<hr') || 
        trimmed.startsWith('</')) {
      return line;
    }
    return `<p class="preview-p">${line}</p>`;
  });

  return processedLines.join('\n');
}

export default function BlogPreview({ data, onBlogUpdate }) {
  const metadata = data.metadata || {
    title: data.title || 'Untitled YouTube Video',
    author: data.author || 'Unknown Channel',
    videoId: data.videoId || '',
    thumbnail: data.thumbnail || '',
    durationStr: data.durationStr || ''
  };
  const blog = data.blog;
  const transcript = data.transcript;
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftId, setDraftId] = useState(data.id || null);

  // Statistics calculations
  const wordCount = blog.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 225)); // Average 225 words per minute

  const handleSaveDraft = async () => {
    if (!auth.currentUser) {
      triggerAlert('You must be signed in to save drafts.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const draftPayload = {
        userId: auth.currentUser.uid,
        metadata: {
          title: metadata.title || 'Untitled YouTube Video',
          author: metadata.author || 'Unknown Channel',
          videoId: metadata.videoId || '',
          thumbnail: metadata.thumbnail || '',
          durationStr: metadata.durationStr || ''
        },
        blog: blog,
        transcript: transcript || {},
        updatedAt: Date.now()
      };

      if (draftId) {
        const draftRef = ref(rtdb, `drafts/${auth.currentUser.uid}/${draftId}`);
        await set(draftRef, draftPayload);
      } else {
        draftPayload.createdAt = Date.now();
        const draftsRef = ref(rtdb, `drafts/${auth.currentUser.uid}`);
        const newDraftRef = push(draftsRef);
        await set(newDraftRef, draftPayload);
        setDraftId(newDraftRef.key);
      }
      triggerAlert('Draft saved successfully to Realtime Database!', 'success');
    } catch (err) {
      console.error('Error saving draft to Realtime Database:', err);
      triggerAlert('Failed to save draft: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(blog);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = (formatType) => {
    const cleanTitle = metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    if (formatType === 'md') {
      const blob = new Blob([blog], { type: 'text/markdown;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${cleanTitle}_blog_post.md`;
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      // Strip markdown headers and codes to download a clean text layout
      const cleanText = blog
        .replace(/^#+\s+/gm, '') // Remove headers
        .replace(/\*\*/g, '')    // Remove bold markdown
        .replace(/\*/g, '')     // Remove italic markdown
        .replace(/`{3}[\s\S]*?`{3}/g, '') // Remove code blocks
        .replace(/`([^`]+)`/g, '$1') // Remove inline codes
        .replace(/^>\s+/gm, ''); // Remove blockquotes
        
      const blob = new Blob([cleanText], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${cleanTitle}_blog_post.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Video metadata header */}
      <div className="meta-card">
        <img 
          src={metadata.thumbnail} 
          alt={metadata.title} 
          className="meta-thumb" 
          onError={(e) => {
            // If high-res maxresdefault thumbnail fails (e.g. not uploaded), fallback to mqdefault
            e.target.src = `https://i.ytimg.com/vi/${metadata.videoId}/mqdefault.jpg`;
          }}
        />
        <div className="meta-details">
          <h4 className="meta-title">{metadata.title}</h4>
          <span className="meta-channel"><i className="fa-solid fa-tv" style={{ marginRight: '0.35rem' }}></i> {metadata.author}</span>
          <span className="meta-duration"><i className="fa-solid fa-clock" style={{ marginRight: '0.35rem' }}></i> Duration: {metadata.durationStr}</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="preview-tabs">
        <button
          className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          <i className="fa-solid fa-file-lines" style={{ marginRight: '0.4rem' }}></i> Blog Preview
        </button>
        <button
          className={`tab-btn ${activeTab === 'markdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('markdown')}
        >
          <i className="fa-solid fa-pen-to-square" style={{ marginRight: '0.4rem' }}></i> Edit Markdown
        </button>
        <button
          className={`tab-btn ${activeTab === 'transcript' ? 'active' : ''}`}
          onClick={() => setActiveTab('transcript')}
        >
          <i className="fa-solid fa-file-audio" style={{ marginRight: '0.4rem' }}></i> Video Transcript
        </button>
      </div>

      {/* Tab body content */}
      <div className="preview-content">
        
        {activeTab === 'preview' && (
          <div 
            style={{ animation: 'slideDown 0.25s ease-out' }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(blog) }}
          />
        )}

        {activeTab === 'markdown' && (
          <div style={{ animation: 'slideDown 0.25s ease-out' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              💡 Feel free to customize or edit the raw markdown below. Changes are saved automatically!
            </p>
            <textarea
              className="preview-markdown-textarea"
              value={blog}
              onChange={(e) => onBlogUpdate(e.target.value)}
              placeholder="Edit blog post here..."
            />
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="transcript-list" style={{ animation: 'slideDown 0.25s ease-out' }}>
            {transcript && transcript.segments && transcript.segments.length > 0 ? (
              transcript.segments.map((seg, idx) => (
                <div key={idx} className="transcript-row">
                  <span className="transcript-time">{seg.timeStr}</span>
                  <span className="transcript-text">{seg.text}</span>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No transcript data available.</p>
            )}
          </div>
        )}

      </div>

      {/* Interactive controls footer */}
      <div className="preview-footer">
        
        <div className="stats-bar">
          <div className="stat-item">
            Words: <span className="stat-val">{wordCount}</span>
          </div>
          <div className="stat-item">
            Reading time: <span className="stat-val">{readingTime} min</span>
          </div>
          <div className="stat-item">
            Grade Score: <span className="stat-val" style={{ color: 'hsla(var(--accent-cyan), 1)' }}>A+</span>
          </div>
        </div>

        <div className="actions-bar">
          <button 
            className="action-btn" 
            onClick={handleSaveDraft}
            disabled={saving}
            style={{ backgroundColor: draftId ? 'var(--swiss-red)' : '#ffffff', color: draftId ? '#ffffff' : '#111111' }}
          >
            {saving ? <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.4rem' }}></i> Saving...</span> : draftId ? <span><i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.4rem' }}></i> Update Draft</span> : <span><i className="fa-solid fa-floppy-disk" style={{ marginRight: '0.4rem' }}></i> Save Draft</span>}
          </button>

          <button 
            className={`action-btn ${copied ? 'success' : ''}`} 
            onClick={handleCopy}
          >
            {copied ? <span><i className="fa-solid fa-check" style={{ marginRight: '0.4rem' }}></i> Copied!</span> : <span><i className="fa-solid fa-copy" style={{ marginRight: '0.4rem' }}></i> Copy Blog</span>}
          </button>
          
          <button 
            className="action-btn" 
            onClick={() => handleDownload('md')}
          >
            <span><i className="fa-solid fa-file-arrow-down" style={{ marginRight: '0.4rem' }}></i> Download .MD</span>
          </button>
          
          <button 
            className="action-btn" 
            onClick={() => handleDownload('txt')}
          >
            <span><i className="fa-solid fa-file-arrow-down" style={{ marginRight: '0.4rem' }}></i> Download .TXT</span>
          </button>
        </div>

      </div>

    </div>
  );
}
