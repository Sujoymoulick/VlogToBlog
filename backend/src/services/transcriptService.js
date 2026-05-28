import { extractVideoId } from '../utils/youtube.js';

/**
 * Format seconds into a clean hh:mm:ss or mm:ss string.
 * @param {number} seconds - Seconds to format.
 * @returns {string} Formatted time string.
 */
function formatTime(seconds) {
  const s = Math.floor(Number(seconds) || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mStr = String(m).padStart(2, '0');
  const sStr = String(sec).padStart(2, '0');
  if (h > 0) return `${h}:${mStr}:${sStr}`;
  return `${m}:${sStr}`;
}

/**
 * Fetches transcript and video metadata using transcriptapi.com.
 *
 * Confirmed API response schema (from official docs):
 * {
 *   "video_id": "...",
 *   "language": "en",
 *   "title": "Video Title",           <-- TOP-LEVEL
 *   "author_name": "Channel Name",   <-- TOP-LEVEL
 *   "thumbnail_url": "https://...",   <-- TOP-LEVEL
 *   "transcript": [
 *     { "text": "...", "start": 0.0, "duration": 2.5 }
 *   ]
 * }
 *
 * @param {string} youtubeUrl - The full YouTube video URL.
 * @returns {Promise<object>} An object containing metadata and transcript data.
 */
export async function getTranscript(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) {
    throw new Error('Invalid YouTube URL. Please paste a valid YouTube video link.');
  }

  const apiKey = process.env.TRANSCRIPT_API;
  if (!apiKey) {
    throw new Error('TRANSCRIPT_API key is not configured in environment variables.');
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  // Pass the raw video ID directly — transcriptapi.com accepts ID, full URL, or youtu.be link
  const endpoint = `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${videoId}&send_metadata=true`;

  console.log(`[VlogToBlog] Fetching transcript via transcriptapi.com for video: ${videoId}`);

  let apiResponse;
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[VlogToBlog] transcriptapi.com returned error ${res.status}:`, errBody);

      if (res.status === 401 || res.status === 403) {
        throw new Error('Invalid or expired Transcript API key. Please check your TRANSCRIPT_API environment variable.');
      }
      if (res.status === 404) {
        throw new Error('No transcript found for this video. It may be private, age-restricted, or have captions disabled.');
      }
      if (res.status === 429) {
        throw new Error('Transcript API rate limit exceeded. Please try again in a few moments.');
      }
      throw new Error(`Transcript API returned status ${res.status}: ${errBody}`);
    }

    apiResponse = await res.json();
  } catch (error) {
    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Unable to reach transcriptapi.com. Please check your internet connection.');
    }
    throw error;
  }

  console.log(`[VlogToBlog] Transcript API response keys:`, Object.keys(apiResponse));

  // --- Validate transcript array ---
  if (!Array.isArray(apiResponse.transcript) || apiResponse.transcript.length === 0) {
    if (typeof apiResponse.transcript === 'string' && apiResponse.transcript.trim()) {
      // Fallback: plain string transcript
      const fullText = apiResponse.transcript.replace(/\s+/g, ' ').trim();
      return buildResult(videoId, videoUrl, apiResponse, [{ text: fullText, startMs: 0, timeStr: '0:00' }], fullText, 0);
    }
    throw new Error('The transcript is empty. This video may not have captions or may be private.');
  }

  // --- Parse transcript segments ---
  // Each item: { text, start (seconds), duration (seconds) }
  const segments = apiResponse.transcript
    .map(item => ({
      text: (item.text || '').replace(/\n/g, ' ').trim(),
      startMs: Math.round((Number(item.start) || 0) * 1000),
      timeStr: formatTime(item.start || 0)
    }))
    .filter(seg => seg.text.length > 0);

  if (segments.length === 0) {
    throw new Error('The transcript is empty after processing.');
  }

  const fullText = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();

  // --- Calculate duration from last segment (API doesn't return explicit duration) ---
  const lastItem = apiResponse.transcript[apiResponse.transcript.length - 1];
  const durationSeconds = (Number(lastItem?.start) || 0) + (Number(lastItem?.duration) || 0);

  return buildResult(videoId, videoUrl, apiResponse, segments, fullText, durationSeconds);
}

/**
 * Assemble the final result object.
 * Confirmed response shape:
 * { video_id, language, transcript: [...], metadata: { title, author_name, thumbnail_url, ... } }
 */
function buildResult(videoId, videoUrl, apiResponse, segments, fullText, durationSeconds) {
  // metadata is nested inside apiResponse.metadata (confirmed from server logs)
  const meta = apiResponse.metadata || {};

  const title = meta.title || apiResponse.title || 'Untitled YouTube Video';
  const author = meta.author_name || meta.author || apiResponse.author_name || 'Unknown Channel';
  const thumbnail = meta.thumbnail_url || apiResponse.thumbnail_url
    || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const durationStr = formatTime(durationSeconds);

  console.log(`[VlogToBlog] Parsed metadata — Title: "${title}", Channel: "${author}", Duration: ${durationStr}, Segments: ${segments.length}`);

  return {
    metadata: { videoId, title, author, durationSeconds, durationStr, thumbnail, url: videoUrl },
    transcript: { fullText, segments }
  };
}
