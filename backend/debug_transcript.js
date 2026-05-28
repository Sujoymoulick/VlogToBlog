// Quick diagnostic script to debug transcript fetching
const videoId = 'Nb6hQguQ9_g';
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

function decodeUnicodeEscapes(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

async function debug() {
  console.log('=== Step 1: Fetching YouTube page ===');
  const res = await fetch(videoUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  const html = await res.text();
  console.log(`Page HTML length: ${html.length}`);

  // Check for captions
  const captionSplit = html.split('"captions":');
  console.log(`\n=== Step 2: Captions block found: ${captionSplit.length > 1} ===`);
  
  if (captionSplit.length < 2) {
    console.log('NO CAPTIONS FOUND!');
    // Check for common issues
    console.log('Has recaptcha:', html.includes('g-recaptcha'));
    console.log('Login required:', html.includes('LOGIN_REQUIRED'));
    console.log('Page has playerCaptionsTracklistRenderer:', html.includes('playerCaptionsTracklistRenderer'));
    return;
  }

  // Show the raw captions block (first 2000 chars)
  const captionsRaw = captionSplit[1].substring(0, 2000);
  console.log('\n=== Step 3: Raw captions block (first 2000 chars) ===');
  console.log(captionsRaw);

  // Extract all baseUrl values
  const urlRegex = /"baseUrl"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const urls = [];
  let m;
  while ((m = urlRegex.exec(captionsRaw)) !== null) {
    urls.push(decodeUnicodeEscapes(m[1]));
  }
  console.log(`\n=== Step 4: Found ${urls.length} caption URLs ===`);
  urls.forEach((u, i) => console.log(`  [${i}]: ${u}`));

  if (urls.length === 0) {
    console.log('NO URLS FOUND!');
    return;
  }

  // Test each URL
  for (let i = 0; i < Math.min(urls.length, 2); i++) {
    const url = urls[i];
    
    // Try with fmt=srv1
    console.log(`\n=== Step 5a: Fetching URL [${i}] with fmt=srv1 ===`);
    const srv1Url = url + (url.includes('?') ? '&' : '?') + 'fmt=srv1';
    try {
      const r = await fetch(srv1Url);
      const text = await r.text();
      console.log(`Status: ${r.status}, Length: ${text.length}`);
      console.log('First 500 chars:', text.substring(0, 500));
      console.log('Has <text:', text.includes('<text'));
    } catch (err) {
      console.log('Error:', err.message);
    }

    // Try without fmt
    console.log(`\n=== Step 5b: Fetching URL [${i}] without fmt ===`);
    try {
      const r2 = await fetch(url);
      const text2 = await r2.text();
      console.log(`Status: ${r2.status}, Length: ${text2.length}`);
      console.log('First 500 chars:', text2.substring(0, 500));
      console.log('Has <text:', text2.includes('<text'));
      console.log('Has "events":', text2.includes('"events"'));
    } catch (err) {
      console.log('Error:', err.message);
    }
  }
}

debug().catch(err => console.error('FATAL:', err));
