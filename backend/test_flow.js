import dotenv from 'dotenv';
import { getTranscript } from './src/services/transcriptService.js';
import { generateBlogPost } from './src/services/aiService.js';

dotenv.config();

async function runTest() {
  console.log('Starting full end-to-end VlogToBlog integration test...');
  
  // A simple, short YouTube video to test
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    console.log(`\n1. Fetching transcript for: ${testUrl}`);
    const transcriptData = await getTranscript(testUrl);
    
    console.log('Transcript fetch SUCCESS!');
    console.log('Metadata retrieved:', JSON.stringify(transcriptData.metadata, null, 2));
    console.log(`Transcript segments count: ${transcriptData.transcript.segments.length}`);
    console.log(`Transcript full text length: ${transcriptData.transcript.fullText.length} characters`);
    console.log(`Snippet: "${transcriptData.transcript.fullText.substring(0, 150)}..."`);
    
    console.log('\n2. Generating blog post via Gemini API...');
    const options = {
      tone: 'casual',
      format: 'standard',
      length: 'short',
      language: 'english'
    };
    
    const blogPost = await generateBlogPost(
      transcriptData.transcript.fullText,
      transcriptData.metadata,
      options
    );
    
    console.log('Blog post generation SUCCESS!');
    console.log('Generated Blog Post Length:', blogPost.length, 'characters');
    console.log('\n--- BLOG POST SNIPPET ---');
    console.log(blogPost.substring(0, 500) + '\n...');
    console.log('-------------------------');
    
    console.log('\nAll integration tests PASSED successfully! 🎉');
  } catch (error) {
    console.error('\n❌ INTEGRATION TEST FAILED:', error);
    process.exit(1);
  }
}

runTest();
