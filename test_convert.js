import { getTranscript } from './backend/src/services/transcriptService.js';

async function test() {
  try {
    console.log("Testing transcript fetching directly in Node environment...");
    const res = await getTranscript('https://youtu.be/Nb6hQguQ9_g?si=OkacPxf79d-NxRJE');
    console.log("SUCCESS! Video Title:", res.metadata.title);
    console.log("Transcript length:", res.transcript.fullText.length);
  } catch (err) {
    console.error("\n❌ DETAILED ERROR CAUGHT:");
    console.error(err.stack || err);
  }
}
test();
