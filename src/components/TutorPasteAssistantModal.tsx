import { useState } from 'react';
import {
  X,
  Volume2,
  Clipboard,
  ClipboardPaste,
  Send,
  BookmarkPlus,
  Check,
  Languages,
} from 'lucide-react';
import type { VoiceAccent, WordbankItem } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface TutorPasteAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  accent: VoiceAccent;
  speechRate: number;
  currentBoardNote: string;
  onUpdateBoardNote: (note: string) => void;
  onAddWord: (item: Omit<WordbankItem, 'id' | 'addedAt'>) => void;
}

export function TutorPasteAssistantModal({
  isOpen,
  onClose,
  accent,
  speechRate,
  currentBoardNote,
  onUpdateBoardNote,
  onAddWord,
}: TutorPasteAssistantModalProps) {
  const [pastedText, setPastedText] = useState('');
  const [translationHint, setTranslationHint] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [wordAddedSuccess, setWordAddedSuccess] = useState(false);
  const [pasteError, setPasteError] = useState('');

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    setPasteError('');
    try {
      if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPastedText(text);
          return;
        }
      }
      setPasteError('Presse-papiers inaccessible. Utilisez Ctrl+V dans la zone de texte.');
    } catch {
      setPasteError('Collez directement votre texte (Ctrl+V) dans la zone ci-dessous.');
    }
  };

  const handleSendToBoard = () => {
    const clean = pastedText.trim();
    if (!clean) return;
    const separator = currentBoardNote ? '\n\n' : '';
    onUpdateBoardNote(`${currentBoardNote}${separator}${clean}`);
    setSentSuccess(true);
    window.setTimeout(() => setSentSuccess(false), 2000);
  };

  const handleAddToWordbank = () => {
    const clean = pastedText.trim();
    if (!clean) return;
    onAddWord({
      en: clean.slice(0, 80),
      fr: translationHint.trim().slice(0, 80) || 'Texte personnalisé Prof',
      note: 'Ajouté via Copier/Coller Prof',
    });
    setWordAddedSuccess(true);
    window.setTimeout(() => setWordAddedSuccess(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-paste-modal-title"
    >
      <div className="manga-panel w-full max-w-xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="tutor-paste-modal-title" className="text-lg font-bold tracking-wide sb-text-primary flex items-center gap-2">
              <Clipboard className="w-5 h-5 sb-text-accent" aria-hidden="true" />
              <span>Assistant Copier / Coller Professeur</span>
            </h2>
            <p className="text-xs sb-text-muted mt-1">
              Collez n’importe quel texte en anglais ou en français pour le faire écouter (UK/US), l’envoyer en direct sur le tableau de la salle ou l’ajouter au carnet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’assistant"
            className="p-1.5 rounded-lg sb-text-muted hover:sb-text-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold sb-text-secondary">
              <label htmlFor="tutor-paste-textarea">
                Zone de texte libre (Français ou Anglais)
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border sb-chip-idle text-[11px] font-bold cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
                <span>Coller depuis le presse-papier</span>
              </button>
            </div>

            {pasteError && (
              <div className="text-[11px] sb-text-warn">{pasteError}</div>
            )}

            <textarea
              id="tutor-paste-textarea"
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Écrivez ou collez ici un texte, une phrase ou un mot (ex : Would you like a cup of tea?)..."
              className="w-full rounded-2xl border sb-input p-3.5 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tutor-translation-input" className="text-xs font-medium sb-text-muted block">
              Traduction ou note en français (optionnel pour le carnet) :
            </label>
            <input
              id="tutor-translation-input"
              type="text"
              value={translationHint}
              onChange={(e) => setTranslationHint(e.target.value)}
              placeholder="Ex : Voudriez-vous une tasse de thé ?"
              className="w-full rounded-xl border sb-input px-3 py-2 text-xs"
            />
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t sb-divider">
            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={() => speakEnglish(pastedText, { accent: 'en-GB', rate: speechRate })}
              className="p-2.5 rounded-xl border sb-audio-btn text-xs font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 sb-text-accent" />
              <span>Écouter (UK)</span>
            </button>

            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={() => speakEnglish(pastedText, { accent: 'en-US', rate: speechRate })}
              className="p-2.5 rounded-xl border sb-audio-btn text-xs font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <Languages className="w-4 h-4 sb-text-accent" />
              <span>Écouter (US)</span>
            </button>

            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={handleSendToBoard}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors ${
                sentSuccess ? 'sb-status-success' : 'sb-chip-idle hover:sb-chip-solid'
              } disabled:opacity-50 cursor-pointer`}
            >
              {sentSuccess ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              <span>{sentSuccess ? 'Envoyé !' : 'Envoyer au tableau'}</span>
            </button>

            <button
              type="button"
              disabled={!pastedText.trim()}
              onClick={handleAddToWordbank}
              className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-colors ${
                wordAddedSuccess ? 'sb-status-success' : 'sb-chip-idle hover:sb-chip-solid'
              } disabled:opacity-50 cursor-pointer`}
            >
              {wordAddedSuccess ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              <span>{wordAddedSuccess ? 'Ajouté !' : 'Ajouter au carnet'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl manga-btn-primary text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
