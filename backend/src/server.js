import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import { isValidYoutubeUrl } from './utils/youtube.js';
import { getTranscript } from './services/transcriptService.js';
import { generateBlogPost } from './services/aiService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


// Security Middlewares
app.use(helmet());
app.use(morgan('dev'));

// CORS configuration - allow default React port (5173) and production client URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Request body parser
app.use(express.json());

// Rate Limiter: Limit IPs to 30 requests per 15 minutes to protect API from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, 
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many conversion requests from this IP. Please try again after 15 minutes.'
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'VlogToBlog API is running smoothly'
  });
});

// Main Conversion Endpoint
app.post('/api/convert', limiter, async (req, res, next) => {
  const { url, tone, format, length, language } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Please provide a valid YouTube video URL.'
    });
  }

  if (!isValidYoutubeUrl(url)) {
    return res.status(400).json({
      success: false,
      error: 'The provided URL is not a valid YouTube video link. Please double-check and try again.'
    });
  }

  try {
    console.log(`[VlogToBlog] Processing conversion for: ${url}`);
    
    // Step 1: Scrape video metadata and transcript
    console.log(`[VlogToBlog] Fetching transcript...`);
    const transcriptData = await getTranscript(url);

    // Truncate transcript to stay within free-tier token limits (~20k chars ≈ 5k tokens, well within 1M TPM)
    const MAX_TRANSCRIPT_CHARS = 20000;
    const rawText = transcriptData.transcript.fullText;
    const truncatedText = rawText.length > MAX_TRANSCRIPT_CHARS
      ? rawText.slice(0, MAX_TRANSCRIPT_CHARS) + '\n\n[Transcript truncated — this covers the main content of the video.]'
      : rawText;

    if (rawText.length > MAX_TRANSCRIPT_CHARS) {
      console.log(`[VlogToBlog] Transcript truncated from ${rawText.length} to ${MAX_TRANSCRIPT_CHARS} chars`);
    }
    
    // Step 2: Use AI to transform the transcript into a blog post
    console.log(`[VlogToBlog] Structuring blog post using Gemini...`);
    const blogPost = await generateBlogPost(
      truncatedText,
      transcriptData.metadata,
      { tone, format, length, language }
    );

    console.log(`[VlogToBlog] Conversion successful!`);
    
    // Step 3: Respond to the client
    return res.status(200).json({
      success: true,
      metadata: transcriptData.metadata,
      blog: blogPost,
      transcript: transcriptData.transcript
    });

  } catch (error) {
    console.error('[VlogToBlog] Conversion error occurred:', error.message);
    
    // Pass errors down to the global error handler
    next(error);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[VlogToBlog Server Error]', err);
  
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server. Please try again later.';
  
  res.status(status).json({
    success: false,
    error: message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 VlogToBlog API server is listening on port ${PORT}`);
  console.log(`🔗 Accepting requests from: ${clientUrl}`);
});
