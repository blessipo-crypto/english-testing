import { useState } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Music,
  Sparkles,
} from 'lucide-react';
import type { QuizState, VoiceAccent } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface QuizQuestion {
  id: string;
  questionEn: string;
  questionFr: string;
  options: string[];
  correctIndex: number;
  funFactEn: string;
  funFactFr: string;
  vocabTip: string;
}

export const BRUNO_MARS_QUESTIONS: QuizQuestion[] = [
  {
    id: 'bm-1',
    questionEn: 'What is Bruno Mars’s real first name?',
    questionFr: 'Quel est le vrai prénom de Bruno Mars ?',
    options: ['Peter', 'Michael', 'Lucas', 'Thomas'],
    correctIndex: 0,
    funFactEn: 'His real name is Peter Gene Hernandez. His dad gave him the nickname “Bruno”!',
    funFactFr: 'Son vrai nom est Peter Gene Hernandez. Son père lui a donné le surnom « Bruno » !',
    vocabTip: 'nickname = surnom',
  },
  {
    id: 'bm-2',
    questionEn: 'Where was Bruno Mars born?',
    questionFr: 'Où Bruno Mars est-il né ?',
    options: ['In Paris, France', 'In Honolulu, Hawaii', 'In London, England'],
    correctIndex: 1,
    funFactEn: 'He grew up on the sunny island of Hawaii in the Pacific Ocean.',
    funFactFr: 'Il a grandi sur l’île ensoleillée d’Hawaï, dans l’océan Pacifique.',
    vocabTip: 'island = île · sunny = ensoleillé',
  },
  {
    id: 'bm-3',
    questionEn: 'Complete the title of his big dance hit: “Uptown ____”!',
    questionFr: 'Complète le titre de son célèbre tube pour danser : « Uptown ____ » !',
    options: ['Rock', 'Jazz', 'Funk', 'Classic'],
    correctIndex: 2,
    funFactEn: '“Uptown Funk” came out in 2014 and became one of the most popular songs in the world!',
    funFactFr: '« Uptown Funk » est sorti en 2014 et est devenu l’une des chansons les plus célèbres au monde !',
    vocabTip: 'came out = est sorti',
  },
  {
    id: 'bm-4',
    questionEn: 'Which musical instruments can Bruno Mars play?',
    questionFr: 'De quels instruments de musique Bruno Mars sait-il jouer ?',
    options: [
      'Only the violin',
      'The guitar, piano and drums',
      'He cannot play any instrument',
    ],
    correctIndex: 1,
    funFactEn: 'He started playing music when he was a child and plays guitar, piano, bass and drums!',
    funFactFr: 'Il a commencé la musique tout jeune et joue de la guitare, du piano, de la basse et de la batterie !',
    vocabTip: 'drums = batterie',
  },
  {
    id: 'bm-5',
    questionEn: 'In his song “Count on Me”, what does “You can count on me” mean?',
    questionFr: 'Dans sa chanson « Count on Me », que signifie « You can count on me » ?',
    options: [
      'Tu peux compter sur moi',
      'Tu dois compter jusqu’à dix',
      'Tu peux chanter avec moi',
    ],
    correctIndex: 0,
    funFactEn: '“Count on Me” is a song about friendship and helping your best friends!',
    funFactFr: '« Count on Me » est une chanson sur l’amitié et l’entraide entre meilleurs amis !',
    vocabTip: 'friendship = amitié',
  },
  {
    id: 'bm-6',
    questionEn: 'Which song has the lyrics “When I see your face, there’s not a thing that I would change”?',
    questionFr: 'Quelle chanson contient les paroles « Quand je vois ton visage, il n’y a rien que je voudrais changer » ?',
    options: [
      'Just the Way You Are',
      'Happy Birthday',
      'Yellow Submarine',
    ],
    correctIndex: 0,
    funFactEn: '“Just the Way You Are” means “tel(le) que tu es”. It was his first big solo hit!',
    funFactFr: '« Just the Way You Are » veut dire « tel(le) que tu es ». Ce fut son premier grand succès solo !',
    vocabTip: 'to change = changer',
  },
];

interface BrunoMarsQuizProps {
  quiz: QuizState;
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<QuizState>) => void;
  onAwardStar: () => void;
}

export function BrunoMarsQuiz({
  quiz,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
}: BrunoMarsQuizProps) {
  const [showFrench, setShowFrench] = useState(false);

  const currentIdx = quiz.questionIndex % BRUNO_MARS_QUESTIONS.length;
  const question = BRUNO_MARS_QUESTIONS[currentIdx];
  const selectedChoice = quiz.answers[question.id];
  const isAnswered = typeof selectedChoice === 'number';
  const isCorrect = isAnswered && selectedChoice === question.correctIndex;

  const totalAnswered = Object.keys(quiz.answers).length;
  const score = BRUNO_MARS_QUESTIONS.reduce((acc, q) => {
    return quiz.answers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);

  const allCompleted = totalAnswered === BRUNO_MARS_QUESTIONS.length;

  const handleChooseOption = (optIndex: number) => {
    if (isAnswered) return;
    const nextAnswers = { ...quiz.answers, [question.id]: optIndex };
    const wasLast =
      Object.keys(nextAnswers).length === BRUNO_MARS_QUESTIONS.length;
    onUpdate({ answers: nextAnswers });
    speakEnglish(question.options[optIndex], { accent, rate: speechRate });
    if (optIndex === question.correctIndex || wasLast) {
      if (wasLast) {
        onAwardStar();
      }
    }
  };

  const handleNext = () => {
    setShowFrench(false);
    onUpdate({
      questionIndex: (currentIdx + 1) % BRUNO_MARS_QUESTIONS.length,
    });
  };

  const handleRestart = () => {
    setShowFrench(false);
    onUpdate({
      questionIndex: 0,
      answers: {},
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Quiz Stage (8 cols) */}
      <div className="lg:col-span-8 manga-panel p-6 lg:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b sb-divider">
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-[var(--sb-danger)]" aria-hidden="true" />
              <span>Quiz facile · Niveau A1–A2 · Musique & Anglais</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-wide sb-text-primary">
              Spécial Bruno Mars
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold tracking-wide sb-text-reward tabular-nums">
              Question {currentIdx + 1} / {BRUNO_MARS_QUESTIONS.length}
            </span>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-b-2 sb-chip-idle border-b-[var(--sb-border-3d)] text-xs font-bold hover:border-[var(--sb-reward)] hover:sb-text-reward transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Recommencer
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="p-5 rounded-2xl sb-surface-soft border space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg lg:text-xl font-bold sb-text-primary leading-snug">
              {question.questionEn}
            </p>
            <button
              type="button"
              onClick={() =>
                speakEnglish(question.questionEn, { accent, rate: speechRate })
              }
              aria-label="Écouter la question en anglais"
              className="manga-btn-primary inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              Écouter
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFrench((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold sb-text-accent hover:sb-text-primary cursor-pointer"
          >
            {showFrench ? (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {showFrench ? 'Masquer la traduction' : 'Aide en français'}
          </button>

          {showFrench && (
            <p className="text-sm sb-text-reward font-semibold pt-2 border-t sb-divider">
              {question.questionFr}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {question.options.map((opt, idx) => {
            const isPicked = selectedChoice === idx;
            const isRightOption = idx === question.correctIndex;

            let styleClass = 'sb-card-option cursor-pointer';
            let markerClass = 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-hover-accent)]';
            let letterClass = 'sb-text-accent group-hover:sb-text-reward';
            if (isAnswered) {
              if (isRightOption) {
                styleClass =
                  'sb-status-success border-b-[var(--sb-success-3d)] cursor-default';
                markerClass = 'bg-[var(--sb-success)]';
                letterClass = 'sb-text-success';
              } else if (isPicked) {
                styleClass =
                  'sb-status-danger border-b-[var(--sb-danger-3d)] cursor-default';
                markerClass = 'bg-[var(--sb-danger)]';
                letterClass = 'sb-text-danger';
              } else {
                styleClass = 'sb-card-used cursor-default';
                markerClass = 'bg-[var(--sb-text-used)]';
                letterClass = 'text-[var(--sb-text-used)]';
              }
            }

            return (
              <button
                key={`${question.id}-opt-${idx}`}
                type="button"
                disabled={isAnswered}
                onClick={() => handleChooseOption(idx)}
                className={`group w-full px-4 py-3.5 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between gap-3 transition-all ${styleClass}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`w-2.5 h-2.5 rotate-45 shrink-0 transition-colors ${markerClass}`}
                  />
                  <span className={`font-mono text-xs font-extrabold transition-colors ${letterClass}`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </span>

                {isAnswered && isRightOption && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold sb-text-success shrink-0">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    Bonne réponse
                  </span>
                )}
                {isAnswered && isPicked && !isRightOption && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold sb-text-danger shrink-0">
                    <XCircle className="w-4 h-4" aria-hidden="true" />
                    Pas celle-ci
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback & Fun Fact */}
        {isAnswered && (
          <div
            role="status"
            className={`p-4 rounded-2xl border space-y-2 ${
              isCorrect ? 'sb-status-success' : 'sb-status-warn'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-bold sb-text-primary">
                {isCorrect ? 'Bravo !' : 'Bien essayé !'} {question.funFactEn}
              </div>
              <button
                type="button"
                onClick={() =>
                  speakEnglish(question.funFactEn, { accent, rate: speechRate })
                }
                aria-label="Écouter l'anecdote en anglais"
                className="p-1.5 rounded-lg sb-audio-btn border shrink-0 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs sb-text-secondary">{question.funFactFr}</p>
            <p className="text-xs font-mono font-bold sb-text-reward">
              Mot à retenir : {question.vocabTip}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t sb-divider flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold tracking-wide sb-text-reward tabular-nums">
            Score actuel : {score} / {BRUNO_MARS_QUESTIONS.length}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
          >
            Question suivante
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Right Column: Progress & Score Summary (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-bold tracking-wide sb-text-primary">
            Progression du quiz
          </h2>

          {allCompleted && (
            <div className="p-3.5 rounded-xl sb-status-success border text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 sb-text-reward shrink-0" aria-hidden="true" />
              <span>
                Quiz terminé ! Score final : {score}/{BRUNO_MARS_QUESTIONS.length} (+1 étoile).
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            {BRUNO_MARS_QUESTIONS.map((q, idx) => {
              const ans = quiz.answers[q.id];
              const answered = typeof ans === 'number';
              const ok = answered && ans === q.correctIndex;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setShowFrench(false);
                    onUpdate({ questionIndex: idx });
                  }}
                  className={`w-full p-2.5 rounded-xl border border-b-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isCurrent ? 'sb-card-selected' : 'sb-card-option'
                  }`}
                >
                  <span className="text-xs font-semibold sb-text-primary truncate">
                    {idx + 1}. {q.questionEn}
                  </span>
                  <span className="text-xs font-bold shrink-0">
                    {!answered ? (
                      <span className="sb-text-muted">À faire</span>
                    ) : ok ? (
                      <span className="sb-text-success">Juste</span>
                    ) : (
                      <span className="text-[var(--sb-danger)]">Raté</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
