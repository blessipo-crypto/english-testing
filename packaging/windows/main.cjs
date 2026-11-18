const { app, BrowserWindow, session, shell } = require('electron');

const APP_URL =
  process.env.STORYBRIDGE_URL ||
  'https://ais-pre-afm5mejj742ehjjk5blxlb-880439402821.europe-west2.run.app';

const ALLOWED_ORIGIN = new URL(APP_URL).origin;

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

  // Allow camera, microphone, and fullscreen for StoryBridge Studio origin
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (
      url.startsWith(ALLOWED_ORIGIN) &&
      (permission === 'media' || permission === 'fullscreen' || permission === 'clipboard-sanitized-write')
    ) {
      callback(true);
      return;
    }
    callback(false);
  });

  // Open external links (such as WhatsApp recap links) in the system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(ALLOWED_ORIGIN)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadURL(APP_URL);
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
