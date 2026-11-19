import { useState } from 'react';
import {
  Volume2,
  ArrowLeftRight,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ROLEPLAY_SCENARIOS } from '../data/lessonData';
import type { RoleplayState, UserRole, VoiceAccent } from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface RoleplayModuleProps {
  roleplay: RoleplayState;
  role: UserRole;
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<RoleplayState>) => void;
  onAwardStar: () => void;
}

export function RoleplayModule({
  roleplay,
  role,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
}: RoleplayModuleProps) {
  const [showTranslations, setShowTranslations] = useState(true);

  const scenario =
    ROLEPLAY_SCENARIOS.find((s) => s.id === roleplay.scenarioId) ||
    ROLEPLAY_SCENARIOS[0];

  const handleToggleRevealLine = (index: number) => {
    const exists = roleplay.revealedIndices.includes(index);
    const next = exists
      ? roleplay.revealedIndices.filter((i) => i !== index)
      : [...roleplay.revealedIndices, index];
    onUpdate({ revealedIndices: next });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Main Dialogue Stage (8 cols) */}
      <div className="lg:col-span-8 manga-panel p-6 lg:p-8 space-y-6">
        {/* Scenario Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b sb-divider">
          <div className="space-y-1">
            <div className="text-xs font-bold tracking-wide sb-text-accent">
              {scenario.titleEn} · Niveau {scenario.level}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-wide sb-text-primary">
              {scenario.titleFr}
            </h1>
            <p className="text-sm sb-text-secondary">{scenario.settingFr}</p>
          </div>

          {role === 'tutor' && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    studentRole: roleplay.studentRole === 'B' ? 'A' : 'B',
                    revealedIndices: [],
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-chip-idle text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 sb-text-accent" aria-hidden="true" />
                Inverser les rôles
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    hideStudentLines: !roleplay.hideStudentLines,
                    revealedIndices: [],
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  roleplay.hideStudentLines ? 'sb-reward-pill' : 'sb-chip-idle'
                }`}
              >
                {roleplay.hideStudentLines ? (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {roleplay.hideStudentLines
                  ? 'Répliques élève masquées'
                  : 'Masquer répliques élève'}
              </button>
            </div>
          )}
        </div>

        {/* Role Legend Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border sb-surface-soft flex items-center justify-between">
            <span className="font-bold sb-text-primary">
              Rôle A · {scenario.roleAName}
            </span>
            <span className="font-semibold sb-text-muted">
              {roleplay.studentRole === 'A' ? 'Joué par l’Élève' : 'Joué par le Prof'}
            </span>
          </div>
          <div className="p-3 rounded-xl border sb-chip-active flex items-center justify-between">
            <span className="font-bold sb-text-accent">
              Rôle B · {scenario.roleBName}
            </span>
            <span className="font-bold sb-text-reward">
              {roleplay.studentRole === 'B' ? 'Joué par l’Élève' : 'Joué par le Prof'}
            </span>
          </div>
        </div>

        {/* Dialogue Lines */}
        <div className="space-y-3">
          {scenario.lines.map((line, index) => {
            const isActive = roleplay.activeLineIndex === index;
            const isStudentLine = line.speaker === roleplay.studentRole;
            const isMasked =
              isStudentLine &&
              roleplay.hideStudentLines &&
              !roleplay.revealedIndices.includes(index);

            const roleLabel =
              line.speaker === 'A' ? scenario.roleAName : scenario.roleBName;

            return (
              <div
                key={`${scenario.id}-${index}`}
                onClick={() => onUpdate({ activeLineIndex: index })}
                className={`p-4 rounded-2xl border border-b-4 transition-all cursor-pointer ${
                  isActive ? 'sb-card-selected' : 'sb-card-option'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono sb-text-muted tabular-nums">
                        0{index + 1}
                      </span>
                      <span
                        className={`font-bold ${
                          isStudentLine ? 'sb-text-accent' : 'sb-text-secondary'
                        }`}
                      >
                        {roleLabel} ({isStudentLine ? 'Élève' : 'Prof'})
                      </span>
                      {isActive && (
                        <span className="sb-text-reward font-bold">
                          · Tour actif
                        </span>
                      )}
                    </div>

                    {isMasked ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-sm font-semibold sb-text-primary">
                          À toi de traduire à l’oral : « {line.fr} »
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRevealLine(index);
                          }}
                          className="px-3 py-1.5 rounded-xl border sb-reward-btn text-xs font-bold cursor-pointer"
                        >
                          Révéler la phrase anglaise
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-base font-bold sb-text-primary leading-snug">
                          {line.en}
                        </p>
                        {showTranslations && (
                          <p className="text-xs sb-text-muted">{line.fr}</p>
                        )}
                      </>
                    )}

                    {line.tip && (
                      <p className="text-xs sb-text-reward pt-1">
                        Astuce : {line.tip}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(line.en, { accent, rate: speechRate });
                    }}
                    aria-label="Écouter cette réplique"
                    className="p-2 rounded-xl border sb-audio-btn shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Controls */}
        <div className="pt-4 border-t sb-divider flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowTranslations((v) => !v)}
            className="text-xs font-bold sb-text-muted hover:sb-text-accent cursor-pointer"
          >
            {showTranslations
              ? 'Masquer les traductions françaises'
              : 'Afficher les traductions françaises'}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  activeLineIndex:
                    (roleplay.activeLineIndex + 1) % scenario.lines.length,
                })
              }
              className="manga-btn-primary inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
            >
              Réplique suivante
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
            {role === 'tutor' && (
              <button
                type="button"
                onClick={onAwardStar}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-b-2 sb-reward-btn text-xs font-bold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                Bravo +1 étoile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Scenario Selector (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-bold tracking-wide sb-text-primary">
            Scénarios de jeu de rôle
          </h2>
          <div className="space-y-2">
            {ROLEPLAY_SCENARIOS.map((sc) => {
              const active = sc.id === scenario.id;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() =>
                    onUpdate({
                      scenarioId: sc.id,
                      activeLineIndex: 0,
                      revealedIndices: [],
                    })
                  }
                  className={`w-full p-3.5 rounded-2xl border border-b-4 text-left transition-all cursor-pointer ${
                    active ? 'sb-card-selected' : 'sb-card-option'
                  }`}
                >
                  <div className="text-sm font-bold sb-text-primary">
                    {sc.titleFr}
                  </div>
                  <div className="text-xs sb-text-muted mt-1">
                    Niveau {sc.level} · {sc.lines.length} répliques
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="manga-panel p-5 space-y-2">
          <h2 className="text-sm font-bold tracking-wide sb-text-accent">
            Conseil pour la visio
          </h2>
          <p className="text-xs sb-text-secondary leading-relaxed">
            Lisez d’abord le dialogue une fois avec les traductions affichées, puis
            activez « Masquer répliques élève » et inversez les rôles pour travailler
            la spontanéité à l’oral.
          </p>
        </div>
      </aside>
    </div>
  );
}
