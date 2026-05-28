/**
 * Extracts the 11-character YouTube video ID from a URL.
 * Supports standard watch URLs, short URLs (youtu.be), embed URLs, and YouTube Shorts.
 * 
 * @param {string} url - The YouTube URL to parse.
 * @returns {string|null} The video ID, or null if the URL is invalid.
 */
export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Clean the URL of leading/trailing spaces
  const cleanUrl = url.trim();
  
  const regex = /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = cleanUrl.match(regex);
  
  return match ? match[1] : null;
}

/**
 * Validates whether a YouTube URL is formatted correctly.
 * 
 * @param {string} url - The YouTube URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export function isValidYoutubeUrl(url) {
  return extractVideoId(url) !== null;
}
