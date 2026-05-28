import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function test() {
  const customEnv = {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH || ''}`
  };
  
  console.log("=== Node Environment & Python Path Diagnostic ===");
  
  try {
    const { stdout: pyVersion } = await execPromise('python3 --version', { env: customEnv });
    console.log('✅ python3 Version:', pyVersion.trim());
  } catch (e) {
    console.log('❌ python3 version check failed:', e.message);
  }
  
  try {
    const { stdout: whichPy } = await execPromise('which python3', { env: customEnv });
    console.log('✅ which python3 path:', whichPy.trim());
  } catch (e) {
    console.log('❌ which python3 check failed:', e.message);
  }
  
  try {
    const { stdout: pipList } = await execPromise('python3 -m pip list', { env: customEnv });
    const hasPkg = pipList.toLowerCase().includes('youtube-transcript-api');
    console.log('✅ youtube-transcript-api present in pip list?', hasPkg ? "YES 🎉" : "NO ❌");
    if (!hasPkg) {
      console.log("\nFirst 15 items in pip list for context:");
      console.log(pipList.split('\n').slice(0, 15).join('\n'));
    }
  } catch (e) {
    console.log('❌ pip list check failed:', e.message);
  }
}
test();
