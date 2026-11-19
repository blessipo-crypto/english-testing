import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Monitor,
  Smartphone,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  FileCode,
} from 'lucide-react';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PackageStatus {
  windowsExe: {
    available: boolean;
    filename: string;
    sizeBytes: number;
    downloadUrl: string;
  };
  androidApk: {
    available: boolean;
    filename: string;
    sizeBytes: number;
    downloadUrl: string;
  };
}

export function AppDownloadModal({ isOpen, onClose }: AppDownloadModalProps) {
  const [status, setStatus] = useState<PackageStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/download/status')
        .then((res) => (res.ok ? res.json() : null))
        .then((data: PackageStatus | null) => {
          setStatus(data);
          setLoading(false);
        })
        .catch(() => {
          setStatus(null);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-download-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sb-card-tech w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-2 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b sb-divider pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Download className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="app-download-title"
                className="text-lg font-bold tracking-wide sb-text-primary flex items-center gap-2"
              >
                Applications Portables Autonomes
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                  Mode Debug
                </span>
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Version autonome prête à l’emploi pour Windows PC et tablette Android.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg sb-surface-soft hover:opacity-80 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Highlight badge: No 404, 100% offline */}
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-300">
              Zéro erreur 404 — Fichiers web 100% embarqués localement
            </div>
            <p className="text-emerald-200/80 leading-relaxed">
              Tous les modules interactifs (Rituel, Cartes de vocabulaire audio, Atelier de phrases, Formation des Temps, Mini-jeux, Tableau blanc) sont directement inclus dans l'exécutable portable.
            </p>
          </div>
        </div>

        {/* Windows Portable EXE Card */}
        <div className="sb-surface-soft rounded-xl border sb-divider p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Monitor className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold sb-text-primary">
                  StoryBridge-Studio-Debug.exe (Windows Portable)
                </h3>
                <span className="text-[11px] sb-text-muted">
                  Windows 10 / 11 (x64) · Aucun installateur requis
                </span>
              </div>
            </div>
            {status?.windowsExe?.available && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 shrink-0">
                {formatSize(status.windowsExe.sizeBytes)}
              </span>
            )}
          </div>

          <p className="text-xs sb-text-secondary leading-relaxed">
            Double-cliquez pour lancer immédiatement l’application sur votre PC. Fonctionne directement sans droits administrateur et sans connexion permanente.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {status?.windowsExe?.available ? (
              <a
                href={status.windowsExe.downloadUrl}
                download={status.windowsExe.filename}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl manga-btn-primary text-xs font-bold shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Télécharger {status.windowsExe.filename}</span>
              </a>
            ) : (
              <a
                href="/api/download/windows-exe"
                download="StoryBridge-Studio-Debug.exe"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl manga-btn-primary text-xs font-bold shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Télécharger l’exécutable (.exe)</span>
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  'npm run build:packages && cd packaging/windows && npm install && npm run pack:debug',
                  'win-cmd'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-card-option text-xs font-semibold sb-text-secondary hover:sb-text-primary transition-colors cursor-pointer"
              title="Copier la commande de compilation locale"
            >
              <Terminal className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
              <span>
                {copiedCmd === 'win-cmd' ? 'Commande copiée !' : 'Commande de build Windows'}
              </span>
            </button>
          </div>
        </div>

        {/* Android APK Card */}
        <div className="sb-surface-soft rounded-xl border sb-divider p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Smartphone className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold sb-text-primary">
                  app-debug.apk (Android Tablette)
                </h3>
                <span className="text-[11px] sb-text-muted">
                  Android 8.0+ · Signé avec la clé debug Android
                </span>
              </div>
            </div>
            {status?.androidApk?.available && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 shrink-0">
                {formatSize(status.androidApk.sizeBytes)}
              </span>
            )}
          </div>

          <p className="text-xs sb-text-secondary leading-relaxed">
            Installez ce fichier APK sur tablette Android pour un usage immersif tactile avec support du mode plein écran et dessin fluide sur le tableau blanc.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {status?.androidApk?.available ? (
              <a
                href={status.androidApk.downloadUrl}
                download={status.androidApk.filename}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl manga-btn-primary text-xs font-bold shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Télécharger {status.androidApk.filename}</span>
              </a>
            ) : (
              <a
                href="/api/download/android-apk"
                download="app-debug.apk"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border sb-card-option text-xs font-bold sb-text-primary shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4 sb-text-accent" aria-hidden="true" />
                <span>Télécharger le paquet APK</span>
              </a>
            )}

            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  'npm run build:packages && cd packaging/android && npm install && npm run prepare:android && cd android && ./gradlew assembleDebug',
                  'apk-cmd'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-card-option text-xs font-semibold sb-text-secondary hover:sb-text-primary transition-colors cursor-pointer"
              title="Copier la commande de compilation Android"
            >
              <Terminal className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
              <span>
                {copiedCmd === 'apk-cmd' ? 'Commande copiée !' : 'Commande de build Android'}
              </span>
            </button>
          </div>
        </div>

        {/* GitHub Actions Instructions */}
        <div className="p-4 rounded-xl border sb-divider bg-cyan-500/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold sb-text-accent">
            <Zap className="w-4 h-4" aria-hidden="true" />
            <span>Génération automatique en 1 clic (GitHub Actions)</span>
          </div>
          <p className="text-xs sb-text-secondary leading-relaxed">
            Vous pouvez également générer à tout moment les deux paquets (.exe et .apk) sans installer aucun SDK sur votre machine grâce au workflow GitHub Actions inclus :
          </p>
          <ol className="text-xs sb-text-muted space-y-1 list-decimal list-inside pl-1">
            <li>Poussez votre dépôt sur GitHub</li>
            <li>Ouvrez l’onglet <strong>Actions</strong> → <strong>Build Debug EXE and APK</strong></li>
            <li>Cliquez sur <strong>Run workflow</strong> pour télécharger les exécutables prêts</li>
          </ol>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
