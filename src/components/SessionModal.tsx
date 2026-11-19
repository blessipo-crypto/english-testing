import { useEffect, useState } from 'react';
import { X, Copy, Check, Users, LogOut, MessageCircle, UserPlus, Download, Monitor } from 'lucide-react';
import type { RoomParticipant, StudentProfile } from '../types/lesson';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  connected: boolean;
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

  useEffect(() => {
    if (isOpen) {
      setInviteStudentName(activeStudent.name);
    }
  }, [isOpen, activeStudent.name]);

  if (!isOpen) return null;

  const cleanInviteName = inviteStudentName.trim().slice(0, 32);

  const studentInviteUrl = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
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
            <div className="pt-3 border-t sb-divider flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 sb-text-secondary">
                <Monitor className="w-4 h-4 sb-text-accent" aria-hidden="true" />
                <span className="font-semibold">Version Windows Portable (.exe)</span>
              </div>
              <a
                href="/api/download/windows-exe"
                download="StoryBridge-Studio-Debug.exe"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border sb-card-option font-bold sb-text-accent hover:sb-text-primary transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Télécharger (.exe)</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
