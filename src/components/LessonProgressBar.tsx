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

  const fillStyle = {
    width: `${percent}%`,
    backgroundImage:
      percent >= 85
        ? 'var(--sb-progress-high)'
        : percent >= 45
          ? 'var(--sb-progress-mid)'
          : 'var(--sb-progress-low)',
  };

  return (
    <div
      className="w-full h-2 sb-surface relative overflow-hidden border-t sb-divider transition-colors duration-300"
      role="progressbar"
      aria-label="Progression de la leçon"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className="h-full transition-all duration-300 ease-out"
        style={fillStyle}
      />
      <div
        className="absolute inset-0 hud-segments-dense pointer-events-none"
        aria-hidden="true"
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

  const barStyle = {
    width: `${percent}%`,
    backgroundImage:
      percent >= 85
        ? 'var(--sb-progress-high)'
        : percent >= 45
          ? 'var(--sb-progress-mid)'
          : 'var(--sb-progress-low)',
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-2.5 px-3 py-1 rounded-xl border sb-chip-idle cursor-pointer"
      >
        <Trophy
          className={`w-3.5 h-3.5 shrink-0 ${
            percent >= 85 ? 'sb-text-reward' : 'sb-text-accent'
          }`}
          aria-hidden="true"
        />
        <span className="text-xs font-bold tracking-wide sb-text-primary whitespace-nowrap tabular-nums">
          Leçon · {percent}%
        </span>

        <span className="hidden sm:block relative w-24 h-2.5 rounded-full sb-surface border overflow-hidden shrink-0">
          <span
            className="block h-full transition-all duration-300"
            style={barStyle}
          />
          <span
            className="absolute inset-0 hud-segments pointer-events-none"
            aria-hidden="true"
          />
        </span>

        <span className="text-[11px] font-bold tracking-wide sb-text-accent tabular-nums whitespace-nowrap">
          {completedCount}/{totalModules}
        </span>
        <ChevronDown className="w-3.5 h-3.5 sb-text-muted shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 manga-panel p-4 z-40 space-y-3">
          <div className="flex items-center justify-between gap-2 pb-2 border-b sb-divider">
            <div>
              <div className="text-xs font-bold tracking-wide sb-text-primary">
                Progression de la séance
              </div>
              <div className="text-[11px] sb-text-muted tabular-nums">
                {completedCount}/{totalModules} modules · +{starsEarned} étoile
                {starsEarned > 1 ? 's' : ''} gagnée{starsEarned > 1 ? 's' : ''}
              </div>
            </div>
            <span className="font-mono text-sm font-extrabold sb-text-reward tabular-nums">
              {percent}%
            </span>
          </div>

          <div className="relative w-full h-3 rounded-full sb-surface border overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={barStyle}
            />
            <div
              className="absolute inset-0 hud-segments pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-1.5">
            {LESSON_MILESTONES.map((m) => {
              const done = completedModules.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition-colors duration-300 ${
                    done ? 'sb-chip-active' : 'sb-surface-soft'
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
                        className="w-4 h-4 sb-text-reward shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Circle
                        className="w-4 h-4 sb-text-muted shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-wide sb-text-primary truncate">
                        {m.label}
                      </div>
                      <div className="text-[11px] sb-text-muted truncate">
                        {m.hint}
                      </div>
                    </div>
                  </button>

                  {role === 'tutor' && (
                    <button
                      type="button"
                      onClick={() => onToggleMilestone(m.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold tracking-wide shrink-0 cursor-pointer border transition-colors duration-300 ${
                        done ? 'sb-reward-pill' : 'sb-chip-idle'
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
            <div className="pt-2 border-t sb-divider flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide sb-text-muted hover:sb-text-danger cursor-pointer"
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
