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

  const bundledIndex = path.join(__dirname, 'dist-web', 'index.html');
  if (fs.existsSync(bundledIndex)) {
    win.loadFile(bundledIndex);
  } else if (process.env.STORYBRIDGE_URL) {
    win.loadURL(process.env.STORYBRIDGE_URL);
  } else {
    win.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<html><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>StoryBridge Studio</h2><p>Build web manquant (dist-web/index.html).</p></body></html>'
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
