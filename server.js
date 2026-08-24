const express = require('express');
const app = express();

app.use(async (req, res) => {
  const targetUrl = req.query.u;
  if (!targetUrl) return res.status(400).send('Missing "u" query parameter');

  const decodedUrl = decodeURIComponent(targetUrl);

  try {
    const headers = {
      'User-Agent': 'ReactNativeVideo/9.11.1 (Linux;Android 13) AndroidXMedia3/1.6.1',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.fancode.com',
      'Referer': 'https://www.fancode.com/'
    };

    // Forward the Range header so video seeking works perfectly
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(decodedUrl, { headers, redirect: 'follow' });

    // Set CORS headers for the browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Expose-Headers', '*');

    // Pass through content type, length, range, etc.
    const respHeaders = response.headers;
    res.setHeader('Content-Type', respHeaders.get('Content-Type') || 'application/octet-stream');
    
    if (respHeaders.get('Content-Length')) {
      res.setHeader('Content-Length', respHeaders.get('Content-Length'));
    }
    if (respHeaders.get('Content-Range')) {
      res.setHeader('Content-Range', respHeaders.get('Content-Range'));
      res.status(206); // Partial Content (crucial for video segments)
    } else {
      res.status(response.status);
    }

    // Stream the response directly to the browser
    const body = await response.arrayBuffer();
    res.send(Buffer.from(body));

  } catch (err) {
    console.error('Proxy Error:', err.message);
    res.status(500).send('Proxy fetch failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Node Proxy running on port ${PORT}`));
