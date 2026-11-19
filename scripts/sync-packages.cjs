const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const windowsDist = path.join(rootDir, 'packaging', 'windows', 'dist-web');
const androidDist = path.join(rootDir, 'packaging', 'android', 'www');

if (!fs.existsSync(distDir)) {
  console.error('[sync-packages] Error: dist directory does not exist. Run vite build first.');
  process.exit(1);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[sync-packages] Copying dist to packaging/windows/dist-web...');
fs.rmSync(windowsDist, { recursive: true, force: true });
copyRecursive(distDir, windowsDist);

console.log('[sync-packages] Copying dist to packaging/android/www...');
fs.rmSync(androidDist, { recursive: true, force: true });
copyRecursive(distDir, androidDist);

console.log('[sync-packages] Done! Both packaging directories are synced with latest web bundle.');
