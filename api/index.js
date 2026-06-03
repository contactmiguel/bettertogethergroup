const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  let filePath = req.url;

  // Remove query string
  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }

  // Handle root
  if (filePath === '/') {
    filePath = '/index.html';
  }

  // Add .html extension if not present
  if (!filePath.endsWith('.html') && !filePath.includes('.jpg') && !filePath.includes('.png')) {
    filePath += '.html';
  }

  // Remove leading slash for file path
  const fileName = path.join(__dirname, '..', filePath);

  // Prevent directory traversal
  const realPath = path.resolve(fileName);
  const allowedDir = path.resolve(path.join(__dirname, '..'));

  if (!realPath.startsWith(allowedDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Try to read the file, checking public folder for static assets
  const tryFile = (filePath) => {
    return new Promise((resolve) => {
      fs.readFile(filePath, (err, content) => {
        resolve({ err, content, filePath });
      });
    });
  };

  // If it's a static asset, try public folder first
  const isStaticAsset = /\.(jpg|jpeg|png|css|js|gif|svg|webp)$/i.test(filePath);
  const publicPath = isStaticAsset ? path.join(__dirname, '..', 'public', filePath) : null;

  const readFile = async () => {
    let result;

    // Try public folder first for static assets
    if (publicPath) {
      result = await tryFile(publicPath);
      if (!result.err) {
        return result;
      }
    }

    // Fall back to root
    result = await tryFile(fileName);
    return result;
  };

  readFile().then(({ err, content, filePath: actualPath }) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      let contentType = 'text/html';
      if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
      if (filePath.endsWith('.png')) contentType = 'image/png';
      if (filePath.endsWith('.css')) contentType = 'text/css';
      if (filePath.endsWith('.js')) contentType = 'application/javascript';
      if (filePath.endsWith('.gif')) contentType = 'image/gif';
      if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
      if (filePath.endsWith('.webp')) contentType = 'image/webp';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

module.exports = server;
