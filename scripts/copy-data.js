const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'data');
const dest = path.join(__dirname, '..', 'client', 'public', 'data');

if (!fs.existsSync(src)) {
  console.warn('Data folder not found:', src);
  process.exit(0);
}

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest, { recursive: true });
}

const files = fs.readdirSync(src).filter(f => f.endsWith('.json'));
files.forEach(f => {
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
});
console.log('Copied', files.length, 'data files to client/public/data/');
