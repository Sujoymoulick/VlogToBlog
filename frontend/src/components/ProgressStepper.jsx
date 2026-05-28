import React from 'react';

const STEPS = [
  { id: 1, title: 'Connecting to YouTube', desc: 'Verifying public link and retrieving metadata records...' },
  { id: 2, title: 'Extracting Closed Captions', desc: 'Scraping closed captions and timing marks from the YouTube Timing API...' },
  { id: 3, title: 'Gemini AI Synthesis', desc: 'Distilling transcript details and structuring content layouts...' },
  { id: 4, title: 'Refining Output', desc: 'Finalizing reading metrics and formatting the raw Markdown output...' }
];

export default function ProgressStepper({ currentStep }) {
  const activeStep = STEPS.find(s => s.id === currentStep) || STEPS[0];

  return (
    <div className="gemini-loader-container">
      {/* Pulsing Gradient AI Star SVG */}
      <svg viewBox="0 0 24 24" className="gemini-loader-logo">
        <path d="M12,2L14.8,8.4L21.2,9.2L16.3,13.6L17.8,20L12,16.5L6.2,20L7.7,13.6L2.8,9.2L9.2,8.4L12,2Z" fill="url(#loader-gradient)" />
        <defs>
          <linearGradient id="loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7e22ce" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main Status Text */}
      <h3 className="gemini-loader-status">
        {activeStep.title}
      </h3>

      {/* Substatus detail description */}
      <p className="gemini-loader-substatus">
        {activeStep.desc}
      </p>
    </div>
  );
}
