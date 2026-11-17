import { Grid3X3, Shuffle, Blocks, Zap } from 'lucide-react';
import type { GamesHubState, MiniGameId, VoiceAccent, WordbankItem } from '../types/lesson';
import { WordSearchGame } from './games/WordSearchGame';
import { VocabSprintGame } from './games/VocabSprintGame';
import { SentenceExpressGame } from './games/SentenceExpressGame';
import { GrammarBlitzGame } from './games/GrammarBlitzGame';

interface MiniGamesHubProps {
  games: GamesHubState;
  wordbank: WordbankItem[];
  accent: VoiceAccent;
  speechRate: number;
  onUpdate: (patch: Partial<GamesHubState>) => void;
  onAwardStar: () => void;
}

const GAME_OPTIONS: Array<{
  id: MiniGameId;
  title: string;
  subtitle: string;
  category: string;
  Icon: typeof Grid3X3;
}> = [
  {
    id: 'wordsearch',
    title: 'Mots mêlés',
    subtitle: 'Grille 9×9 interactive + indices audio',
    category: 'Vocabulaire',
    Icon: Grid3X3,
  },
  {
    id: 'vocabmatch',
    title: 'Duo Flash',
    subtitle: 'Association rapide avec série & chrono',
    category: 'Vocabulaire',
    Icon: Shuffle,
  },
  {
    id: 'sentence',
    title: 'Phrase Express',
    subtitle: '5 manches d’ordre des mots (+ piège)',
    category: 'Grammaire',
    Icon: Blocks,
  },
  {
    id: 'grammarblitz',
    title: 'Défi Grammaire',
    subtitle: 'Quiz réflexe modaux, temps & AT/ON/IN',
    category: 'Grammaire',
    Icon: Zap,
  },
];

export function MiniGamesHub({
  games,
  wordbank,
  accent,
  speechRate,
  onUpdate,
  onAwardStar,
}: MiniGamesHubProps) {
  return (
    <div className="space-y-6">
      {/* Mini-Game Selector Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {GAME_OPTIONS.map(({ id, title, subtitle, category, Icon }) => {
          const active = games.activeGame === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onUpdate({ activeGame: id })}
              className={`p-4 rounded-xl border-2 text-left transition-transform cursor-pointer flex flex-col justify-between gap-2 ${
                active
                  ? 'bg-slate-900 border-slate-900 text-white shadow-[3px_3px_0px_#e11d48]'
                  : 'bg-white border-slate-900 text-slate-900 hover:bg-amber-50/50 shadow-[3px_3px_0px_#0f172a]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold ${
                    active ? 'text-rose-300' : 'text-slate-500'
                  }`}
                >
                  {category}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-rose-400' : 'text-slate-700'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="font-display text-base font-bold leading-snug">
                  {title}
                </div>
                <div
                  className={`text-xs mt-0.5 ${
                    active ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Mini-Game Stage */}
      {games.activeGame === 'wordsearch' && (
        <WordSearchGame
          themeId={games.themeId}
          wordbank={wordbank}
          accent={accent}
          speechRate={speechRate}
          onChangeTheme={(themeId) => onUpdate({ themeId })}
          onAwardStar={onAwardStar}
        />
      )}

      {games.activeGame === 'vocabmatch' && (
        <VocabSprintGame
          themeId={games.themeId}
          wordbank={wordbank}
          accent={accent}
          speechRate={speechRate}
          onChangeTheme={(themeId) => onUpdate({ themeId })}
          onAwardStar={onAwardStar}
        />
      )}

      {games.activeGame === 'sentence' && (
        <SentenceExpressGame
          accent={accent}
          speechRate={speechRate}
          onAwardStar={onAwardStar}
        />
      )}

      {games.activeGame === 'grammarblitz' && (
        <GrammarBlitzGame
          accent={accent}
          speechRate={speechRate}
          onAwardStar={onAwardStar}
        />
      )}
    </div>
  );
}
