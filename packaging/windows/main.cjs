const { app, BrowserWindow, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'StoryBridge Studio',
    autoHideMenuBar: true,
    backgroundColor: '#faf9f6',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false,
    },
  });

  // Allow camera, microphone, and fullscreen inside the bundled app
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (
      permission === 'media' ||
      permission === 'fullscreen' ||
      permission === 'clipboard-sanitized-write'
    ) {
      callback(true);
      return;
    }
    callback(false);
  });

  // Open external links (such as WhatsApp recap links) in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  const candidates = [
    path.join(__dirname, 'dist-web', 'index.html'),
    path.join(app.getAppPath(), 'dist-web', 'index.html'),
    path.join(__dirname, '..', '..', 'dist', 'index.html'),
    path.join(app.getAppPath(), '..', 'dist', 'index.html'),
    path.join(process.cwd(), 'packaging', 'windows', 'dist-web', 'index.html'),
    path.join(process.cwd(), 'dist-web', 'index.html'),
    path.join(process.cwd(), 'dist', 'index.html'),
  ];

  let resolvedIndex = null;
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      resolvedIndex = candidate;
      break;
    }
  }

  if (resolvedIndex) {
    win.loadFile(resolvedIndex);
  } else if (process.env.STORYBRIDGE_URL) {
    win.loadURL(process.env.STORYBRIDGE_URL);
  } else {
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<!doctype html><html><body style="font-family:sans-serif;padding:40px;text-align:center;background:#0f172a;color:#f8fafc;">' +
            '<h2 style="color:#38bdf8;">StoryBridge Studio</h2>' +
            '<p style="color:#94a3b8;">Fichiers de l\'application locale introuvables (dist-web/index.html).</p>' +
            '<p style="color:#64748b;font-size:13px;">Veuillez compiler le projet avec npm run build:packages.</p>' +
            '</body></html>'
        )
    );
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
