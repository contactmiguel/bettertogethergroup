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

  fs.readFile(fileName, (err, content) => {
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

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

module.exports = server;
