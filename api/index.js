const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]; // Remove query string

  // Handle root
  if (urlPath === '/') {
    urlPath = '/index.html';
  }

  // Determine if it's a static asset
  const isStatic = /\.(jpg|jpeg|png|css|js|gif|svg|webp|ico)$/i.test(urlPath);

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

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

module.exports = server;
