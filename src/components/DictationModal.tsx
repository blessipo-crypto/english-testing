import { useState } from 'react';
import {
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Check,
  Send,
} from 'lucide-react';
import type { VoiceAccent } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface DictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accent: VoiceAccent;
  speechRate: number;
  onAwardStar: () => void;
}

export function DictationModal({
  isOpen,
  onClose,
  accent,
  speechRate,
  onAwardStar,
}: DictationModalProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [loading, setLoading] = useState(false);
  const [sentenceData, setSentenceData] = useState<{ sentence: string; language?: string; translation: string; hint: string } | null>(null);
  const [studentText, setStudentText] = useState('');
  const [customText, setCustomText] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{ isCorrect: boolean; score: number; feedback: string; correctedSentence: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (prefLang?: 'en' | 'fr') => {
    setLoading(true);
    setErrorMsg('');
    setSentenceData(null);
    setStudentText('');
    setResult(null);

    try {
      const res = await fetch('/api/dictation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: prefLang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la génération');
      
      const detected = data.language === 'fr' ? 'fr' : 'en';
      setLanguage(detected);
      setSentenceData(data);
      speakSentence(data.sentence, detected);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de générer la dictée');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSentence = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    setStudentText('');
    setResult(null);

    try {
      const res = await fetch('/api/dictation/detect-lang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      });
      const data = await res.json();
      const detectedLang = data.language === 'fr' ? 'fr' : 'en';
      setLanguage(detectedLang);
      setSentenceData({
        sentence: clean,
        language: detectedLang,
        translation: detectedLang === 'fr' ? 'Texte en français personnalisé' : 'Custom English text',
        hint: detectedLang === 'fr' ? 'Module Français activé automatiquement' : 'English module activated automatically',
      });
      setCustomText('');
      speakSentence(clean, detectedLang);
    } catch {
      setLanguage('en');
      setSentenceData({ sentence: clean, language: 'en', translation: 'Custom', hint: 'Custom text' });
      speakSentence(clean, 'en');
    } finally {
      setLoading(false);
    }
  };

  const speakSentence = (text: string, lang: 'en' | 'fr') => {
    if (lang === 'fr') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = speechRate;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      speakEnglish(text, { accent, rate: speechRate });
    }
  };

  const handleVerify = async () => {
    if (!sentenceData || !studentText.trim()) return;
    setVerifying(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/dictation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSentence: sentenceData.sentence,
          studentInput: studentText.trim(),
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la vérification');
      setResult(data);
      if (data.isCorrect) {
        onAwardStar();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de vérifier la dictée');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dictation-modal-title"
    >
      <div className="manga-panel w-full max-w-xl p-6 lg:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold sb-text-accent flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Atelier Dictée IA · Auto-détection En / Fr</span>
            </div>
            <h2 id="dictation-modal-title" className="text-xl font-bold tracking-wide sb-text-primary mt-1">
              🎙️ Entraînement Dictée &amp; Correction IA
            </h2>
            <p className="text-xs sb-text-secondary mt-0.5">
              Génère une dictée aléatoire ou tape/colle n'importe quelle phrase (le module détecte automatiquement s'il s'agit d'anglais ou de français).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg sb-text-muted hover:sb-text-primary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Badge & Actions */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border sb-surface-soft">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                language === 'fr' 
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400' 
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
              }`}>
                {language === 'fr' ? '🇫🇷 Module Français actif' : '🇬🇧 Module Anglais actif'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerate('en')}
                className="px-3 py-1.5 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer hover:sb-chip-solid"
              >
                🎲 Aléatoire Anglais
              </button>
              <button
                type="button"
                onClick={() => handleGenerate('fr')}
                className="px-3 py-1.5 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer hover:sb-chip-solid"
              >
                🎲 Aléatoire Français
              </button>
            </div>
          </div>

          {/* Custom Sentence Input with Auto-detection */}
          <div className="space-y-2">
            <label htmlFor="custom-dictation-input" className="text-xs font-bold sb-text-secondary block">
              Ou entre / colle une phrase personnalisée (détection automatique de la langue) :
            </label>
            <div className="flex gap-2">
              <input
                id="custom-dictation-input"
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Ex : Would you like some tea? ou Le chat mange sa soupe."
                className="flex-1 rounded-xl border sb-input px-3.5 py-2 text-xs"
              />
              <button
                type="button"
                disabled={!customText.trim() || loading}
                onClick={() => handleCustomSentence(customText)}
                className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold shrink-0 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Charger &amp; Dicter</span>
              </button>
            </div>
          </div>

          {!sentenceData && !loading && (
            <div className="text-center py-6 space-y-4 border-t sb-divider pt-4">
              <p className="text-xs sb-text-muted">
                Clique sur un bouton aléatoire ci-dessus ou saisis une phrase pour commencer l'exercice de dictée.
              </p>
              <button
                type="button"
                onClick={() => handleGenerate()}
                className="manga-btn-primary px-6 py-3 rounded-2xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Générer une dictée aléatoire (En ou Fr) 🎯</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-10 space-y-3">
              <div className="w-8 h-8 border-4 border-[var(--sb-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs sb-text-accent font-bold animate-pulse">
                L'IA analyse la langue et prépare ta dictée...
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl border sb-status-warn text-xs">
              {errorMsg}
            </div>
          )}

          {sentenceData && !loading && (
            <div className="space-y-5 animate-fadeIn border-t sb-divider pt-4">
              {/* Audio Player & Hint Card */}
              <div className="p-4 rounded-2xl border sb-surface-soft space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold sb-text-accent">
                    {language === 'fr' ? '🇫🇷 Dictée active en Français' : '🇬🇧 Dictée active en Anglais'}
                  </span>
                  <button
                    type="button"
                    onClick={() => speakSentence(sentenceData.sentence, language)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    Écouter la phrase 🔊
                  </button>
                </div>

                <div className="text-xs sb-text-muted italic">
                  💡 Indice : <strong className="sb-text-secondary">{sentenceData.translation}</strong> — {sentenceData.hint}
                </div>
              </div>

              {/* Student Input Form */}
              <div className="space-y-2">
                <label htmlFor="dictation-student-input" className="text-xs font-bold sb-text-primary block">
                  Écris ici ce que tu entends :
                </label>
                <textarea
                  id="dictation-student-input"
                  rows={3}
                  value={studentText}
                  onChange={(e) => setStudentText(e.target.value)}
                  placeholder="Tape ta phrase ici..."
                  className="w-full rounded-2xl border sb-input p-3.5 text-sm font-medium"
                />
              </div>

              {/* Result Feedback */}
              {result && (
                <div className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${result.isCorrect ? 'sb-status-success' : 'sb-status-warn'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {result.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 sb-text-success shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 sb-text-reward shrink-0" />
                      )}
                      <span>
                        {result.isCorrect ? `Bravo ! Score : ${result.score}/100 🌟` : `Presque ! Score : ${result.score}/100`}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sb-text-secondary leading-relaxed">
                    {result.feedback}
                  </p>

                  {!result.isCorrect && (
                    <div className="p-3 rounded-xl sb-surface border text-xs font-mono">
                      <span className="sb-text-accent font-bold">Phrase correcte : </span>
                      {result.correctedSentence}
                    </div>
                  )}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t sb-divider">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Nouvelle dictée
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!studentText.trim() || verifying}
                    onClick={handleVerify}
                    className="manga-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {verifying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Vérifier avec l'IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
