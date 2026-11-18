const fs = require('fs');
const path = require('path');

const manifestPath = path.join(
  __dirname,
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml'
);

if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found at:', manifestPath);
  process.exit(1);
}

let xml = fs.readFileSync(manifestPath, 'utf8');

const requiredPermissions = [
  'android.permission.INTERNET',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
];

for (const perm of requiredPermissions) {
  if (!xml.includes(perm)) {
    xml = xml.replace(
      '<application',
      `    <uses-permission android:name="${perm}" />\n    <application`
    );
  }
}

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('AndroidManifest.xml permissions configured.');
