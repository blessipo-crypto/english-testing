import { useMemo, useState } from 'react';
import {
  Volume2,
  Eye,
  EyeOff,
  BookmarkPlus,
  Check,
  Search,
  BookMarked,
  Zap,
  Printer,
  Share2,
} from 'lucide-react';
import {
  IRREGULAR_VERBS,
  MODAL_GUIDES,
  PLACE_PREPOSITIONS,
  TENSE_GUIDES,
  TIME_PREPOSITIONS,
  type PlacePrepositionItem,
} from '../data/grammarData';
import type { GrammarSection, VoiceAccent, WordbankItem } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

import { TensesModule } from './TensesModule';

interface GrammarGuideModuleProps {
  section: GrammarSection;
  hideIrregularForms: boolean;
  accent: VoiceAccent;
  speechRate: number;
  wordbank: WordbankItem[];
  onChangeSection: (section: GrammarSection) => void;
  onToggleHideIrregular: () => void;
  onAddWord: (item: Omit<WordbankItem, 'id' | 'addedAt'>) => void;
  onOpenTensesModule?: (
    tab?: 'present-simple' | 'present-continuous' | 'past-simple' | 'expressions'
  ) => void;
}

const GUIDE_SECTIONS: Array<{ id: GrammarSection; label: string }> = [
  { id: 'irregular', label: '📋 Verbes irréguliers' },
  { id: 'conjugation', label: '⚡ Conjugaison & Simulateur' },
  { id: 'modals', label: '🛡️ Les Modaux' },
  { id: 'tenses', label: '📖 Temps simples' },
  { id: 'prepositions', label: '📍 Toutes les Prépositions' },
  { id: 'mnemonics', label: '🧠 Astuces Mnémotechniques' },
  { id: 'french', label: '🇫🇷 Phrases en Français' },
];

function PrepositionDiagram({ type }: { type: PlacePrepositionItem['visualType'] }) {
  return (
    <svg
      viewBox="0 0 120 64"
      className="w-28 h-16 shrink-0"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="112"
        height="56"
        rx="10"
        fill="var(--sb-bg-surface)"
        stroke="var(--sb-accent)"
        strokeOpacity="0.45"
      />
      {type === 'in' && (
        <>
          <rect x="38" y="20" width="44" height="30" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="60" cy="36" r="8" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
      {type === 'on' && (
        <>
          <rect x="38" y="30" width="44" height="22" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="60" cy="21" r="8" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
      {type === 'under' && (
        <>
          <rect x="36" y="14" width="48" height="16" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="60" cy="43" r="8" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
      {type === 'next_to' && (
        <>
          <rect x="28" y="22" width="32" height="26" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="78" cy="36" r="8" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
      {type === 'between' && (
        <>
          <rect x="16" y="22" width="24" height="26" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="60" cy="36" r="8" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
          <rect x="80" y="22" width="24" height="26" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
        </>
      )}
      {type === 'behind' && (
        <>
          <circle cx="72" cy="26" r="9" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
          <rect x="36" y="24" width="36" height="26" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
        </>
      )}
      {type === 'in_front_of' && (
        <>
          <rect x="44" y="18" width="38" height="28" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <circle cx="52" cy="38" r="9" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
      {type === 'opposite' && (
        <>
          <rect x="18" y="22" width="22" height="24" rx="4" fill="var(--sb-diagram-box)" stroke="var(--sb-accent)" strokeWidth="1.5" />
          <line x1="60" y1="14" x2="60" y2="50" stroke="var(--sb-reward)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="88" cy="34" r="9" fill="var(--sb-diagram-dot)" stroke="var(--sb-diagram-dot-stroke)" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}

const MNEMONIC_QUIZ_QUESTIONS = [
  {
    question: "Quel est l'acronyme magique pour retenir l'ordre des adjectifs avant un nom en anglais ?",
    options: [
      "OSASCOMP (Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose)",
      "ABCDE (Adjective, Before, Color, Dimension, Expression)",
      "SPACETIME (Subject, Pronoun, Adverb, Conjunction, Time, Interjection)",
      "WH-HOW (Who, What, Where, When, Why, How)"
    ],
    correctIndex: 0,
    explanation: "OSASCOMP permet de ranger les adjectifs dans le bon ordre (ex: A nice big red car)."
  },
  {
    question: "Au présent simple, pourquoi dit-on que He, She et It sont des 'super-héros' ?",
    options: [
      "Parce qu'ils portent toujours un -S sur leur costume (He plays, She eats)",
      "Parce qu'ils peuvent voler au-dessus de tous les verbes irréguliers",
      "Parce qu'ils n'ont jamais besoin d'auxiliaire de toute leur vie",
      "Parce qu'ils changent d'orthographe à chaque phrase"
    ],
    correctIndex: 0,
    explanation: "Le -S est leur costume de super-héros ! Dès que 'Does/Doesn't' arrive, c'est lui qui le vole."
  },
  {
    question: "À quoi correspondent les '5 W + H' pour poser des questions ?",
    options: [
      "Who, What, Where, When, Why + How",
      "Walk, Work, Write, Watch, Win + Hear",
      "Water, Wind, Wood, Wool, Wall + House",
      "Want, Would, Will, Was, Were + Have"
    ],
    correctIndex: 0,
    explanation: "Presque tous les mots interrogatifs commencent par WH, accompagnés de How."
  },
  {
    question: "Dans la règle de l'entonnoir pour les prépositions de temps (IN / ON / AT), comment va-t-on du plus large au plus précis ?",
    options: [
      "IN (longues périodes) → ON (jour précis) → AT (heure exacte)",
      "AT (longues périodes) → ON (mois) → IN (heure exacte)",
      "ON (toujours en premier) → IN → AT",
      "Il n'y a pas d'ordre logique"
    ],
    correctIndex: 0,
    explanation: "L'entonnoir va du plus large (IN) au plus précis (AT) en passant par le jour précis (ON)."
  },
  {
    question: "Pourquoi utilise-t-on l'image du sandwich pour le présent en cours (Be + V-ing) ?",
    options: [
      "Parce qu'on fait un sandwich avec BE (pain du haut) et -ING (pain du bas) autour du verbe",
      "Parce qu'on mange un sandwich en conjuguant",
      "Parce que le verbe est coincé entre deux tranches de pain",
      "Parce que c'est une recette de cuisine traditionnelle"
    ],
    correctIndex: 0,
    explanation: "Si on oublie le pain du haut (am/is/are) ou du bas (-ing), le sandwich s'effondre !"
  }
];

export function GrammarGuideModule({
  section,
  hideIrregularForms,
  accent,
  speechRate,
  wordbank,
  onChangeSection,
  onToggleHideIrregular,
  onAddWord,
  onOpenTensesModule,
}: GrammarGuideModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('Tous');
  const [revealedVerbIds, setRevealedVerbIds] = useState<string[]>([]);
  const [irregularSubTab, setIrregularSubTab] = useState<'list' | 'synthesis'>('list');
  const [showPrintableModal, setShowPrintableModal] = useState(false);
  const [mnemonicSubTab, setMnemonicSubTab] = useState<'sheets' | 'quiz'>('sheets');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const handleShareWhatsApp = () => {
    const text = `🧠 *Fiches Mnémotechniques Anglais (6e & 5e)*\n\n` +
      `1️⃣ *OSASCOMP (Adjectifs)*: Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose. (Ex: A nice big red car)\n\n` +
      `2️⃣ *Super-Héros (3e personne)*: He/She/It portent toujours un S. Si DOES/DOESN'T arrive, c'est lui qui vole le S !\n\n` +
      `3️⃣ *5 W + H (Questions)*: Who, What, Where, When, Why + How.\n\n` +
      `4️⃣ *Entonnoir (IN/ON/AT)*: IN (longues périodes) -> ON (jour précis) -> AT (heure exacte).\n\n` +
      `5️⃣ *Sandwich (Be + V-ing)*: [BE] + [Verbe] + [-ING]. Si on oublie un pain, le sandwich s'effondre !\n\n` +
      `📖 Retrouvez toutes les fiches interactives sur l'application !`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredVerbs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return IRREGULAR_VERBS.filter((v) => {
      const matchesGroup = groupFilter === 'Tous' || v.group === groupFilter;
      const matchesQuery =
        !q ||
        v.base.toLowerCase().includes(q) ||
        v.past.toLowerCase().includes(q) ||
        v.fr.toLowerCase().includes(q);
      return matchesGroup && matchesQuery;
    });
  }, [searchQuery, groupFilter]);

  const toggleRevealVerb = (id: string) => {
    setRevealedVerbIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isSavedInWordbank = (term: string) =>
    wordbank.some((w) => w.en.toLowerCase() === term.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header + Sub-Section Tabs */}
      <div className="manga-panel p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold tracking-wide sb-text-accent flex items-center gap-2">
            <BookMarked className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
            <span>Guide pratique de référence · Niveau A1–A2 (11 ans)</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-wide sb-text-primary">
            Fiches de grammaire interactives avec audio
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 sb-seg-track border rounded-2xl self-start lg:self-auto">
          {GUIDE_SECTIONS.map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeSection(tab.id)}
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

      {/* SECTION: CONJUGATION & TENSES MODULE */}
      {section === 'conjugation' && (
        <TensesModule
          accent={accent}
          speechRate={speechRate}
          wordbank={wordbank}
          onAddWord={onAddWord}
          onAwardStar={() => {}}
        />
      )}

      {/* SECTION 1: IRREGULAR VERBS */}
      {section === 'irregular' && (
        <div className="manga-panel p-5 lg:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                Verbes irréguliers &amp; Synthèse de formation ({filteredVerbs.length})
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Consulte la liste interactive ou bascule sur la synthèse et les fiches mnémotechniques.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIrregularSubTab(irregularSubTab === 'list' ? 'synthesis' : 'list')}
                className="manga-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide cursor-pointer"
              >
                {irregularSubTab === 'list' ? '🧠 Synthèse & Mnémotechniques' : '📋 Liste Interactive'}
              </button>
            </div>
          </div>

          {/* Sub-tab switcher */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b sb-divider">
            <button
              type="button"
              onClick={() => setIrregularSubTab('list')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                irregularSubTab === 'list' ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              📋 Liste &amp; Familles de verbes
            </button>
            <button
              type="button"
              onClick={() => setIrregularSubTab('synthesis')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                irregularSubTab === 'synthesis' ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              🧠 Synthèse de formation &amp; Fiches mnémotechniques
            </button>
          </div>

          {irregularSubTab === 'synthesis' ? (
            <div className="space-y-6">
              {/* Synthesis Card: Formation des 3 Formes */}
              <div className="p-5 rounded-2xl sb-surface-soft border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold sb-text-primary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--sb-accent)]" />
                    Synthèse : La formation des 3 formes en anglais
                  </h3>
                  <button
                    type="button"
                    onClick={() => speakEnglish('Base form, past simple, past participle. Go, went, gone.', { accent, rate: speechRate })}
                    className="p-1.5 rounded-lg border sb-audio-btn cursor-pointer"
                    aria-label="Écouter la synthèse des 3 formes"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl sb-surface border space-y-1">
                    <div className="font-bold sb-text-accent">1. Base Verbale (V1)</div>
                    <p className="sb-text-secondary">
                      Le verbe d’origine (ex : <em>go</em>, <em>eat</em>, <em>be</em>). Utilisé au présent simple (avec he/she/it + s) et avec les modaux (<em>can go</em>).
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl sb-surface border space-y-1">
                    <div className="font-bold sb-text-reward">2. Prétérit / Past Simple (V2)</div>
                    <p className="sb-text-secondary">
                      Pour une action passée et terminée (ex : <em>went</em>, <em>ate</em>, <em>was/were</em>). Pour les réguliers on ajoute <em>-ed</em>, pour les irréguliers on prend la 2e colonne.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl sb-surface border space-y-1">
                    <div className="font-bold sb-text-success">3. Participe Passé (V3)</div>
                    <p className="sb-text-secondary">
                      Utilisé avec l’auxiliaire <em>have</em> (Present Perfect : <em>I have eaten</em>) ou pour la voix passive (<em>It was written</em>). 3e colonne des irréguliers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mnemonic Cheat Sheets for Each Irregular Category */}
              <div className="space-y-4">
                <h3 className="text-base font-bold sb-text-primary">
                  Fiches Mnémotechniques &amp; Astuces de mémorisation par famille
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mnemonic 1 */}
                  <div className="p-4 rounded-2xl border sb-surface-soft space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold sb-text-reward px-2.5 py-0.5 rounded-lg border sb-reward-pill">
                        Famille 1 : Les Sosies (Identiques AAA)
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglish('Put, put, put. Read, read, read.', { accent, rate: speechRate })}
                        className="p-1 rounded sb-audio-btn cursor-pointer"
                        aria-label="Écouter l'exemple"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-sm font-bold sb-text-primary">
                      « Le costume magique qui ne change jamais »
                    </div>
                    <p className="text-xs sb-text-secondary leading-relaxed">
                      Ces verbes gardent exactement la même orthographe et la même prononciation aux 3 temps.
                      Exemples : <strong>put → put → put</strong> (poser), <strong>read → read → read</strong> (lire — <em>attention, read se prononce "red" au passé !</em>).
                    </p>
                    <div className="text-[11px] sb-text-muted italic">
                      💡 Astuce : Pas besoin d'apprendre 3 mots, un seul suffit !
                    </div>
                  </div>

                  {/* Mnemonic 2 */}
                  <div className="p-4 rounded-2xl border sb-surface-soft space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold sb-text-accent px-2.5 py-0.5 rounded-lg border sb-chip-active">
                        Famille 2 : La Gamme des Voyelles (ABC)
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglish('Drink, drank, drunk. Swim, swam, swum.', { accent, rate: speechRate })}
                        className="p-1 rounded sb-audio-btn cursor-pointer"
                        aria-label="Écouter l'exemple"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-sm font-bold sb-text-primary">
                      « La mélodie I → A → U »
                    </div>
                    <p className="text-xs sb-text-secondary leading-relaxed">
                      Beaucoup de verbes changent leur voyelle centrale selon un rythme musical en trois temps :
                      <strong>I</strong> (présent) → <strong>A</strong> (prétérit) → <strong>U</strong> (participe).
                      Ex : <em>drink → drank → drunk</em>, <em>sing → sang → sung</em>, <em>swim → swam → swum</em>.
                    </p>
                    <div className="text-[11px] sb-text-muted italic">
                      💡 Astuce : Chante-les comme une gamme de musique !
                    </div>
                  </div>

                  {/* Mnemonic 3 */}
                  <div className="p-4 rounded-2xl border sb-surface-soft space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold sb-text-success px-2.5 py-0.5 rounded-lg border sb-status-success">
                        Famille 3 : Le Clan en -ought / -aught
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglish('Buy, bought, bought. Catch, caught, caught.', { accent, rate: speechRate })}
                        className="p-1 rounded sb-audio-btn cursor-pointer"
                        aria-label="Écouter l'exemple"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-sm font-bold sb-text-primary">
                      « La remorque magique -ought / -aught »
                    </div>
                    <p className="text-xs sb-text-secondary leading-relaxed">
                      Quand on achète (<em>buy → bought</em>), qu'on pense (<em>think → thought</em>) ou qu'on attrape (<em>catch → caught</em>),
                      le prétérit et le participe passé se ressemblent comme deux frères et finissent par la même terminaison sonore.
                    </p>
                    <div className="text-[11px] sb-text-muted italic">
                      💡 Astuce : Retiens que le « gh » est muet.
                    </div>
                  </div>

                  {/* Mnemonic 4 */}
                  <div className="p-4 rounded-2xl border sb-surface-soft space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-400 px-2.5 py-0.5 rounded-lg border border-pink-400/40 bg-pink-400/10">
                        Famille 4 : Les Voyageurs (Être &amp; Aller)
                      </span>
                      <button
                        type="button"
                        onClick={() => speakEnglish('Be, was, been. Go, went, gone.', { accent, rate: speechRate })}
                        className="p-1 rounded sb-audio-btn cursor-pointer"
                        aria-label="Écouter l'exemple"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-sm font-bold sb-text-primary">
                      « Les superstars qu'on utilise tous les jours »
                    </div>
                    <p className="text-xs sb-text-secondary leading-relaxed">
                      <strong>Be</strong> (<em>was/were → been</em>) et <strong>Go</strong> (<em>went → gone</em>) n'obéissent à aucune règle car ce sont les plus anciens.
                      Attention à <em>go</em> dont le passé <em>went</em> vient d'un autre verbe !
                    </p>
                    <div className="text-[11px] sb-text-muted italic">
                      💡 Astuce : Dis-les à voix haute 3 fois par jour pour ne plus jamais hésiter.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 sb-text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Chercher un verbe..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border sb-input text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRevealedVerbIds([]);
                    onToggleHideIrregular();
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    hideIrregularForms ? 'sb-reward-pill' : 'sb-chip-idle'
                  }`}
                >
                  {hideIrregularForms ? (
                    <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {hideIrregularForms ? 'Mode Quiz actif' : 'Masquer le passé'}
                </button>
              </div>

              {/* Family filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'Tous',
                  'Très fréquents',
                  'Changement voyelle',
                  'Fin en -ought/-aught',
                  'Identiques',
                ].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setGroupFilter(grp)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      groupFilter === grp ? 'sb-chip-solid' : 'sb-chip-idle'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Clean Table */}
              <div className="overflow-x-auto border sb-surface-soft rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="sb-surface border-b sb-divider text-xs font-bold tracking-wide sb-text-accent">
                      <th className="py-3 px-4">Base verbale</th>
                      <th className="py-3 px-4">Prétérit (Past)</th>
                      <th className="py-3 px-4">Participe passé</th>
                      <th className="py-3 px-4">Sens en français</th>
                      <th className="py-3 px-4">Exemple</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y sb-divide text-sm">
                    {filteredVerbs.map((verb) => {
                      const isHidden =
                        hideIrregularForms && !revealedVerbIds.includes(verb.id);
                      const saved = isSavedInWordbank(
                        `${verb.base} → ${verb.past.split(' ')[0]}`
                      );

                      return (
                        <tr key={verb.id} className="hover:bg-[var(--sb-accent-soft)] transition-colors">
                          <td className="py-3 px-4 font-bold sb-text-primary">
                            {verb.base}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs sb-text-reward font-bold">
                            {isHidden ? (
                              <button
                                type="button"
                                onClick={() => toggleRevealVerb(verb.id)}
                                className="px-2.5 py-1 rounded-lg border sb-reward-btn font-sans text-xs font-bold cursor-pointer"
                              >
                                Révéler
                              </button>
                            ) : (
                              verb.past
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs sb-text-secondary">
                            {isHidden ? '•••' : verb.participle}
                          </td>
                          <td className="py-3 px-4 sb-text-secondary">{verb.fr}</td>
                          <td className="py-3 px-4 text-xs sb-text-muted max-w-xs">
                            {verb.exampleEn}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  speakEnglish(
                                    `${verb.base}, ${verb.past.replace(/\(.*?\)/g, '')}, ${verb.participle.replace(/\(.*?\)/g, '')}`,
                                    { accent, rate: speechRate }
                                  )
                                }
                                aria-label={`Écouter les 3 formes de ${verb.base}`}
                                className="p-1.5 rounded-lg border sb-audio-btn cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={saved}
                                onClick={() =>
                                  onAddWord({
                                    en: `${verb.base} → ${verb.past.split(' ')[0]}`,
                                    fr: verb.fr,
                                    note: `${verb.base} / ${verb.past} / ${verb.participle}`,
                                  })
                                }
                                aria-label={`Ajouter ${verb.base} au carnet`}
                                className={`p-1.5 rounded-lg border ${
                                  saved
                                    ? 'sb-status-success cursor-default'
                                    : 'sb-chip-idle hover:border-[var(--sb-reward)] hover:sb-text-reward cursor-pointer'
                                }`}
                              >
                                {saved ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <BookmarkPlus className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: MODALS */}
      {section === 'modals' && (
        <div className="space-y-5">
          {/* Golden Rule Banner */}
          <div className="manga-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold tracking-wide sb-text-reward">
                La règle d’or des auxiliaires modaux
              </div>
              <p className="text-sm sb-text-secondary">
                Un modal ne change <strong>jamais</strong> (pas de <span className="font-mono sb-text-accent">-s</span> à he/she/it)
                et il est toujours suivi d’un verbe sans <span className="font-mono sb-text-accent">to</span> (sauf <em>would like to</em>).
              </p>
            </div>
            <div className="font-mono text-xs sb-surface border rounded-xl px-3.5 py-2 sb-text-accent shrink-0">
              She <strong className="sb-text-reward">can</strong> swim (jamais <em>cans</em> / <em>can to</em>)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODAL_GUIDES.map((m) => (
              <article
                key={m.id}
                className="manga-panel p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="flex items-baseline gap-2.5">
                      <h3 className="text-xl font-bold tracking-wide sb-text-primary">
                        {m.modal}
                      </h3>
                      <span className="font-mono text-xs sb-text-muted">
                        Négatif : {m.negative}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        speakEnglish(m.exampleEn, { accent, rate: speechRate })
                      }
                      aria-label={`Écouter l'exemple avec ${m.modal}`}
                      className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm font-bold sb-text-reward">
                    {m.meaningFr}
                  </p>
                  <p className="text-xs sb-text-secondary leading-relaxed">
                    {m.usageFr}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border sb-surface-soft space-y-1">
                  <p className="text-sm font-semibold sb-text-primary">
                    “{m.exampleEn}”
                  </p>
                  <p className="text-xs sb-text-muted">{m.exampleFr}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SIMPLE TENSES */}
      {section === 'tenses' && (
        <div className="space-y-5">
          {onOpenTensesModule && (
            <div className="manga-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[var(--sb-accent)]">
              <div className="space-y-1">
                <div className="text-xs font-bold tracking-wide sb-text-reward flex items-center gap-2">
                  <Zap className="w-4 h-4 fill-current shrink-0" />
                  <span>Module interactif dédié disponible</span>
                </div>
                <h3 className="text-base font-bold sb-text-primary">
                  Formation complète : Present Simple, Present Continuous, Prétérit &amp; Expressions de durée (FOR, SINCE, AGO)
                </h3>
                <p className="text-xs sb-text-secondary">
                  Retrouve les règles détaillées pas à pas, les fiches d’orthographe (-s, -ing, -ed), le simulateur en direct et le quiz d’entraînement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenTensesModule()}
                className="manga-btn-primary px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ouvrir la Formation des Temps →
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {TENSE_GUIDES.map((t) => (
            <article
              key={t.id}
              className="manga-panel p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <div className="text-xs sb-text-accent font-bold tracking-wide">
                    {t.titleEn}
                  </div>
                  <h2 className="text-lg font-bold tracking-wide sb-text-primary mt-0.5">
                    {t.titleFr}
                  </h2>
                  <p className="text-xs sb-text-muted mt-1">{t.whenFr}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    speakEnglish(t.affirmative, { accent, rate: speechRate })
                  }
                  aria-label={`Écouter l'exemple au ${t.titleEn}`}
                  className="manga-btn-primary p-2 rounded-xl shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-mono sb-surface border rounded-xl px-3 py-2 sb-text-reward">
                Formule : {t.formula}
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold sb-text-success mr-2">
                      (+) Affirmatif :
                    </span>
                    <span className="font-semibold sb-text-primary">
                      {t.affirmative}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(t.affirmative, { accent, rate: speechRate })
                    }
                    aria-label="Écouter la forme affirmative"
                    className="sb-text-accent hover:opacity-80 p-1 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold sb-text-danger mr-2">
                      (−) Négatif :
                    </span>
                    <span className="font-semibold sb-text-secondary">
                      {t.negative}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(t.negative, { accent, rate: speechRate })
                    }
                    aria-label="Écouter la forme négative"
                    className="sb-text-accent hover:opacity-80 p-1 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold sb-text-accent mr-2">
                      (?) Question :
                    </span>
                    <span className="font-semibold sb-text-secondary">
                      {t.question}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(t.question, { accent, rate: speechRate })
                    }
                    aria-label="Écouter la question"
                    className="sb-text-accent hover:opacity-80 p-1 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t sb-divider text-xs sb-text-muted">
                Mots indices :{' '}
                <span className="font-mono sb-text-secondary">{t.markers}</span>
              </div>
            </article>
          ))}
          </div>
        </div>
      )}

      {/* SECTION 4: PREPOSITIONS OF TIME & PLACE */}
      {section === 'prepositions' && (
        <div className="space-y-6">
          {/* Time Prepositions: AT / ON / IN */}
          <section className="manga-panel p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                1. Prépositions de temps : AT · ON · IN
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Astuce : du plus précis (<span className="font-mono sb-text-reward">AT</span> l’heure) au plus large (<span className="font-mono sb-text-accent">IN</span> le mois ou l’année).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TIME_PREPOSITIONS.map((tp) => (
                <div
                  key={tp.id}
                  className="p-4 rounded-2xl border sb-surface-soft space-y-3"
                >
                  <div>
                    <span className="text-lg font-bold font-mono sb-text-reward">
                      {tp.prep}
                    </span>
                    <p className="text-xs font-bold sb-text-secondary mt-0.5">
                      {tp.scopeFr}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {tp.examplesEn.map((ex, i) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() =>
                          speakEnglish(ex, { accent, rate: speechRate })
                        }
                        className="w-full p-2.5 rounded-xl border border-b-2 sb-card-option text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold sb-text-primary">
                            {ex}
                          </div>
                          <div className="text-[11px] sb-text-muted">
                            {tp.examplesFr[i]}
                          </div>
                        </div>
                        <Volume2
                          className="w-3.5 h-3.5 sb-text-accent shrink-0"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Place Prepositions with Spatial Diagrams */}
          <section className="manga-panel p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                2. Prépositions de lieu (où se trouve le point indigo ?)
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Clique sur une carte pour entendre la préposition et son exemple en anglais.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLACE_PREPOSITIONS.map((pp) => (
                <button
                  key={pp.id}
                  type="button"
                  onClick={() =>
                    speakEnglish(`${pp.en}. ${pp.exampleEn}`, {
                      accent,
                      rate: speechRate,
                    })
                  }
                  className="p-4 rounded-2xl border border-b-4 sb-card-option text-left space-y-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <PrepositionDiagram type={pp.visualType} />
                    <Volume2
                      className="w-4 h-4 sb-text-accent shrink-0"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold sb-text-primary">
                        {pp.en}
                      </span>
                      <span className="text-xs font-bold sb-text-reward">
                        {pp.fr}
                      </span>
                    </div>
                    <p className="text-xs sb-text-secondary mt-1 leading-relaxed">
                      {pp.exampleEn}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* SECTION 5: MNEMONIC CHEAT SHEETS (6e & 5e) */}
      {section === 'mnemonics' && (
        <div className="space-y-6">
          <div className="manga-panel p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-wide sb-text-primary">
                  🧠 Astuces mnémotechniques clés (6e &amp; 5e)
                </h2>
                <p className="text-xs sb-text-secondary leading-relaxed mt-1">
                  Des petits trucs rigolos et visuels pour retenir définitivement les règles essentielles de grammaire anglaise sans effort !
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrintableModal(true)}
                  className="manga-btn-primary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Version Imprimable / Pense-bête</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-tab switcher: Fiches vs Quiz */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b sb-divider">
            <button
              type="button"
              onClick={() => setMnemonicSubTab('sheets')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                mnemonicSubTab === 'sheets' ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              📖 Fiches &amp; Astuces Visuelles
            </button>
            <button
              type="button"
              onClick={() => {
                setMnemonicSubTab('quiz');
                setQuizIndex(0);
                setQuizScore(0);
                setSelectedAnswer(null);
                setShowQuizResult(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                mnemonicSubTab === 'quiz' ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              🎯 Mini-Quiz Mnémotechnique ({MNEMONIC_QUIZ_QUESTIONS.length} questions)
            </button>
          </div>

          {mnemonicSubTab === 'sheets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: OSASCOMP */}
            <div className="manga-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold sb-text-reward px-2.5 py-0.5 rounded-lg border sb-reward-pill">
                    Règle 1 · Adjectifs
                  </span>
                  <h3 className="text-lg font-bold tracking-wide sb-text-primary mt-1">
                    L’ordre des adjectifs : la règle « OSASCOMP »
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('A nice big red car.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter l'exemple"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                Pour placer plusieurs adjectifs devant un nom, retiens cet acronyme magique :
                <br />
                <strong>O</strong>pinion, <strong>S</strong>ize (taille), <strong>A</strong>ge, <strong>S</strong>hape (forme), <strong>C</strong>olour, <strong>O</strong>rigin, <strong>M</strong>aterial, <strong>P</strong>urpose (usage).
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono sb-text-accent">
                Exemple : A <strong>nice</strong> (O) <strong>big</strong> (S) <strong>red</strong> (C) car.
              </div>
            </div>

            {/* Card 2: Super-Héros */}
            <div className="manga-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold sb-text-accent px-2.5 py-0.5 rounded-lg border sb-chip-active">
                    Règle 2 · Présent Simple
                  </span>
                  <h3 className="text-lg font-bold tracking-wide sb-text-primary mt-1">
                    Le « S » de la 3e personne : la règle du « Super-Héros »
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('He plays football. Does he play?', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter l'exemple"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                Au présent simple, <strong>He</strong>, <strong>She</strong> et <strong>It</strong> sont des super-héros : ils portent toujours un <strong>S</strong> sur leur costume (<em>He plays, She eats</em>).
                <br />
                Dès que l’auxiliaire <strong>Does</strong> ou <strong>Doesn’t</strong> arrive, c’est lui qui vole le S (<em>Does he play?</em>).
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono sb-text-reward">
                « Le S ne peut pas être à deux endroits en même temps ! »
              </div>
            </div>

            {/* Card 3: 5W + H */}
            <div className="manga-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold sb-text-success px-2.5 py-0.5 rounded-lg border sb-status-success">
                    Règle 3 · Questions
                  </span>
                  <h3 className="text-lg font-bold tracking-wide sb-text-primary mt-1">
                    Les mots interrogatifs : les « 5 W + H »
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('Who, what, where, when, why, how.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter les mots interrogatifs"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                Presque tous les mots pour questionner commencent par <strong>WH</strong> :
                <br />
                <strong>Who</strong> (qui), <strong>What</strong> (quoi), <strong>Where</strong> (où), <strong>When</strong> (quand), <strong>Why</strong> (pourquoi), accompagnés de <strong>How</strong> (comment).
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono sb-text-primary">
                5 W (Who, What, Where, When, Why) + 1 H (How)
              </div>
            </div>

            {/* Card 4: L'entonnoir IN / ON / AT */}
            <div className="manga-panel p-6 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-purple-400 px-2.5 py-0.5 rounded-lg border border-purple-400/40 bg-purple-400/10">
                    Règle 4 · Temps
                  </span>
                  <h3 className="text-lg font-bold tracking-wide sb-text-primary mt-1">
                    Les prépositions de temps (IN / ON / AT) : l’entonnoir
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('In July, on Monday, at 8 o clock.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter l'exemple"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                On va du plus large au plus précis comme dans un entonnoir :
                <br />
                • <strong>IN</strong> pour les longues périodes (mois, années, saisons).
                <br />
                • <strong>ON</strong> pour un jour précis (<em>on Monday</em>).
                <br />
                • <strong>AT</strong> pour l’heure exacte (<em>at 8 o’clock</em>).
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono sb-text-reward">
                Grand (IN) → Moyen (ON) → Point exact (AT)
              </div>
            </div>

            {/* Card 5: Le sandwich Be + V-ing */}
            <div className="manga-panel p-6 space-y-4 md:col-span-2">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-pink-400 px-2.5 py-0.5 rounded-lg border border-pink-400/40 bg-pink-400/10">
                    Règle 5 · Présent en cours
                  </span>
                  <h3 className="text-lg font-bold tracking-wide sb-text-primary mt-1">
                    Be + V-ing (présent en cours) : l’image du sandwich
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('I am eating a delicious sandwich.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter l'exemple"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary leading-relaxed">
                Pour dire ce qu’on est en train de faire, on fait un sandwich avec l’auxiliaire <strong>BE</strong> (<em>am / is / are</em>) comme pain du haut, et <strong>-ING</strong> comme pain du bas autour du verbe (<em>I am eating</em>).
                <br />
                Si on oublie le pain du haut (<em>am</em>) ou du bas (<em>-ing</em>), le sandwich s’effondre !
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono sb-text-success">
                🥪 [BE (am/is/are)] + [Verbe] + [-ING] = La phrase parfaite !
              </div>
            </div>
            </div>
          ) : (
            <div className="manga-panel p-6 lg:p-8 space-y-6 max-w-2xl mx-auto">
              {showQuizResult ? (
                <div className="text-center space-y-5 py-6">
                  <div className="inline-flex p-4 rounded-full bg-[var(--sb-reward-soft)] sb-text-reward text-3xl font-bold">
                    🏆
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold sb-text-primary">
                      Quiz Mnémotechnique terminé !
                    </h3>
                    <p className="text-sm sb-text-secondary">
                      Ton score : <strong className="sb-text-accent text-lg">{quizScore} / {MNEMONIC_QUIZ_QUESTIONS.length}</strong>
                    </p>
                    <p className="text-xs sb-text-muted">
                      {quizScore === MNEMONIC_QUIZ_QUESTIONS.length
                        ? "Parfait ! Tu maîtrises toutes les astuces mnémotechniques sur le bout des doigts !"
                        : "Bien joué ! Relis les fiches mnémotechniques pour perfectionner ton score."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setQuizIndex(0);
                      setQuizScore(0);
                      setSelectedAnswer(null);
                      setShowQuizResult(false);
                    }}
                    className="manga-btn-primary px-6 py-3 rounded-2xl text-xs font-bold cursor-pointer"
                  >
                    Recommencer le Quiz 🔄
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b sb-divider">
                    <span className="text-xs font-bold sb-text-accent px-3 py-1 rounded-full border sb-chip-active">
                      Question {quizIndex + 1} sur {MNEMONIC_QUIZ_QUESTIONS.length}
                    </span>
                    <span className="text-xs font-mono sb-text-muted">
                      Score : {quizScore} pts
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold sb-text-primary leading-snug">
                      {MNEMONIC_QUIZ_QUESTIONS[quizIndex].question}
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {MNEMONIC_QUIZ_QUESTIONS[quizIndex].options.map((option, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect = idx === MNEMONIC_QUIZ_QUESTIONS[quizIndex].correctIndex;
                      let btnStyle = 'sb-card-option border-b-2';
                      if (selectedAnswer !== null) {
                        if (isCorrect) {
                          btnStyle = 'sb-status-success border-2 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400';
                        }
                      }

                      return (
                        <button
                          key={option}
                          type="button"
                          disabled={selectedAnswer !== null}
                          onClick={() => {
                            setSelectedAnswer(idx);
                            if (idx === MNEMONIC_QUIZ_QUESTIONS[quizIndex].correctIndex) {
                              setQuizScore((prev) => prev + 1);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition-all cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{option}</span>
                            {selectedAnswer !== null && isCorrect && (
                              <Check className="w-4 h-4 sb-text-success shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswer !== null && (
                    <div className="space-y-4 pt-3 border-t sb-divider animate-fadeIn">
                      <div className="p-3.5 rounded-xl sb-surface-soft border text-xs space-y-1">
                        <div className="font-bold sb-text-accent">💡 Explication :</div>
                        <p className="sb-text-secondary leading-relaxed">
                          {MNEMONIC_QUIZ_QUESTIONS[quizIndex].explanation}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAnswer(null);
                            if (quizIndex + 1 < MNEMONIC_QUIZ_QUESTIONS.length) {
                              setQuizIndex((prev) => prev + 1);
                            } else {
                              setShowQuizResult(true);
                            }
                          }}
                          className="manga-btn-primary px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {quizIndex + 1 < MNEMONIC_QUIZ_QUESTIONS.length ? 'Question suivante →' : 'Voir mon score 🏆'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Printable Pense-Bête Modal */}
      {showPrintableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="manga-panel bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-3xl w-full p-6 lg:p-8 rounded-3xl space-y-6 shadow-2xl relative border-2 border-[var(--sb-accent)] max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:max-h-none print:w-full">
            
            {/* Header (Hidden on print) */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 print:hidden">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                  Document Pédagogique Officiel · Collège (6e &amp; 5e)
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  🖨️ Pense-bête des Fiches Mnémotechniques Anglais
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="manga-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintableModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Fermer ✕
                </button>
              </div>
            </div>

            {/* Printable Content Body */}
            <div className="space-y-6 print:space-y-4">
              <div className="text-center pb-3 border-b border-slate-300">
                <h1 className="text-2xl font-black text-slate-900">ASTUCES MNÉMOTECHNIQUES ANGLAIS (6e &amp; 5e)</h1>
                <p className="text-xs text-slate-600 mt-1">Mémos essentiels pour réussir tous ses contrôles et exercices d'anglais</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
                {/* 1. OSASCOMP */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 print:bg-white space-y-2">
                  <div className="text-xs font-bold text-amber-600 uppercase">Règle 1 · L'ordre des adjectifs</div>
                  <div className="text-base font-extrabold text-slate-900">OSASCOMP</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Opinion, Size, Age, Shape, Colour, Origin, Material, Purpose.
                  </p>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                    Ex : A nice (O) big (S) red (C) car.
                  </div>
                </div>

                {/* 2. Super-Héros */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 print:bg-white space-y-2">
                  <div className="text-xs font-bold text-blue-600 uppercase">Règle 2 · Présent Simple (3e pers.)</div>
                  <div className="text-base font-extrabold text-slate-900">Le « S » du Super-Héros</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    He, She, It portent toujours un S. Si <strong>Does / Doesn't</strong> arrive, c'est lui qui vole le S !
                  </p>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                    He plays. / Does he play? (pas de S à play)
                  </div>
                </div>

                {/* 3. 5 W + H */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 print:bg-white space-y-2">
                  <div className="text-xs font-bold text-emerald-600 uppercase">Règle 3 · Questions</div>
                  <div className="text-base font-extrabold text-slate-900">Les 5 W + H</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Who (qui), What (quoi), Where (où), When (quand), Why (pourquoi) + How (comment).
                  </p>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                    Presque tous commencent par WH !
                  </div>
                </div>

                {/* 4. Entonnoir */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 print:bg-white space-y-2">
                  <div className="text-xs font-bold text-purple-600 uppercase">Règle 4 · Prépositions de temps</div>
                  <div className="text-base font-extrabold text-slate-900">L'entonnoir (IN / ON / AT)</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    • <strong>IN</strong> : longues périodes (mois, an).<br />
                    • <strong>ON</strong> : jour précis.<br />
                    • <strong>AT</strong> : heure exacte.
                  </p>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                    Grand (IN) → Moyen (ON) → Point exact (AT)
                  </div>
                </div>

                {/* 5. Sandwich Be + V-ing */}
                <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 print:bg-white space-y-2 md:col-span-2 print:col-span-2">
                  <div className="text-xs font-bold text-pink-600 uppercase">Règle 5 · Présent en cours</div>
                  <div className="text-base font-extrabold text-slate-900">L'image du Sandwich (Be + V-ing)</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Pour dire ce qu'on est en train de faire : pain du haut = BE (am/is/are), garniture = verbe, pain du bas = -ING. Si on oublie un pain, le sandwich s'effondre !
                  </p>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-white p-2 rounded border border-slate-200">
                    🥪 [BE] + [Verbe] + [-ING] (ex: I am eating)
                  </div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-300 text-[11px] text-slate-500">
                Généré par l'application interactive d'anglais · Pense-bête de révision pour les élèves de 6e et 5e.
              </div>
            </div>

            {/* Footer Close for Mobile */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintableModal(false)}
                className="manga-btn-primary px-5 py.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fermer la vue pense-bête
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: FRENCH PHRASES & TRAPS */}
      {section === 'french' && (
        <div className="space-y-6">
          <div className="manga-panel p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest px-2.5 py-0.5 rounded-lg border border-blue-500/30 bg-blue-500/10">
                Module Français ⇄ Anglais
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-wide sb-text-primary">
              🇫🇷 Phrases françaises courantes &amp; Pièges de traduction (Faux amis)
            </h2>
            <p className="text-xs sb-text-secondary leading-relaxed">
              Comprendre comment traduire correctement nos tournures françaises en anglais sans tomber dans les pièges de traduction littérale !
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Trap 1 */}
            <div className="manga-panel p-6 space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-red-500">❌ Piège n°1</span>
                  <h3 className="text-base font-bold sb-text-primary mt-1">« Je suis d'accord »</h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('I agree.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary">
                En français on utilise l'auxiliaire <em>être</em>, mais en anglais on utilise le verbe <strong>agree</strong>.
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono space-y-1">
                <div className="text-red-500">❌ Mauvais : I am agree</div>
                <div className="text-emerald-500 font-bold">✅ Correct : I agree</div>
              </div>
            </div>

            {/* Trap 2 */}
            <div className="manga-panel p-6 space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-red-500">❌ Piège n°2</span>
                  <h3 className="text-base font-bold sb-text-primary mt-1">« Depuis 3 ans »</h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('I have lived here for 3 years.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary">
                Avec une durée (3 ans), on utilise <strong>FOR</strong>. Avec un point de départ précis (2020), on utilise <strong>SINCE</strong>.
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono space-y-1">
                <div className="text-red-500">❌ Mauvais : since 3 years</div>
                <div className="text-emerald-500 font-bold">✅ Correct : for 3 years / since 2020</div>
              </div>
            </div>

            {/* Trap 3 */}
            <div className="manga-panel p-6 space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-amber-500">⚠️ Piège n°3</span>
                  <h3 className="text-base font-bold sb-text-primary mt-1">« Ça dépend »</h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('It depends.', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary">
                En anglais, le verbe <em>pend</em> n'est pas seul : on dit toujours <strong>It depends</strong> (avec un -s à la fin).
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono space-y-1">
                <div className="text-red-500">❌ Mauvais : It depend</div>
                <div className="text-emerald-500 font-bold">✅ Correct : It depends</div>
              </div>
            </div>

            {/* Trap 4 */}
            <div className="manga-panel p-6 space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b sb-divider">
                <div>
                  <span className="text-xs font-bold text-amber-500">⚠️ Piège n°4</span>
                  <h3 className="text-base font-bold sb-text-primary mt-1">« Qu'est-ce que tu fais ? »</h3>
                </div>
                <button
                  type="button"
                  onClick={() => speakEnglish('What are you doing?', { accent, rate: speechRate })}
                  className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  aria-label="Écouter"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sb-text-secondary">
                Si c'est en train de se passer en ce moment, on utilise le présent en cours (<em>Be + V-ing</em>) et non le présent simple.
              </p>
              <div className="p-3 rounded-xl border sb-surface-soft text-xs font-mono space-y-1">
                <div className="text-red-500">❌ Mauvais : What do you do? (général)</div>
                <div className="text-emerald-500 font-bold">✅ Correct : What are you doing? (maintenant)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
