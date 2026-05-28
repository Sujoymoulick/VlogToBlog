import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate a beautifully structured blog post from a raw transcript.
 * Uses the standard @google/generative-ai SDK for maximum stability.
 * 
 * @param {string} transcriptText - The raw full transcript.
 * @param {object} metadata - The video metadata.
 * @param {object} options - Conversion options (tone, format, length, language).
 * @returns {Promise<string>} The generated markdown blog post.
 */
export async function generateBlogPost(transcriptText, metadata, options = {}) {
  // Read API key at call time so .env changes work without restart
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API is not configured. Please add GEMINI_API_KEY in your server configuration.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const tone = options.tone || 'casual';
  const format = options.format || 'standard';
  const length = options.length || 'medium';
  const language = options.language || 'english';

  const toneDescriptions = {
    casual: "Use a friendly, conversational, and warm tone. Write as if talking to a friend. Use engaging phrasing, common expressions, and direct address ('you', 'we'). Keep it accessible but informative.",
    formal: "Use a professional, authoritative, and structured tone. Avoid casual jargon, write in a respectful first-person plural, and use precise, business-appropriate vocabulary.",
    educational: "Write with a clear, pedagogical, and highly structured teaching style. Explain complex terms simply, use clear definitions, list key concepts, and ensure the topic is fully accessible to beginners.",
    technical: "Write with a deep, technical, and analytical style. Focus on technical details, implementation steps, code logic, or architectural points. Use code blocks, precise terms, and clear data references.",
    inspirational: "Write with an uplifting, motivating, and encouraging style. Focus on the core vision, lessons learned, personal growth aspects, and emphasize overcoming challenges or realizing possibilities.",
    humorous: "Write with a lighthearted, witty, and entertaining style. Inject subtle humor, playful analogies, and entertaining commentary while still preserving the full educational value of the video's content."
  };

  const formatDescriptions = {
    standard: "A classic structured blog article with an engaging introduction hook, several body sections with descriptive subheaders (H2, H3), smooth transition paragraphs, a summarizing conclusion, and a bulleted list of final takeaways.",
    tutorial: "A chronological step-by-step tutorial. Organize the content into numbered steps. Focus on 'how-to' explanations, prerequisites, specific actions, and expected results.",
    qa: "A Q&A / FAQ format. Structure the post as a series of common questions readers might have, followed by deep, comprehensive answers built on the video's content.",
    listicle: "A highly readable, curated listicle (e.g. 'Top 5 Takeaways from...'). Structure the body as numbered points, each with a bold title and a detailed explanatory paragraph."
  };

  const lengthDescriptions = {
    short: "Concise and focused, targeting approximately 500 to 700 words. Get straight to the key points without unnecessary filler.",
    medium: "Balanced and comprehensive, targeting approximately 1000 to 1300 words. Provide detail and support for all core concepts.",
    long: "A deep-dive, detailed piece targeting approximately 1800 to 2200 words. Explore every detail, example, and technical sub-point present in the video."
  };

  const prompt = `You are an expert copywriter, technical writer, and SEO specialist.
Your goal is to convert a raw YouTube video transcript into a high-quality, professional, and engaging blog post that reads like a native article — NOT a video script.

---
### VIDEO METADATA:
- **Title**: ${metadata.title}
- **Channel**: ${metadata.author}
- **Original Link**: ${metadata.url}
- **Duration**: ${metadata.durationStr}

---
### CONFIGURATION:
1. **Target Language**: Output the entire blog post in **${language.toUpperCase()}**.
2. **Writing Tone**: ${toneDescriptions[tone] || toneDescriptions.casual}
3. **Layout Format**: ${formatDescriptions[format] || formatDescriptions.standard}
4. **Target Length**: ${lengthDescriptions[length] || lengthDescriptions.medium}

---
### DETAILED GUIDELINES:
1. **Title (H1)**: Create a catchy, click-worthy SEO blog title (using a single '# ' H1 tag). Make it better than the original video title — do NOT copy it verbatim.
2. **Structure**: Use clear, descriptive headings (H2 '## ', H3 '### '). Avoid generic headings like "Introduction" or "Conclusion".
3. **Clean Up Speech**: Remove ALL filler words ("uh", "um", "you know", "like"), stutters, and repetition. Remove video-specific phrases ("as you can see", "smash subscribe", "leave a comment"). Convert them to natural written transitions.
4. **Content Integrity**: Keep all facts, numbers, dates, tools, technologies, and logic from the transcript. Do NOT invent new facts. You may add brief explanatory context for technical terms.
5. **Formatting**: Make the post highly scannable. Use bullet points, **bold key phrases**, numbered lists, blockquotes for important callouts, and markdown code blocks for any code mentioned.
6. **SEO Footer**: At the very end, add a horizontal rule (\`---\`), then write an "SEO Meta Box" with:
   - A recommended URL Slug
   - A compelling 150-160 character Meta Description

---
### TRANSCRIPT:
${transcriptText}

---
### OUTPUT FORMAT:
Return ONLY the completed blog post in markdown. Do NOT include any preamble like "Sure, here is the blog post:" — start directly with the H1 title.`;

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  try {
    console.log(`[VlogToBlog] Calling Gemini model: ${modelName} (v1)`);

    // Explicitly use v1 API version for production-ready models
    const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    if (!generatedText || !generatedText.trim()) {
      throw new Error('Received empty response from the AI model. Please try again.');
    }

    console.log(`[VlogToBlog] AI generation complete. Output: ${generatedText.length} chars`);
    return generatedText;

  } catch (error) {
    const errorString = error.toString();
    console.error('[VlogToBlog] Gemini API Error Details:', errorString);
    
    // Check for 503 (Service Unavailable)
    if (errorString.includes('503') || errorString.toLowerCase().includes('overloaded') || errorString.toLowerCase().includes('unavailable')) {
      throw new Error('Gemini AI is currently experiencing high demand. Please wait a few seconds and try again.');
    }

    // Check for 429 (Rate Limit)
    if (errorString.includes('429') || errorString.toLowerCase().includes('quota') || errorString.toLowerCase().includes('rate limit')) {
      throw new Error('Gemini API rate limit reached. Please wait 1-2 minutes and try again. (Free tier: ~30 requests/minute)');
    }

    // Check for 401 (Auth)
    if (errorString.includes('401') || errorString.toLowerCase().includes('api key')) {
      throw new Error('Invalid Gemini API key. Please check your GEMINI_API_KEY in the .env file.');
    }

    // Check for 404 (Model Not Found)
    if (errorString.includes('404') || errorString.toLowerCase().includes('not found')) {
      throw new Error(`Gemini model "${modelName}" not found. Please ensure your GEMINI_MODEL in .env is correct (e.g., gemini-1.5-flash).`);
    }

    throw new Error(`AI generation failed: ${error.message || errorString}`);
  }
}
