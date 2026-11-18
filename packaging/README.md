# Packaging Debug (.exe Windows & .apk Android)

Ce dossier permet de générer :
- **`StoryBridge-Studio-Debug.exe`** (application Windows portable en mode debug, embarquant le build web local — aucune erreur 404 au démarrage)
- **`app-debug.apk`** (application Android tablette embarquant le build web local et signée avec la clé debug standard Android)

---

## Option 1 : Génération automatique sans rien installer (GitHub Actions)

1. Poussez ce projet sur GitHub.
2. Ouvrez l’onglet **Actions** → **Build Debug EXE and APK** → **Run workflow**.
3. Le workflow compile le build web (`VITE_BASE=./ npm run build`), l’embarque dans chaque paquet, puis publie deux artefacts téléchargeables :
   - `StoryBridge-Studio-Debug-EXE` (`StoryBridge-Studio-Debug.exe`)
   - `StoryBridge-Studio-Debug-APK` (`app-debug.apk`)

---

## Option 2 : Compilation locale

À la racine du projet, compilez d’abord le bundle web avec chemins relatifs :
```bash
npm install
VITE_BASE=./ npm run build
```

### Windows `.exe` (depuis Windows avec Node.js 20+)
```powershell
Copy-Item -Recurse -Force dist packaging/windows/dist-web
cd packaging/windows
npm install
npm run pack:debug
```
Résultat : `packaging/windows/dist/StoryBridge-Studio-Debug.exe`.

### Android `.apk` (avec Node.js 20+, Java 21 et Android SDK)
```bash
rm -rf packaging/android/www && cp -r dist packaging/android/www
cd packaging/android
npm install
npm run prepare:android
cd android
./gradlew assembleDebug
```
Résultat : `packaging/android/android/app/build/outputs/apk/debug/app-debug.apk`.
