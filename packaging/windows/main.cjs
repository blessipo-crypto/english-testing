const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const ttsCache = new Map();

function getCachedTts(key) {
  return ttsCache.get(key);
}

function setCachedTts(key, value) {
  if (ttsCache.size >= 250) {
    const oldestKey = ttsCache.keys().next().value;
    if (oldestKey) ttsCache.delete(oldestKey);
  }
  ttsCache.set(key, value);
}

ipcMain.handle('tts:fetch', async (_event, { text, lang }) => {
  const cleanText = String(text || '').trim().slice(0, 200);
  const targetLang = lang === 'en-US' ? 'en-US' : 'en-GB';
  if (!cleanText) return null;

  const cacheKey = `${targetLang}:${cleanText}`;
  const cached = getCachedTts(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      targetLang
    )}&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) return null;
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUri = `data:audio/mpeg;base64,${base64}`;
    setCachedTts(cacheKey, dataUri);
    return dataUri;
  } catch {
    return null;
  }
});

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
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: false,
    },
  });

  // Allow camera, microphone, audio, and fullscreen inside the bundled app
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return (
      permission === 'media' ||
      permission === 'camera' ||
      permission === 'microphone' ||
      permission === 'fullscreen' ||
      permission === 'clipboard-read' ||
      permission === 'clipboard-sanitized-write'
    );
  });

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (
      permission === 'media' ||
      permission === 'camera' ||
      permission === 'microphone' ||
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
