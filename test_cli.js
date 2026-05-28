import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function runTest(videoId) {
  const customEnv = {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
  };
  
  const cmd = `python3 -m youtube_transcript_api ${videoId} --format json`;
  console.log(`\n-----------------------------------------`);
  console.log(`Running Python CLI test for Video ID: ${videoId}`);
  console.log(`Command: ${cmd}`);
  
  try {
    const { stdout, stderr } = await execPromise(cmd, { env: customEnv });
    console.log(`✅ Success! Received transcript data.`);
    console.log(`Transcript preview (first 100 chars):`, stdout.substring(0, 100));
  } catch (error) {
    console.log(`❌ Command Failed!`);
    console.log(`Exit Code:`, error.code);
    console.log(`Stderr output:`);
    console.error(error.stderr || error.message);
  }
}

async function main() {
  // Test 1: User's video
  await runTest('Nb6hQguQ9_g');
  
  // Test 2: Standard Rickroll video (guaranteed captions)
  await runTest('dQw4w9WgXcQ');
}

main();
