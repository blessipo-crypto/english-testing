import { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import {
  THEME_OPTIONS,
  type AppThemeId,
} from '../hooks/useTheme';

interface ThemeSelectorProps {
  theme: AppThemeId;
  onSelectTheme: (theme: AppThemeId) => void;
}

export function ThemeSelector({ theme, onSelectTheme }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const currentOption =
    THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Changer le thème graphique (actuel : ${currentOption.label})`}
        title={`Thème : ${currentOption.label}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold tracking-wide transition-colors duration-300 whitespace-nowrap shrink-0 cursor-pointer ${
          isOpen ? 'sb-chip-active' : 'sb-chip-idle'
        }`}
      >
        <Palette className="w-3.5 h-3.5 sb-text-accent shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{currentOption.label}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Choisir un habillage graphique"
          className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-72 max-w-[calc(100vw-2rem)] manga-panel-sm p-3.5 space-y-2.5 z-50"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b sb-divider">
            <span className="text-xs font-bold tracking-wide sb-text-primary">
              Habillage graphique
            </span>
            <span className="text-[11px] sb-text-muted">Enregistré</span>
          </div>

          <div className="space-y-1.5">
            {THEME_OPTIONS.map((option) => {
              const active = option.id === theme;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelectTheme(option.id);
                    setIsOpen(false);
                  }}
                  aria-pressed={active}
                  className={`w-full p-2.5 rounded-xl border border-b-2 text-left flex items-center justify-between gap-2.5 transition-colors duration-300 cursor-pointer ${
                    active ? 'sb-card-selected' : 'sb-card-option'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex items-center -space-x-1 shrink-0"
                      aria-hidden="true"
                    >
                      {option.swatches.map((color, idx) => (
                        <span
                          key={`${option.id}-sw-${idx}`}
                          className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold sb-text-primary truncate">
                        {option.label}
                      </div>
                      <div className="text-[11px] sb-text-muted truncate">
                        {option.hint}
                      </div>
                    </div>
                  </div>

                  {active && (
                    <Check
                      className="w-4 h-4 sb-text-accent shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
