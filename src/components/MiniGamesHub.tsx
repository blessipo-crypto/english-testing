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
              className={`group p-4 rounded-2xl border border-b-4 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                active ? 'sb-card-selected' : 'sb-card-option'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-bold tracking-wide flex items-center gap-2 ${
                    active
                      ? 'sb-text-reward'
                      : 'sb-text-accent group-hover:sb-text-reward'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rotate-45 shrink-0 ${
                      active
                        ? 'bg-[var(--sb-danger)]'
                        : 'bg-[var(--sb-accent)] group-hover:bg-[var(--sb-reward)]'
                    }`}
                  />
                  {category}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active
                      ? 'sb-text-accent'
                      : 'sb-text-muted group-hover:sb-text-reward'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <div className="font-display text-base font-bold tracking-wide leading-snug sb-text-primary">
                  {title}
                </div>
                <div
                  className={`text-xs mt-0.5 ${
                    active ? 'sb-text-secondary' : 'sb-text-muted'
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
