const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]; // Remove query string

  // Handle root
  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  // POST /api/intake — intake form submission
  if (req.method === 'POST' && urlPath === '/api/intake') {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      let payload
      try {
        payload = JSON.parse(body)
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'invalid JSON' }))
        return
      }

      const { validateIntake, buildIntakeRecord } = require('./intake-handler')
      const validation = validateIntake(payload)
      if (!validation.ok) {
        res.writeHead(422, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(validation))
        return
      }

      const record = buildIntakeRecord(payload)
      console.log('[intake]', JSON.stringify(record, null, 2))

      // TODO(CRM_INTEGRATION): replace console.log with CRM/email push
      // Notification email: claudia.beck@bettertogethergroup.co
      // Tag: source = "solo site — Calendly intake"

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
    })
    return
  }

  // Determine if it's a static asset
  const isStatic = /\.(jpg|jpeg|png|css|js|gif|svg|webp|ico|pdf)$/i.test(urlPath);

  // Remove leading slash for path joining
  const cleanPath = urlPath.replace(/^\//, '');

  // Build file path - check public folder first for static assets
  let filePath;
  if (isStatic) {
    filePath = path.join(__dirname, '..', 'public', cleanPath);
  } else {
    // For HTML, add .html extension if needed
    let htmlPath = cleanPath;
    if (!htmlPath.endsWith('.html')) {
      htmlPath += '.html';
    }
    filePath = path.join(__dirname, '..', htmlPath);
  }

  // Security check - prevent directory traversal
  const realPath = path.resolve(filePath);
  const allowedDir = path.resolve(path.join(__dirname, '..'));
  if (!realPath.startsWith(allowedDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Read and serve file
  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If static file not found in public, try root as fallback
      if (isStatic && err.code === 'ENOENT') {
        const fallbackPath = path.join(__dirname, '..', urlPath);
        fs.readFile(fallbackPath, (err2, content2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            sendResponse(res, urlPath, content2);
          }
        });
        return;
      }

      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      sendResponse(res, urlPath, content);
    }
  });
});

function sendResponse(res, filePath, content) {
  let contentType = 'text/html; charset=utf-8';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
  if (filePath.endsWith('.png')) contentType = 'image/png';
  if (filePath.endsWith('.css')) contentType = 'text/css';
  if (filePath.endsWith('.js')) contentType = 'application/javascript';
  if (filePath.endsWith('.gif')) contentType = 'image/gif';
  if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
  if (filePath.endsWith('.webp')) contentType = 'image/webp';
  if (filePath.endsWith('.ico')) contentType = 'image/x-icon';
  if (filePath.endsWith('.pdf')) contentType = 'application/pdf';

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

module.exports = server;
