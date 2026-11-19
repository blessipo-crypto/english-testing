const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('storybridgeDesktop', {
  isElectron: true,
  fetchTtsAudio: (text, lang) => ipcRenderer.invoke('tts:fetch', { text, lang }),
});
