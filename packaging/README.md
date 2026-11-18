# Packaging Debug (.exe Windows & .apk Android)

Ce dossier contient les configurations prêtes à compiler pour générer :
- **`StoryBridge-Studio-Debug.exe`** (application Windows portable en mode debug, sans certificat)
- **`app-debug.apk`** (application Android tablette signée avec la clé debug standard Android)

Les deux paquets chargent l’application en direct via HTTPS afin de conserver la synchronisation temps réel (salle visio, Cahier Prof / Élève, tableau partagé et caméra).

---

## Option 1 : Génération automatique sans rien installer (GitHub Actions)

1. Poussez ce projet sur un dépôt GitHub.
2. Ouvrez l’onglet **Actions** sur GitHub.
3. Sélectionnez **Build Debug EXE and APK** puis cliquez sur **Run workflow**.
4. Une fois terminé, téléchargez directement les deux fichiers dans la section **Artifacts** :
   - `StoryBridge-Studio-Debug-EXE` (`StoryBridge-Studio-Debug.exe`)
   - `StoryBridge-Studio-Debug-APK` (`app-debug.apk`)

---

## Option 2 : Compilation locale

### Windows `.exe` (depuis un PC Windows avec Node.js 20+)
```powershell
cd packaging/windows
npm install
npm run pack:debug
```
Le fichier généré se trouve dans `packaging/windows/dist/StoryBridge-Studio-Debug.exe`.

### Android `.apk` (avec Node.js 20+, Java 17 et Android SDK)
```bash
cd packaging/android
npm install
npm run prepare:android
cd android
./gradlew assembleDebug
```
Le fichier généré se trouve dans `packaging/android/android/app/build/outputs/apk/debug/app-debug.apk`.
