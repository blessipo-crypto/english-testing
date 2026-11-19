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
  { id: 'irregular', label: 'Verbes irréguliers' },
  { id: 'modals', label: 'Les Modaux' },
  { id: 'tenses', label: 'Temps simples' },
  { id: 'prepositions', label: 'Prépositions (Temps & Lieux)' },
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

      {/* SECTION 1: IRREGULAR VERBS */}
      {section === 'irregular' && (
        <div className="manga-panel p-5 lg:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-wide sb-text-primary">
                Les verbes irréguliers essentiels ({filteredVerbs.length})
              </h2>
              <p className="text-xs sb-text-muted mt-0.5">
                Clique sur le haut-parleur pour entendre les 3 formes à la suite (ex : go, went, gone).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
                  Formation complète : Present Simple, Present Continuous, Prétérit & Expressions de durée (FOR, SINCE, AGO)
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
    </div>
  );
}
