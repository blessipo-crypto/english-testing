import { useCallback, useEffect, useState } from 'react';

export type AppThemeId = 'tech' | 'day' | 'neon';

export interface ThemeOption {
  id: AppThemeId;
  label: string;
  hint: string;
  swatches: [string, string, string];
}

export const THEME_STORAGE_KEY = 'storybridge_theme_v1';

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'tech',
    label: 'Tech Sombre',
    hint: 'Bleu nuit, cyan & rouge vif',
    swatches: ['#0F172A', '#38BDF8', '#EF4444'],
  },
  {
    id: 'day',
    label: 'Ligue Jour',
    hint: 'Clair, en-tête rouge & cobalt',
    swatches: ['#F8FAFC', '#DC2626', '#2563EB'],
  },
  {
    id: 'neon',
    label: 'Spectre Néon',
    hint: 'Violet sombre, lavande & émeraude',
    swatches: ['#130F26', '#A855F7', '#10B981'],
  },
];

function isValidTheme(value: unknown): value is AppThemeId {
  return value === 'tech' || value === 'day' || value === 'neon';
}

export function getStoredTheme(): AppThemeId {
  if (typeof window === 'undefined') return 'tech';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(saved) ? saved : 'tech';
  } catch {
    return 'tech';
  }
}

export function applyDocumentTheme(theme: AppThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<AppThemeId>(() => getStoredTheme());

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: AppThemeId) => {
    setThemeState(nextTheme);
    applyDocumentTheme(nextTheme);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage quota or private browsing errors
      }
    }
  }, []);

  return { theme, setTheme };
}
