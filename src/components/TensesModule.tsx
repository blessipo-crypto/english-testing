import { useState } from 'react';
import {
  Volume2,
  BookmarkPlus,
  Check,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  PRESENT_SIMPLE_DATA,
  PRESENT_CONTINUOUS_DATA,
  PAST_SIMPLE_DATA,
  EXPRESSIONS_DATA,
  CONJUGATOR_VERBS,
  TENSES_QUIZ_QUESTIONS,
  type ConjugatorVerb,
} from '../data/tensesData';
import type { VoiceAccent, WordbankItem } from '../types/lesson';
import { speakEnglish } from '../utils/speech';
import { playError, playPop, playSuccess, playVictory } from '../utils/soundFx';

interface TensesModuleProps {
  accent: VoiceAccent;
  speechRate: number;
  wordbank: WordbankItem[];
  activeCategory?:
    | 'present-simple'
    | 'present-continuous'
    | 'past-simple'
    | 'expressions'
    | 'simulator'
    | 'quiz';
  onAddWord: (item: Omit<WordbankItem, 'id' | 'addedAt'>) => void;
  onAwardStar: () => void;
  onChangeCategory?: (
    cat:
      | 'present-simple'
      | 'present-continuous'
      | 'past-simple'
      | 'expressions'
      | 'simulator'
      | 'quiz'
  ) => void;
}

type Pronoun = 'I' | 'You' | 'He / She' | 'We' | 'They';
type Polarity = 'affirmative' | 'negative' | 'question';

const PRONOUNS: Pronoun[] = ['I', 'You', 'He / She', 'We', 'They'];

const TABS: Array<{
  id:
    | 'present-simple'
    | 'present-continuous'
    | 'past-simple'
    | 'expressions'
    | 'simulator'
    | 'quiz';
  label: string;
  badge: string;
}> = [
  { id: 'present-simple', label: 'Present Simple', badge: 'Habitudes & -S' },
  { id: 'present-continuous', label: 'Present Continuous', badge: 'BE + V-ing' },
  { id: 'past-simple', label: 'Past Simple', badge: 'Prétérit & DID' },
  { id: 'expressions', label: 'Durée & Fréquence', badge: 'FOR, SINCE, AGO' },
  { id: 'simulator', label: 'Simulateur', badge: 'Conjugueur interactif' },
  { id: 'quiz', label: 'Défi Quiz', badge: '12 questions' },
];

const ESSENTIAL_IRREGULAR_PAST = [
  { base: 'be', past: 'was / were', fr: 'être' },
  { base: 'have', past: 'had', fr: 'avoir' },
  { base: 'do', past: 'did', fr: 'faire' },
  { base: 'go', past: 'went', fr: 'aller' },
  { base: 'see', past: 'saw', fr: 'voir' },
  { base: 'eat', past: 'ate', fr: 'manger' },
  { base: 'drink', past: 'drank', fr: 'boire' },
  { base: 'buy', past: 'bought', fr: 'acheter' },
  { base: 'make', past: 'made', fr: 'fabriquer' },
  { base: 'take', past: 'took', fr: 'prendre' },
  { base: 'write', past: 'wrote', fr: 'écrire' },
  { base: 'read', past: 'read (/red/)', fr: 'lire' },
  { base: 'say', past: 'said', fr: 'dire' },
  { base: 'sing', past: 'sang', fr: 'chanter' },
  { base: 'swim', past: 'swam', fr: 'nager' },
];

export function TensesModule({
  accent,
  speechRate,
  wordbank,
  activeCategory = 'present-simple',
  onAddWord,
  onAwardStar,
  onChangeCategory,
}: TensesModuleProps) {
  const [currentTab, setCurrentTab] = useState<
    | 'present-simple'
    | 'present-continuous'
    | 'past-simple'
    | 'expressions'
    | 'simulator'
    | 'quiz'
  >(activeCategory);

  // Simulator state
  const [selectedPronoun, setSelectedPronoun] = useState<Pronoun>('He / She');
  const [selectedVerbId, setSelectedVerbId] = useState<string>('watch');
  const [selectedPolarity, setSelectedPolarity] = useState<Polarity>('affirmative');

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizStreak, setQuizStreak] = useState(0);
  const [starAwarded, setStarAwarded] = useState(false);

  const selectedVerb =
    CONJUGATOR_VERBS.find((v) => v.id === selectedVerbId) || CONJUGATOR_VERBS[0];

  const handleTabChange = (
    tab:
      | 'present-simple'
      | 'present-continuous'
      | 'past-simple'
      | 'expressions'
      | 'simulator'
      | 'quiz'
  ) => {
    setCurrentTab(tab);
    if (onChangeCategory) onChangeCategory(tab);
  };

  const isSavedInWordbank = (term: string) =>
    wordbank.some((w) => w.en.toLowerCase() === term.toLowerCase());

  // Conjugation logic for the simulator
  const computeConjugations = (pronoun: Pronoun, verb: ConjugatorVerb, pol: Polarity) => {
    const isThird = pronoun === 'He / She';
    const subjLabel = isThird ? 'She' : pronoun;
    const subjLower = subjLabel.toLowerCase();

    // 1. Present Simple
    let presSimp = '';
    let presSimpFr = '';
    if (pol === 'affirmative') {
      const form = isThird ? verb.presentThird : verb.base;
      presSimp = `${subjLabeL(subjLabel)} ${form} every day.`;
      presSimpFr = `${frSubject(subjLabel)} ${frVerb(verb, 'present', isThird)} tous les jours.`;
    } else if (pol === 'negative') {
      const aux = isThird ? "doesn't" : "don't";
      presSimp = `${subjLabeL(subjLabel)} ${aux} ${verb.base} every day.`;
      presSimpFr = `${frSubject(subjLabel)} ne ${frVerb(verb, 'present', isThird)} pas tous les jours.`;
    } else {
      const aux = isThird ? 'Does' : 'Do';
      presSimp = `${aux} ${subjLower} ${verb.base} every day?`;
      presSimpFr = `Est-ce que ${frSubject(subjLabel).toLowerCase()} ${frVerb(verb, 'present', isThird)} tous les jours ?`;
    }

    // 2. Present Continuous
    let beAux = 'are';
    let beAuxNeg = "aren't";
    if (pronoun === 'I') {
      beAux = 'am';
      beAuxNeg = 'am not';
    } else if (isThird) {
      beAux = 'is';
      beAuxNeg = "isn't";
    }

    let presCont = '';
    let presContFr = '';
    if (pol === 'affirmative') {
      presCont = `${subjLabeL(subjLabel)} ${beAux} ${verb.presentCont} right now.`;
      presContFr = `${frSubject(subjLabel)} est en train de ${verb.fr} en ce moment.`;
    } else if (pol === 'negative') {
      presCont = `${subjLabeL(subjLabel)} ${beAuxNeg} ${verb.presentCont} right now.`;
      presContFr = `${frSubject(subjLabel)} n’est pas en train de ${verb.fr} en ce moment.`;
    } else {
      const capitalBe = beAux.charAt(0).toUpperCase() + beAux.slice(1);
      presCont = `${capitalBe} ${subjLower} ${verb.presentCont} right now?`;
      presContFr = `Est-ce que ${frSubject(subjLabel).toLowerCase()} est en train de ${verb.fr} en ce moment ?`;
    }

    // 3. Past Simple
    let pastSimp = '';
    let pastSimpFr = '';
    if (pol === 'affirmative') {
      pastSimp = `${subjLabeL(subjLabel)} ${verb.pastSimple} yesterday.`;
      pastSimpFr = `${frSubject(subjLabel)} a ${frPastParticiple(verb)} hier.`;
    } else if (pol === 'negative') {
      pastSimp = `${subjLabeL(subjLabel)} didn't ${verb.base} yesterday.`;
      pastSimpFr = `${frSubject(subjLabel)} n’a pas ${frPastParticiple(verb)} hier.`;
    } else {
      pastSimp = `Did ${subjLower} ${verb.base} yesterday?`;
      pastSimpFr = `Est-ce que ${frSubject(subjLabel).toLowerCase()} a ${frPastParticiple(verb)} hier ?`;
    }

    return {
      presentSimple: { en: presSimp, fr: presSimpFr },
      presentContinuous: { en: presCont, fr: presContFr },
      pastSimple: { en: pastSimp, fr: pastSimpFr },
    };
  };

  function subjLabeL(label: string) {
    return label === 'He / She' ? 'She' : label;
  }

  function frSubject(label: string) {
    if (label === 'I') return 'Je';
    if (label === 'You') return 'Tu';
    if (label === 'He / She' || label === 'She') return 'Elle';
    if (label === 'We') return 'Nous';
    if (label === 'They') return 'Ils';
    return label;
  }

  function frVerb(verb: ConjugatorVerb, tense: 'present', isThird: boolean) {
    if (verb.id === 'play') return isThird ? 'joue' : 'joue';
    if (verb.id === 'watch') return isThird ? 'regarde' : 'regarde';
    if (verb.id === 'study') return isThird ? 'étudie' : 'étudie';
    if (verb.id === 'swim') return isThird ? 'nage' : 'nage';
    if (verb.id === 'go') return isThird ? 'va' : 'vais';
    if (verb.id === 'eat') return isThird ? 'mange' : 'mange';
    if (verb.id === 'live') return isThird ? 'habite' : 'habite';
    if (verb.id === 'write') return isThird ? 'écrit' : 'écris';
    if (verb.id === 'listen') return isThird ? 'écoute' : 'écoute';
    if (verb.id === 'stop') return isThird ? 's’arrête' : 'm’arrête';
    return verb.fr;
  }

  function frPastParticiple(verb: ConjugatorVerb) {
    if (verb.id === 'play') return 'joué';
    if (verb.id === 'watch') return 'regardé';
    if (verb.id === 'study') return 'étudié';
    if (verb.id === 'swim') return 'nagé';
    if (verb.id === 'go') return 'été / allé';
    if (verb.id === 'eat') return 'mangé';
    if (verb.id === 'live') return 'habité';
    if (verb.id === 'write') return 'écrit';
    if (verb.id === 'listen') return 'écouté';
    if (verb.id === 'stop') return 'arrêté';
    return verb.fr;
  }

  const simulated = computeConjugations(
    selectedPronoun,
    selectedVerb,
    selectedPolarity
  );

  // Quiz handlers
  const currentQuizQ = TENSES_QUIZ_QUESTIONS[quizIndex % TENSES_QUIZ_QUESTIONS.length];
  const userChoice = quizAnswers[currentQuizQ.id];
  const isQuestionAnswered = typeof userChoice === 'number';
  const isQuizCorrect = isQuestionAnswered && userChoice === currentQuizQ.correctIndex;
  const totalCorrect = TENSES_QUIZ_QUESTIONS.reduce((acc, q) => {
    return quizAnswers[q.id] === q.correctIndex ? acc + 1 : acc;
  }, 0);
  const quizCompleted = Object.keys(quizAnswers).length === TENSES_QUIZ_QUESTIONS.length;

  const handleQuizAnswer = (optIndex: number) => {
    if (isQuestionAnswered) return;
    const isRight = optIndex === currentQuizQ.correctIndex;
    const nextAnswers = { ...quizAnswers, [currentQuizQ.id]: optIndex };
    setQuizAnswers(nextAnswers);

    if (isRight) {
      playSuccess();
      setQuizStreak((s) => s + 1);
    } else {
      playError();
      setQuizStreak(0);
    }

    speakEnglish(currentQuizQ.completedEn, { accent, rate: speechRate });

    if (Object.keys(nextAnswers).length === TENSES_QUIZ_QUESTIONS.length) {
      playVictory();
      if (!starAwarded) {
        setStarAwarded(true);
        onAwardStar();
      }
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizStreak(0);
    setStarAwarded(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Banner with Modern Tech Aesthetic */}
      <div className="manga-panel p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[var(--sb-danger)]" aria-hidden="true" />
            <span>Formation des Temps · Niveau Collège A1–A2 (11–14 ans)</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-wide sb-text-primary">
            Conjugaison & Expression du Temps en Anglais
          </h1>
          <p className="text-xs sb-text-muted">
            Maîtrise pas à pas le Present Simple, le Present Continuous, le Past Simple (prétérit) et l’expression de la durée, de la fréquence et du futur.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 sb-seg-track border rounded-2xl self-start lg:self-auto">
          {TABS.map((tab) => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold tracking-wide rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'sb-seg-active' : 'sb-seg-idle'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================================
          SECTION 1: PRESENT SIMPLE
         ====================================================================== */}
      {currentTab === 'present-simple' && (
        <div className="space-y-6">
          {/* Main Formula Card */}
          <div className="manga-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b sb-divider">
              <div>
                <span className="text-xs font-bold tracking-wide sb-chip-solid px-2.5 py-0.5 rounded-lg mr-2">
                  {PRESENT_SIMPLE_DATA.badge}
                </span>
                <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-1">
                  {PRESENT_SIMPLE_DATA.title}
                </h2>
                <p className="text-xs sb-text-secondary mt-0.5">
                  {PRESENT_SIMPLE_DATA.ruleFr}
                </p>
              </div>

              <div className="font-mono text-xs sb-surface border rounded-xl px-3.5 py-2 sb-text-reward">
                Formule : <strong>{PRESENT_SIMPLE_DATA.formula}</strong>
              </div>
            </div>

            {/* Spelling Rules Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Les 4 règles d’orthographe à la 3e personne (he, she, it) :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESENT_SIMPLE_DATA.spellingRules?.map((sr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border sb-surface-soft space-y-1"
                  >
                    <div className="text-xs font-bold sb-text-primary">
                      {idx + 1}. {sr.rule}
                    </div>
                    <div className="font-mono text-xs sb-text-reward">
                      {sr.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Examples Grid */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Exemples complets avec audio :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PRESENT_SIMPLE_DATA.examples.map((ex, idx) => {
                  const saved = isSavedInWordbank(ex.en);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold sb-text-accent">
                            {ex.type}
                          </span>
                          {ex.tip && (
                            <span className="text-[11px] font-semibold sb-text-muted">
                              {ex.tip}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold sb-text-primary">
                          {ex.en}
                        </p>
                        <p className="text-xs sb-text-secondary">{ex.fr}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t sb-divider">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(ex.en, { accent, rate: speechRate })
                          }
                          aria-label={`Écouter ${ex.en}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Écouter
                        </button>
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() =>
                            onAddWord({
                              en: ex.en,
                              fr: ex.fr,
                              note: 'Present Simple',
                            })
                          }
                          className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            saved
                              ? 'sb-status-success'
                              : 'sb-chip-idle hover:border-[var(--sb-reward)] hover:sb-text-reward'
                          }`}
                        >
                          {saved ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Golden Rule Callout */}
            <div className="p-4 rounded-2xl border sb-status-warn space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold sb-text-reward">
                <Zap className="w-4 h-4 fill-current shrink-0" />
                <span>Règle d’or du Present Simple</span>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                {PRESENT_SIMPLE_DATA.goldenRule}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 2: PRESENT CONTINUOUS
         ====================================================================== */}
      {currentTab === 'present-continuous' && (
        <div className="space-y-6">
          <div className="manga-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b sb-divider">
              <div>
                <span className="text-xs font-bold tracking-wide sb-chip-solid px-2.5 py-0.5 rounded-lg mr-2">
                  {PRESENT_CONTINUOUS_DATA.badge}
                </span>
                <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-1">
                  {PRESENT_CONTINUOUS_DATA.title}
                </h2>
                <p className="text-xs sb-text-secondary mt-0.5">
                  {PRESENT_CONTINUOUS_DATA.ruleFr}
                </p>
              </div>

              <div className="font-mono text-xs sb-surface border rounded-xl px-3.5 py-2 sb-text-reward">
                Formule : <strong>{PRESENT_CONTINUOUS_DATA.formula}</strong>
              </div>
            </div>

            {/* Spelling Rules for -ING */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Les 4 règles pour fabriquer la forme en -ING :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESENT_CONTINUOUS_DATA.spellingRules?.map((sr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border sb-surface-soft space-y-1"
                  >
                    <div className="text-xs font-bold sb-text-primary">
                      {idx + 1}. {sr.rule}
                    </div>
                    <div className="font-mono text-xs sb-text-reward">
                      {sr.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duel Comparatif: Simple vs Continuous */}
            <div className="p-4 rounded-2xl border sb-surface space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold sb-text-accent uppercase tracking-wide">
                <Layers className="w-4 h-4" />
                <span>Le duel des présents : Present Simple VS Present Continuous</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border sb-surface-soft space-y-1">
                  <div className="text-xs font-bold sb-text-reward">
                    Present Simple (Habitude / Permanent)
                  </div>
                  <p className="text-sm font-semibold sb-text-primary">
                    « I play football every Saturday. »
                  </p>
                  <p className="text-xs sb-text-muted">
                    C’est ma routine du week-end. Mots-clés : every day, always, often, on Sundays...
                  </p>
                </div>
                <div className="p-3 rounded-xl border sb-surface-soft space-y-1">
                  <div className="text-xs font-bold sb-text-accent">
                    Present Continuous (En ce moment / Image)
                  </div>
                  <p className="text-sm font-semibold sb-text-primary">
                    « Look! I am playing football right now. »
                  </p>
                  <p className="text-xs sb-text-muted">
                    L’action a lieu sous mes yeux à la minute où je parle. Mots-clés : now, Look!, Listen!
                  </p>
                </div>
              </div>
            </div>

            {/* Examples */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Exemples complets avec audio :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PRESENT_CONTINUOUS_DATA.examples.map((ex, idx) => {
                  const saved = isSavedInWordbank(ex.en);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold sb-text-accent">
                            {ex.type}
                          </span>
                          {ex.tip && (
                            <span className="text-[11px] font-semibold sb-text-muted">
                              {ex.tip}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold sb-text-primary">
                          {ex.en}
                        </p>
                        <p className="text-xs sb-text-secondary">{ex.fr}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t sb-divider">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(ex.en, { accent, rate: speechRate })
                          }
                          aria-label={`Écouter ${ex.en}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Écouter
                        </button>
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() =>
                            onAddWord({
                              en: ex.en,
                              fr: ex.fr,
                              note: 'Present Continuous',
                            })
                          }
                          className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            saved
                              ? 'sb-status-success'
                              : 'sb-chip-idle hover:border-[var(--sb-reward)] hover:sb-text-reward'
                          }`}
                        >
                          {saved ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Golden Rule */}
            <div className="p-4 rounded-2xl border sb-status-warn space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold sb-text-reward">
                <Zap className="w-4 h-4 fill-current shrink-0" />
                <span>Règle d’or du Present Continuous</span>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                {PRESENT_CONTINUOUS_DATA.goldenRule}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 3: PAST SIMPLE (PRÉTÉRIT)
         ====================================================================== */}
      {currentTab === 'past-simple' && (
        <div className="space-y-6">
          <div className="manga-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b sb-divider">
              <div>
                <span className="text-xs font-bold tracking-wide sb-chip-solid px-2.5 py-0.5 rounded-lg mr-2">
                  {PAST_SIMPLE_DATA.badge}
                </span>
                <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-1">
                  {PAST_SIMPLE_DATA.title}
                </h2>
                <p className="text-xs sb-text-secondary mt-0.5">
                  {PAST_SIMPLE_DATA.ruleFr}
                </p>
              </div>

              <div className="font-mono text-xs sb-surface border rounded-xl px-3.5 py-2 sb-text-reward">
                Formule : <strong>{PAST_SIMPLE_DATA.formula}</strong>
              </div>
            </div>

            {/* Spelling & Pronunciation of -ED */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Formation des verbes réguliers & les 3 sons de -ED :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PAST_SIMPLE_DATA.spellingRules?.map((sr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border sb-surface-soft space-y-1"
                  >
                    <div className="text-xs font-bold sb-text-primary">
                      {sr.rule}
                    </div>
                    <div className="font-mono text-xs sb-text-reward">
                      {sr.example}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* The Golden Rule of DID */}
            <div className="p-4 rounded-2xl border sb-status-danger space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold sb-text-danger">
                <Zap className="w-4 h-4 fill-current shrink-0" />
                <span>La règle d’or absolue de l’auxiliaire DID</span>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                {PAST_SIMPLE_DATA.goldenRule}
              </p>
              <div className="font-mono text-xs sb-surface p-2.5 rounded-xl border mt-2 flex flex-wrap gap-4">
                <span>
                  Correct : She <strong className="sb-text-success">didn't go</strong>
                </span>
                <span className="sb-text-danger">
                  Faux : She didn't <s>went</s> / She didn't <s>goes</s>
                </span>
              </div>
            </div>

            {/* 15 Essential Irregular Past Verbs Quick Strip */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                  15 verbes irréguliers fondamentaux du prétérit :
                </h3>
                <span className="text-[11px] sb-text-muted">Clique pour écouter</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {ESSENTIAL_IRREGULAR_PAST.map((item) => (
                  <button
                    key={item.base}
                    type="button"
                    onClick={() =>
                      speakEnglish(`${item.base}, ${item.past.split(' ')[0]}`, {
                        accent,
                        rate: speechRate,
                      })
                    }
                    className="p-2.5 rounded-xl border sb-surface-soft hover:border-[var(--sb-accent)] flex flex-col text-left transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-xs font-bold sb-text-primary group-hover:sb-text-accent">
                      {item.base} → <span className="sb-text-reward">{item.past}</span>
                    </span>
                    <span className="text-[11px] sb-text-muted">{item.fr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                Exemples complets avec audio :
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PAST_SIMPLE_DATA.examples.map((ex, idx) => {
                  const saved = isSavedInWordbank(ex.en);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold sb-text-accent">
                            {ex.type}
                          </span>
                          {ex.tip && (
                            <span className="text-[11px] font-semibold sb-text-muted">
                              {ex.tip}
                            </span>
                          )}
                        </div>
                        <p className="text-base font-bold sb-text-primary">
                          {ex.en}
                        </p>
                        <p className="text-xs sb-text-secondary">{ex.fr}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t sb-divider">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(ex.en, { accent, rate: speechRate })
                          }
                          aria-label={`Écouter ${ex.en}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Écouter
                        </button>
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() =>
                            onAddWord({
                              en: ex.en,
                              fr: ex.fr,
                              note: 'Past Simple',
                            })
                          }
                          className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            saved
                              ? 'sb-status-success'
                              : 'sb-chip-idle hover:border-[var(--sb-reward)] hover:sb-text-reward'
                          }`}
                        >
                          {saved ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 4: EXPRESSIONS DU TEMPS, DURÉE & FRÉQUENCE
         ====================================================================== */}
      {currentTab === 'expressions' && (
        <div className="space-y-6">
          {EXPRESSIONS_DATA.map((cat) => (
            <div key={cat.id} className="manga-panel p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold tracking-wide sb-chip-solid px-2.5 py-0.5 rounded-lg mr-2">
                    {cat.badge}
                  </span>
                  <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-1">
                    {cat.title}
                  </h2>
                  <p className="text-xs sb-text-secondary mt-0.5">
                    {cat.explanationFr}
                  </p>
                </div>
                <div className="font-mono text-xs sb-surface border rounded-xl px-3 py-1.5 sb-text-reward">
                  Formule : {cat.formula}
                </div>
              </div>

              {/* Items in this category */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {cat.items.map((item, idx) => {
                  const saved = isSavedInWordbank(item.exampleEn);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm sb-text-accent">
                            {item.keyword}
                          </span>
                        </div>
                        <p className="text-xs font-bold sb-text-reward">
                          {item.meaningFr}
                        </p>
                        <p className="text-xs sb-text-muted">{item.ruleFr}</p>
                        <div className="pt-2 border-t sb-divider">
                          <p className="text-xs font-bold sb-text-primary">
                            « {item.exampleEn} »
                          </p>
                          <p className="text-[11px] sb-text-secondary mt-0.5">
                            {item.exampleFr}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t sb-divider">
                        <button
                          type="button"
                          onClick={() =>
                            speakEnglish(item.exampleEn, {
                              accent,
                              rate: speechRate,
                            })
                          }
                          aria-label={`Écouter ${item.exampleEn}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          Audio
                        </button>
                        <button
                          type="button"
                          disabled={saved}
                          onClick={() =>
                            onAddWord({
                              en: item.exampleEn,
                              fr: item.exampleFr,
                              note: cat.title,
                            })
                          }
                          className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                            saved
                              ? 'sb-status-success'
                              : 'sb-chip-idle hover:border-[var(--sb-reward)] hover:sb-text-reward'
                          }`}
                        >
                          {saved ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Golden Tip Callout */}
              <div className="p-3.5 rounded-xl border sb-status-warn text-xs space-y-0.5">
                <div className="font-bold sb-text-reward">À retenir :</div>
                <p className="sb-text-secondary">{cat.goldenTip}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================================
          SECTION 5: SIMULATEUR DE CONJUGAISON INTERACTIF
         ====================================================================== */}
      {currentTab === 'simulator' && (
        <div className="manga-panel p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b sb-divider">
            <div>
              <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Simulateur en direct</span>
              </div>
              <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-0.5">
                Le Labo des 3 Temps (Présent Simple · Continu · Passé)
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Choisis un pronom, un verbe et une forme : observe instantanément comment les terminaisons et auxiliaires s’adaptent !
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl sb-surface-soft border">
            {/* 1. Pronoun Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wide sb-text-accent uppercase">
                1. Sujet / Pronom :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRONOUNS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      playPop();
                      setSelectedPronoun(p);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      selectedPronoun === p ? 'sb-chip-solid' : 'sb-chip-idle'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Verb Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wide sb-text-reward uppercase">
                2. Verbe :
              </label>
              <select
                value={selectedVerbId}
                onChange={(e) => {
                  playPop();
                  setSelectedVerbId(e.target.value);
                }}
                className="w-full p-2 rounded-xl border sb-input text-xs font-bold cursor-pointer"
              >
                {CONJUGATOR_VERBS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.base} ({v.fr})
                  </option>
                ))}
              </select>
              <p className="text-[11px] sb-text-muted">
                {selectedVerb.notes}
              </p>
            </div>

            {/* 3. Polarity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-wide sb-text-primary uppercase">
                3. Forme :
              </label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setSelectedPolarity('affirmative');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    selectedPolarity === 'affirmative'
                      ? 'sb-chip-solid'
                      : 'sb-chip-idle'
                  }`}
                >
                  (+) Affirmatif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setSelectedPolarity('negative');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    selectedPolarity === 'negative'
                      ? 'sb-chip-danger-solid'
                      : 'sb-chip-idle'
                  }`}
                >
                  (−) Négatif
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playPop();
                    setSelectedPolarity('question');
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                    selectedPolarity === 'question'
                      ? 'sb-seg-active-reward'
                      : 'sb-chip-idle'
                  }`}
                >
                  (?) Question
                </button>
              </div>
            </div>
          </div>

          {/* 3-Column Comparative Output */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Present Simple */}
            <div className="p-5 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold sb-text-reward uppercase tracking-wide">
                    Present Simple
                  </span>
                  <span className="text-[11px] sb-text-muted">Habitude</span>
                </div>
                <div className="p-3.5 rounded-xl border sb-surface space-y-1">
                  <p className="text-base font-bold sb-text-primary">
                    {simulated.presentSimple.en}
                  </p>
                  <p className="text-xs sb-text-secondary">
                    {simulated.presentSimple.fr}
                  </p>
                </div>
                <p className="text-[11px] sb-text-muted leading-relaxed">
                  {selectedPronoun === 'He / She'
                    ? selectedPolarity === 'affirmative'
                      ? `Le verbe prend la marque -s : « ${selectedVerb.presentThird} »`
                      : `L’auxiliaire DOES porte le -s : le verbe redevient « ${selectedVerb.base} »`
                    : `Sujet ${selectedPronoun} : base verbale neutre « ${selectedVerb.base} »`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakEnglish(simulated.presentSimple.en, {
                    accent,
                    rate: speechRate,
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Écouter au Present Simple
              </button>
            </div>

            {/* Card 2: Present Continuous */}
            <div className="p-5 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold sb-text-accent uppercase tracking-wide">
                    Present Continuous
                  </span>
                  <span className="text-[11px] sb-text-muted">En ce moment</span>
                </div>
                <div className="p-3.5 rounded-xl border sb-surface space-y-1">
                  <p className="text-base font-bold sb-text-primary">
                    {simulated.presentContinuous.en}
                  </p>
                  <p className="text-xs sb-text-secondary">
                    {simulated.presentContinuous.fr}
                  </p>
                </div>
                <p className="text-[11px] sb-text-muted leading-relaxed">
                  Auxiliaire BE conjugué au présent + participe en -ING « {selectedVerb.presentCont} ».
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakEnglish(simulated.presentContinuous.en, {
                    accent,
                    rate: speechRate,
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Écouter au Present Continuous
              </button>
            </div>

            {/* Card 3: Past Simple */}
            <div className="p-5 rounded-2xl border sb-surface-soft flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--sb-danger)] uppercase tracking-wide">
                    Past Simple (Prétérit)
                  </span>
                  <span className="text-[11px] sb-text-muted">Passé terminé</span>
                </div>
                <div className="p-3.5 rounded-xl border sb-surface space-y-1">
                  <p className="text-base font-bold sb-text-primary">
                    {simulated.pastSimple.en}
                  </p>
                  <p className="text-xs sb-text-secondary">
                    {simulated.pastSimple.fr}
                  </p>
                </div>
                <p className="text-[11px] sb-text-muted leading-relaxed">
                  {selectedPolarity === 'affirmative'
                    ? selectedVerb.isIrregularPast
                      ? `Verbe irrégulier par cœur : « ${selectedVerb.pastSimple} »`
                      : `Verbe régulier terminé par -ED : « ${selectedVerb.pastSimple} »`
                    : `L’auxiliaire DID/DIDN'T absorbe le passé : le verbe redevient « ${selectedVerb.base} »`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  speakEnglish(simulated.pastSimple.en, {
                    accent,
                    rate: speechRate,
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border sb-audio-btn text-xs font-bold cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Écouter au Past Simple
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          SECTION 6: DÉFI QUIZ (12 QUESTIONS)
         ====================================================================== */}
      {currentTab === 'quiz' && (
        <div className="manga-panel p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b sb-divider">
            <div>
              <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[var(--sb-danger)]" />
                <span>Défi Maîtrise des Temps & Expressions</span>
              </div>
              <h2 className="text-xl font-bold tracking-wide sb-text-primary mt-0.5">
                Question <span className="sb-text-accent">{quizIndex + 1} / {TENSES_QUIZ_QUESTIONS.length}</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs font-bold sb-text-reward tabular-nums">
                Score : {totalCorrect} / {TENSES_QUIZ_QUESTIONS.length}
                {quizStreak >= 2 && (
                  <span className="sb-text-success ml-1.5">· Série x{quizStreak}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResetQuiz}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border sb-chip-idle text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Recommencer
              </button>
            </div>
          </div>

          {quizCompleted ? (
            <div className="p-6 rounded-2xl sb-status-success border space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold sb-text-success">
                <Sparkles className="w-6 h-6 sb-text-reward shrink-0" />
                <span>
                  Bravo ! Quiz terminé avec {totalCorrect} / {TENSES_QUIZ_QUESTIONS.length} bonnes réponses (+1 étoile gagnée) !
                </span>
              </div>
              <p className="text-sm sb-text-secondary">
                Tu as consolidé les règles du Present Simple, du Present Continuous, du Past Simple et de l’expression de la durée (for/since/ago).
              </p>
              <button
                type="button"
                onClick={handleResetQuiz}
                className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Rejouer le quiz
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Box */}
              <div className="p-5 rounded-2xl sb-surface-soft border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold sb-text-accent">
                    {currentQuizQ.badge}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(currentQuizQ.completedEn, {
                        accent,
                        rate: speechRate,
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold sb-text-muted hover:sb-text-accent cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Indice audio
                  </button>
                </div>
                <p className="text-sm font-semibold sb-text-secondary">
                  {currentQuizQ.promptFr}
                </p>
                <p className="text-xl font-bold sb-text-primary">
                  {currentQuizQ.sentenceWithBlank}
                </p>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuizQ.options.map((opt, idx) => {
                  const isPicked = userChoice === idx;
                  const isRightOption = idx === currentQuizQ.correctIndex;

                  let styleClass = 'sb-card-option cursor-pointer';
                  let markerClass = 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-hover-accent)]';
                  if (isQuestionAnswered) {
                    if (isRightOption) {
                      styleClass = 'sb-status-success border-b-4 border-b-[var(--sb-success-3d)] cursor-default';
                      markerClass = 'bg-[var(--sb-success)]';
                    } else if (isPicked) {
                      styleClass = 'sb-status-danger border-b-4 border-b-[var(--sb-danger-3d)] cursor-default';
                      markerClass = 'bg-[var(--sb-danger)]';
                    } else {
                      styleClass = 'sb-card-used cursor-default';
                      markerClass = 'bg-[var(--sb-text-used)]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isQuestionAnswered}
                      onClick={() => handleQuizAnswer(idx)}
                      className={`group w-full p-4 rounded-2xl border border-b-4 text-left text-sm font-bold flex items-center justify-between gap-3 transition-all ${styleClass}`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={`w-2.5 h-2.5 rotate-45 shrink-0 ${markerClass}`}
                        />
                        <span className="font-mono text-xs font-bold sb-text-accent">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <span>{opt}</span>
                      </span>

                      {isQuestionAnswered && isRightOption && (
                        <CheckCircle2 className="w-4 h-4 sb-text-success shrink-0" />
                      )}
                      {isQuestionAnswered && isPicked && !isRightOption && (
                        <XCircle className="w-4 h-4 sb-text-danger shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Explanation & Next Button */}
              {isQuestionAnswered && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl sb-surface-soft border">
                  <div className="space-y-0.5 max-w-xl">
                    <div className="text-sm font-bold sb-text-primary">
                      {isQuizCorrect ? 'Exact !' : 'À retenir :'} « {currentQuizQ.completedEn} »
                    </div>
                    <p className="text-xs sb-text-secondary">
                      {currentQuizQ.explanationFr}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (quizIndex + 1 < TENSES_QUIZ_QUESTIONS.length) {
                        setQuizIndex((i) => i + 1);
                      }
                    }}
                    className="manga-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    Question suivante
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
