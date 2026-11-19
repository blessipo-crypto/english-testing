import { useEffect, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Users,
  LogOut,
  MessageCircle,
  UserPlus,
  Download,
  Monitor,
  Globe,
  Settings,
  RotateCcw,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { ControlMode, RoomParticipant, StudentProfile } from '../types/lesson';

export const DEFAULT_CLOUD_STUDIO_URL =
  'https://ais-dev-afm5mejj742ehjjk5blxlb-880439402821.europe-west2.run.app';

export function getEffectiveInviteBaseUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_CLOUD_STUDIO_URL;

  const customOrigin = window.localStorage.getItem('storybridge_sync_server_url')?.trim();
  if (customOrigin) {
    try {
      const parsed = new URL(customOrigin);
      const pathname = parsed.pathname === '/' || !parsed.pathname ? '' : parsed.pathname.replace(/\/$/, '');
      return `${parsed.origin}${pathname}`;
    } catch {
      // ignore invalid URL
    }
  }

  const isLocalPackaged =
    window.location.protocol === 'file:' ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port);

  if (isLocalPackaged) {
    return DEFAULT_CLOUD_STUDIO_URL;
  }

  const cleanPath = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '');
  return `${window.location.origin}${cleanPath}`;
}

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  connected: boolean;
  controlMode: ControlMode;
  audioSync: boolean;
  onChangeControlMode: (mode: ControlMode) => void;
  onChangeAudioSync: (enabled: boolean) => void;
  participants: RoomParticipant[];
  studentProfiles: StudentProfile[];
  activeStudent: StudentProfile;
  onAddStudentProfile: (name: string, level?: 'A1' | 'A2') => StudentProfile;
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
}

export function SessionModal({
  isOpen,
  onClose,
  roomCode,
  connected,
  controlMode,
  audioSync,
  onChangeControlMode,
  onChangeAudioSync,
  participants,
  studentProfiles,
  activeStudent,
  onAddStudentProfile,
  onJoinRoom,
  onLeaveRoom,
}: SessionModalProps) {
  const [inputCode, setInputCode] = useState(roomCode || 'LNDN26');
  const [inviteStudentName, setInviteStudentName] = useState(activeStudent.name);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const isPackagedLocal =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && !window.location.port));

  const [customServerUrl, setCustomServerUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('storybridge_sync_server_url') || '';
  });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverInputVal, setServerInputVal] = useState(customServerUrl);
  const [serverSavedSuccess, setServerSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInviteStudentName(activeStudent.name);
    }
  }, [isOpen, activeStudent.name]);

  if (!isOpen) return null;

  const cleanInviteName = inviteStudentName.trim().slice(0, 32);

  const effectiveBase = (customServerUrl || getEffectiveInviteBaseUrl()).replace(/\/$/, '');
  const studentInviteUrl = roomCode
    ? `${effectiveBase}/?room=${encodeURIComponent(
        roomCode
      )}&role=student${
        cleanInviteName ? `&name=${encodeURIComponent(cleanInviteName)}` : ''
      }`
    : '';

  const inviteMessage = roomCode
    ? `Bonjour${
        cleanInviteName ? ` ${cleanInviteName}` : ''
      } ! Voici le lien pour rejoindre notre cours d'anglais interactif sur StoryBridge Studio : ${studentInviteUrl} (Salle : ${roomCode})`
    : '';

  const sanitizedPhone = whatsappPhone.replace(/[^\d]/g, '');
  const whatsappInviteUrl = sanitizedPhone
    ? `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(inviteMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;

  const handleCopyInvite = async () => {
    if (!studentInviteUrl) return;
    try {
      await navigator.clipboard.writeText(studentInviteUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(false);
    }
  };

  const handlePrepareSecondStudent = () => {
    const nextNumber = studentProfiles.length + 1;
    const defaultSecondName = `Élève ${nextNumber}`;
    if (studentProfiles.length < 2) {
      const created = onAddStudentProfile(defaultSecondName, 'A1');
      setInviteStudentName(created.name);
    } else {
      const other = studentProfiles.find((p) => p.id !== activeStudent.id);
      setInviteStudentName(other ? other.name : defaultSecondName);
    }
  };

  const handleSaveCustomServer = () => {
    const trimmed = serverInputVal.trim();
    if (!trimmed) {
      window.localStorage.removeItem('storybridge_sync_server_url');
      setCustomServerUrl('');
      setServerInputVal('');
    } else {
      let valid = trimmed;
      if (!/^https?:\/\//i.test(valid)) {
        valid = `https://${valid}`;
      }
      window.localStorage.setItem('storybridge_sync_server_url', valid);
      setCustomServerUrl(valid);
      setServerInputVal(valid);
    }
    setServerSavedSuccess(true);
    window.setTimeout(() => setServerSavedSuccess(false), 2000);
  };

  const handleResetServer = () => {
    window.localStorage.removeItem('storybridge_sync_server_url');
    setCustomServerUrl('');
    setServerInputVal('');
    setServerSavedSuccess(true);
    window.setTimeout(() => setServerSavedSuccess(false), 2000);
  };

  const connectedStudents = participants.filter((p) => p.role === 'student');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visio-modal-title"
    >
      <div className="manga-panel w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="visio-modal-title" className="text-lg font-bold tracking-wide sb-text-primary">
              Invitation & Synchronisation Visio
            </h2>
            <p className="text-xs sb-text-muted mt-1">
              Envoyez ce lien par WhatsApp ou copiez-le pour qu’un ou deux élèves manipulent
              les cartes, les phrases et le tableau en direct avec vous.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-1.5 rounded-lg sb-text-muted hover:sb-text-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {roomCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl sb-surface-soft border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs sb-text-muted">Code de la salle</div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                  {connected ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.75)]"
                        aria-hidden="true"
                      />
                      <span className="sb-text-success">Connecté en direct</span>
                    </>
                  ) : (
                    <span className="sb-text-reward">Reconnexion...</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-2xl font-bold tracking-wider sb-text-accent">
                  {roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-chip-idle text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 sb-text-success" aria-hidden="true" />
                      Lien copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      Copier le lien
                    </>
                  )}
                </button>
              </div>

              {/* Public Student Web Link display */}
              <div className="pt-2 border-t sb-divider space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold sb-text-secondary flex items-center gap-1">
                    <Globe className="w-3 h-3 sb-text-accent" aria-hidden="true" />
                    Lien Web pour l’élève (téléphone, tablette ou PC) :
                  </span>
                  {isPackagedLocal && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                      Mode Bureau → Passerelle Web
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={studentInviteUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 rounded-xl border sb-input px-3 py-1.5 text-[11px] font-mono select-all bg-black/20 sb-text-primary"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border sb-chip-idle text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 sb-text-success" aria-hidden="true" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedLink ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-[10px] sb-text-muted">
                  L’élève clique simplement sur ce lien pour rejoindre votre cours interactif directement dans son navigateur web, sans rien installer.
                </p>
              </div>

              {/* Invite Student Selector (supports 1st or 2nd student link) */}
              <div className="pt-3 border-t sb-divider space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="invite-student-name-input"
                    className="text-xs font-bold sb-text-secondary"
                  >
                    Élève invité (lien personnalisé)
                  </label>
                  <button
                    type="button"
                    onClick={handlePrepareSecondStudent}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border sb-chip-idle text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3 sb-text-accent" aria-hidden="true" />
                    + Autre élève (binôme)
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {studentProfiles.map((profile) => {
                    const selected =
                      inviteStudentName.trim().toLowerCase() === profile.name.toLowerCase();
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => setInviteStudentName(profile.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          selected ? 'sb-chip-solid' : 'sb-chip-idle'
                        }`}
                      >
                        {profile.name}
                      </button>
                    );
                  })}
                </div>

                <input
                  id="invite-student-name-input"
                  type="text"
                  value={inviteStudentName}
                  onChange={(e) => setInviteStudentName(e.target.value)}
                  maxLength={32}
                  placeholder="Prénom de l'élève à inviter (ex : Lucas)"
                  className="w-full rounded-xl border sb-input px-3 py-1.5 text-xs"
                />
              </div>

              {/* Optional WhatsApp Phone + 1-click WhatsApp Invite Button */}
              <div className="pt-3 border-t sb-divider space-y-2.5">
                <label
                  htmlFor="whatsapp-phone-input"
                  className="text-xs font-medium sb-text-muted block"
                >
                  Numéro WhatsApp élève / parent (optionnel, format international ex : 33612345678)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="whatsapp-phone-input"
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="Laisser vide pour choisir le contact"
                    className="flex-1 rounded-xl border sb-input px-3 py-2 text-xs"
                  />
                  <a
                    href={whatsappInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 border-b-4 border-emerald-800 text-white text-xs font-bold hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Inviter sur WhatsApp
                  </a>
                </div>
              </div>

              {/* Advanced Server Configuration Drawer Toggle */}
              <div className="pt-2 border-t sb-divider">
                <button
                  type="button"
                  onClick={() => setShowServerConfig(!showServerConfig)}
                  className="inline-flex items-center gap-1 text-[11px] sb-text-muted hover:sb-text-primary cursor-pointer transition-colors"
                >
                  <Settings className="w-3 h-3" aria-hidden="true" />
                  <span>
                    {showServerConfig
                      ? 'Masquer les paramètres du serveur'
                      : 'Paramètres du serveur Web & synchronisation (avancé)'}
                  </span>
                </button>

                {showServerConfig && (
                  <div className="mt-2.5 p-3 rounded-xl sb-surface-soft border space-y-2 text-xs">
                    <div className="text-[11px] sb-text-secondary font-medium">
                      Adresse Web racine pour les invitations des élèves :
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={serverInputVal}
                        onChange={(e) => setServerInputVal(e.target.value)}
                        placeholder={DEFAULT_CLOUD_STUDIO_URL}
                        className="flex-1 rounded-lg border sb-input px-2.5 py-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomServer}
                        className="px-3 py-1 rounded-lg manga-btn-primary text-xs font-bold cursor-pointer shrink-0"
                      >
                        Enregistrer
                      </button>
                      {customServerUrl && (
                        <button
                          type="button"
                          onClick={handleResetServer}
                          title="Réinitialiser l'adresse officielle"
                          className="p-1 rounded-lg border sb-chip-idle text-xs cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {serverSavedSuccess && (
                      <div className="text-[11px] sb-text-success font-bold">
                        Adresse du serveur enregistrée avec succès.
                      </div>
                    )}
                    <div className="text-[10px] sb-text-muted">
                      Par défaut : <code className="font-mono">{DEFAULT_CLOUD_STUDIO_URL}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold sb-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
                  <span>
                    Participants connectés ({participants.length})
                  </span>
                </div>
                {connectedStudents.length > 1 && (
                  <span className="text-[11px] font-bold sb-text-reward tabular-nums">
                    {connectedStudents.length} élèves en salle
                  </span>
                )}
              </div>
              <div className="divide-y sb-divide border sb-surface-soft rounded-xl px-3">
                {participants.length === 0 ? (
                  <p className="py-2.5 text-xs sb-text-muted">
                    En attente de connexion...
                  </p>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.id}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold sb-text-primary">{p.name}</span>
                      <span className="sb-text-muted">
                        {p.role === 'tutor' ? 'Professeur' : 'Élève'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Room Permissions & Audio Sync Controls */}
            <div className="p-3.5 rounded-2xl sb-surface-soft border space-y-3">
              <div className="text-xs font-bold sb-text-secondary">
                Contrôle de la séance &amp; Son en direct
              </div>

              <div className="grid sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onChangeControlMode(controlMode === 'tutor-only' ? 'shared' : 'tutor-only')
                  }
                  aria-pressed={controlMode === 'tutor-only'}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    controlMode === 'tutor-only' ? 'sb-chip-solid' : 'sb-chip-idle'
                  }`}
                >
                  {controlMode === 'tutor-only' ? (
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold leading-tight">
                      {controlMode === 'tutor-only'
                        ? 'Main au professeur (Miroir élève)'
                        : 'Contrôle partagé (Prof + Élève)'}
                    </div>
                    <div className="text-[10px] opacity-85 leading-snug">
                      {controlMode === 'tutor-only'
                        ? 'L’élève suit votre écran en direct sans pouvoir modifier.'
                        : 'L’élève peut cliquer, écrire et manipuler avec vous.'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeAudioSync(!audioSync)}
                  aria-pressed={audioSync}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    audioSync ? 'sb-chip-solid' : 'sb-chip-idle'
                  }`}
                >
                  {audioSync ? (
                    <Volume2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold leading-tight">
                      {audioSync ? 'Son synchronisé : Activé' : 'Son synchronisé : Désactivé'}
                    </div>
                    <div className="text-[10px] opacity-85 leading-snug">
                      {audioSync
                        ? 'Les mots lus en anglais sont entendus des deux côtés.'
                        : 'Chacun écoute les mots uniquement sur son appareil.'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onLeaveRoom}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-status-danger text-xs font-bold hover:opacity-90 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Quitter la salle live
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
              >
                Retour au cours
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onJoinRoom(inputCode);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="room-code-input"
                className="text-xs font-bold tracking-wide sb-text-secondary block"
              >
                Créer ou rejoindre un code de salle
              </label>
              <div className="flex gap-2">
                <input
                  id="room-code-input"
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ex: LNDN26"
                  maxLength={12}
                  className="flex-1 rounded-xl border sb-input px-3.5 py-2 text-sm font-mono uppercase sb-text-accent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl manga-btn-primary text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Démarrer la salle
                </button>
              </div>
            </div>

            <p className="text-xs sb-text-muted leading-relaxed">
              Astuce : même sans salle live, vous pouvez simplement partager votre écran
              dans Zoom, Google Meet ou Teams et utiliser tous les exercices immédiatement.
            </p>

            {/* Offline Portable App Banner */}
            <div className="pt-3 border-t sb-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 sb-text-secondary">
                <Monitor className="w-4 h-4 sb-text-accent" aria-hidden="true" />
                <span className="font-semibold">
                  {isPackagedLocal
                    ? 'Application Bureau Windows Portable active'
                    : 'Version Windows Portable (.exe)'}
                </span>
              </div>
              {isPackagedLocal ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-[11px]">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Mode bureau actif
                </span>
              ) : (
                <a
                  href="/api/download/windows-exe"
                  download="StoryBridge-Studio-Debug.exe"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border sb-card-option font-bold sb-text-accent hover:sb-text-primary transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Télécharger (.exe)</span>
                </a>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
