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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              {scenario.titleEn} · Niveau {scenario.level}
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
              {scenario.titleFr}
            </h1>
            <p className="text-sm text-slate-600">{scenario.settingFr}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                onUpdate({
                  studentRole: roleplay.studentRole === 'B' ? 'A' : 'B',
                  revealedIndices: [],
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" aria-hidden="true" />
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                roleplay.hideStudentLines
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
        </div>

        {/* Role Legend Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <span className="font-semibold text-slate-900">
              Rôle A · {scenario.roleAName}
            </span>
            <span className="font-medium text-slate-600">
              {roleplay.studentRole === 'A' ? 'Joué par l’Élève' : 'Joué par le Prof'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-200/80 flex items-center justify-between">
            <span className="font-semibold text-indigo-950">
              Rôle B · {scenario.roleBName}
            </span>
            <span className="font-medium text-indigo-700">
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
                className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono text-slate-400 tabular-nums">
                        0{index + 1}
                      </span>
                      <span
                        className={`font-semibold ${
                          isStudentLine ? 'text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        {roleLabel} ({isStudentLine ? 'Élève' : 'Prof'})
                      </span>
                      {isActive && (
                        <span className="text-indigo-700 font-semibold">
                          · Tour actif
                        </span>
                      )}
                    </div>

                    {isMasked ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-sm font-medium text-slate-800">
                          À toi de traduire à l’oral : « {line.fr} »
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRevealLine(index);
                          }}
                          className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          Révéler la phrase anglaise
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-base font-semibold text-slate-900 leading-snug">
                          {line.en}
                        </p>
                        {showTranslations && (
                          <p className="text-xs text-slate-500">{line.fr}</p>
                        )}
                      </>
                    )}

                    {line.tip && (
                      <p className="text-xs text-amber-800 pt-1">
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
                    className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowTranslations((v) => !v)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
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
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
            >
              Réplique suivante
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
            {role === 'tutor' && (
              <button
                type="button"
                onClick={onAwardStar}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                Bravo +1 étoile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Scenario Selector (4 cols) */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="manga-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">
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
                  className={`w-full p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-50 border-indigo-600'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {sc.titleFr}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Niveau {sc.level} · {sc.lines.length} répliques
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="manga-panel p-5 space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Conseil pour la visio
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Lisez d’abord le dialogue une fois avec les traductions affichées, puis
            activez « Masquer répliques élève » et inversez les rôles pour travailler
            la spontanéité à l’oral.
          </p>
        </div>
      </aside>
    </div>
  );
}
