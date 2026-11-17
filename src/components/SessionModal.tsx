import { useState } from 'react';
import { X, Copy, Check, Users, LogOut, MessageCircle } from 'lucide-react';
import type { RoomParticipant } from '../types/lesson';

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string | null;
  connected: boolean;
  participants: RoomParticipant[];
  onJoinRoom: (code: string) => void;
  onLeaveRoom: () => void;
}

export function SessionModal({
  isOpen,
  onClose,
  roomCode,
  connected,
  participants,
  onJoinRoom,
  onLeaveRoom,
}: SessionModalProps) {
  const [inputCode, setInputCode] = useState(roomCode || 'LNDN26');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const studentInviteUrl = roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(
        roomCode
      )}&role=student`
    : '';

  const inviteMessage = roomCode
    ? `Bonjour ! Voici le lien pour rejoindre notre cours d'anglais interactif sur StoryBridge Studio : ${studentInviteUrl} (Salle : ${roomCode})`
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

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="visio-modal-title"
    >
      <div className="manga-panel w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="visio-modal-title" className="text-lg font-bold text-slate-900">
              Invitation & Synchronisation Visio
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Envoyez ce lien par WhatsApp ou copiez-le pour que l’élève manipule les
              cartes, les phrases et le tableau en direct avec vous.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {roomCode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">Code de la salle</div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  {connected ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-800">Connecté en direct</span>
                    </>
                  ) : (
                    <span className="text-amber-700">Reconnexion...</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-2xl font-bold tracking-wider text-slate-900">
                  {roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
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

              {/* Optional WhatsApp Phone + 1-click WhatsApp Invite Button */}
              <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                <label
                  htmlFor="whatsapp-phone-input"
                  className="text-xs font-medium text-slate-600 block"
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
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <a
                    href={whatsappInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Inviter sur WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  Participants connectés ({participants.length})
                </span>
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg px-3">
                {participants.length === 0 ? (
                  <p className="py-2.5 text-xs text-slate-500">
                    En attente de connexion...
                  </p>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.id}
                      className="py-2 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-900">{p.name}</span>
                      <span className="text-slate-500">
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                Quitter la salle live
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
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
                className="text-xs font-semibold text-slate-700 block"
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
                  className="flex-1 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Démarrer la salle
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Astuce : même sans salle live, vous pouvez simplement partager votre écran
              dans Zoom, Google Meet ou Teams et utiliser tous les exercices immédiatement.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
