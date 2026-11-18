import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, RotateCcw, Trophy } from 'lucide-react';
import type { LessonMilestoneId, UserRole } from '../types/lesson';

export interface MilestoneDef {
  id: LessonMilestoneId;
  label: string;
  hint: string;
}

export const LESSON_MILESTONES: MilestoneDef[] = [
  { id: 'warmup', label: 'Rituel d’ouverture', hint: 'Humeur, météo & question orale' },
  { id: 'vocab', label: 'Vocabulaire', hint: 'Cartes & jeu d’association' },
  { id: 'grammar', label: 'Grammaire & Phrases', hint: 'Atelier de construction' },
  { id: 'games', label: 'Mini-Jeux', hint: 'Mots mêlés, Duo Flash, Express ou Blitz' },
  { id: 'time', label: 'L’heure anglaise', hint: 'Horloge interactive & défi' },
  { id: 'quiz', label: 'Quiz & Jeux de rôle', hint: 'Bruno Mars ou dialogue visio' },
];

export function computeLessonProgress(
  completedModules: LessonMilestoneId[],
  stars: number,
  sessionBaseStars: number
) {
  const uniqueCompleted = LESSON_MILESTONES.filter((m) =>
    completedModules.includes(m.id)
  ).length;
  const moduleRatio = uniqueCompleted / LESSON_MILESTONES.length; // 0..1 -> max 60%

  const starsEarned = Math.max(0, stars - sessionBaseStars);
  const starGoal = 5; // 5 stars earned during session fills remaining 40%
  const starRatio = Math.min(1, starsEarned / starGoal);

  const percent = Math.min(100, Math.round(moduleRatio * 60 + starRatio * 40));
  return {
    percent,
    completedCount: uniqueCompleted,
    totalModules: LESSON_MILESTONES.length,
    starsEarned,
    starGoal,
  };
}

export function TopProgressStrip({
  completedModules,
  stars,
  sessionBaseStars,
}: {
  completedModules: LessonMilestoneId[];
  stars: number;
  sessionBaseStars: number;
}) {
  const { percent } = computeLessonProgress(
    completedModules,
    stars,
    sessionBaseStars
  );

  const fillColor =
    percent >= 85
      ? 'bg-emerald-500'
      : percent >= 45
        ? 'bg-amber-400'
        : 'bg-rose-600';

  return (
    <div
      className="w-full h-1.5 bg-slate-100 relative overflow-hidden border-t border-slate-200"
      role="progressbar"
      aria-label="Progression de la leçon"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className={`h-full transition-all duration-300 ease-out ${fillColor}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

interface LessonProgressWidgetProps {
  completedModules: LessonMilestoneId[];
  stars: number;
  sessionBaseStars: number;
  role: UserRole;
  onSelectMilestone: (id: LessonMilestoneId) => void;
  onToggleMilestone: (id: LessonMilestoneId) => void;
  onResetProgress: () => void;
}

export function LessonProgressWidget({
  completedModules,
  stars,
  sessionBaseStars,
  role,
  onSelectMilestone,
  onToggleMilestone,
  onResetProgress,
}: LessonProgressWidgetProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const { percent, completedCount, totalModules, starsEarned } =
    computeLessonProgress(completedModules, stars, sessionBaseStars);

  const barColor =
    percent >= 85
      ? 'bg-emerald-500'
      : percent >= 45
        ? 'bg-amber-400'
        : 'bg-rose-600';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:border-slate-900 transition-colors cursor-pointer"
      >
        <Trophy
          className={`w-3.5 h-3.5 shrink-0 ${
            percent >= 85 ? 'text-emerald-600' : 'text-rose-600'
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-bold text-slate-800 whitespace-nowrap tabular-nums">
          Leçon · {percent}%
        </span>

        <span className="hidden sm:block w-20 h-2 rounded-full bg-slate-100 border border-slate-900 overflow-hidden shrink-0">
          <span
            className={`block h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </span>

        <span className="text-[11px] font-semibold text-slate-500 tabular-nums whitespace-nowrap">
          {completedCount}/{totalModules}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 manga-panel p-4 z-40 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-900">
                Progression de la séance
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">
                {completedCount}/{totalModules} modules · +{starsEarned} étoile
                {starsEarned > 1 ? 's' : ''} gagnée{starsEarned > 1 ? 's' : ''}
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold text-rose-600 tabular-nums">
              {percent}%
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-900 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="space-y-1.5">
            {LESSON_MILESTONES.map((m) => {
              const done = completedModules.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                    done
                      ? 'bg-emerald-50 border-emerald-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMilestone(m.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    {done ? (
                      <CheckCircle2
                        className="w-4 h-4 text-emerald-600 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="w-4 h-4 text-slate-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {m.label}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {m.hint}
                      </div>
                    </div>
                  </button>

                  {role === 'tutor' && (
                    <button
                      type="button"
                      onClick={() => onToggleMilestone(m.id)}
                      className={`px-2 py-1 rounded text-[11px] font-bold shrink-0 cursor-pointer ${
                        done
                          ? 'bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {done ? 'Validé' : 'Valider'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {role === 'tutor' && (
            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Nouvelle séance (remise à 0%)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
