import { useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  RotateCcw,
  Lightbulb,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WORD_SEARCH_THEMES, type WordSearchEntry } from '../../data/gamesData';
import type { VoiceAccent, WordbankItem } from '../../types/lesson';
import { speakEnglish } from '../../utils/speech';
import { playError, playPop, playSuccess, playVictory } from '../../utils/soundFx';

interface WordSearchGameProps {
  themeId: string;
  wordbank: WordbankItem[];
  accent: VoiceAccent;
  speechRate: number;
  onChangeTheme: (themeId: string) => void;
  onAwardStar: () => void;
}

interface Coord {
  r: number;
  c: number;
}

interface PlacedWord {
  entry: WordSearchEntry;
  cells: Coord[];
  directionLabel: string;
  colorClass: string;
}

const GRID_SIZE = 9;
const FILLER_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWY';
const WORD_COLOR_PALETTE = [
  'bg-sky-500/20 sb-text-primary border-sky-500',
  'bg-emerald-500/20 sb-text-primary border-emerald-500',
  'bg-amber-400/25 sb-text-primary border-amber-500',
  'bg-rose-500/20 sb-text-primary border-rose-500',
  'bg-violet-500/20 sb-text-primary border-violet-500',
  'bg-teal-500/20 sb-text-primary border-teal-500',
];

function createSeededRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildGrid(words: WordSearchEntry[], seed: number, allowReverse: boolean) {
  const rng = createSeededRng(seed);
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => '')
  );

  const directions: Array<{ dr: number; dc: number; label: string }> = [
    { dr: 0, dc: 1, label: 'Horizontal →' },
    { dr: 1, dc: 0, label: 'Vertical ↓' },
    { dr: 1, dc: 1, label: 'Diagonal ↘' },
  ];
  if (allowReverse) {
    directions.push(
      { dr: 0, dc: -1, label: 'Horizontal ←' },
      { dr: -1, dc: 0, label: 'Vertical ↑' }
    );
  }

  const placed: PlacedWord[] = [];
  const sorted = [...words]
    .filter((w) => w.word.length >= 3 && w.word.length <= GRID_SIZE)
    .sort((a, b) => b.word.length - a.word.length)
    .slice(0, 6);

  sorted.forEach((entry, idx) => {
    const letters = entry.word.toUpperCase();
    let success = false;
    for (let attempt = 0; attempt < 120 && !success; attempt++) {
      const dir = directions[Math.floor(rng() * directions.length)];
      const startR = Math.floor(rng() * GRID_SIZE);
      const startC = Math.floor(rng() * GRID_SIZE);
      const endR = startR + dir.dr * (letters.length - 1);
      const endC = startC + dir.dc * (letters.length - 1);
      if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) {
        continue;
      }

      let fits = true;
      const cells: Coord[] = [];
      for (let i = 0; i < letters.length; i++) {
        const r = startR + dir.dr * i;
        const c = startC + dir.dc * i;
        const existing = grid[r][c];
        if (existing !== '' && existing !== letters[i]) {
          fits = false;
          break;
        }
        cells.push({ r, c });
      }

      if (fits) {
        cells.forEach((coord, i) => {
          grid[coord.r][coord.c] = letters[i];
        });
        placed.push({
          entry: { ...entry, word: letters },
          cells,
          directionLabel: dir.label,
          colorClass: WORD_COLOR_PALETTE[idx % WORD_COLOR_PALETTE.length],
        });
        success = true;
      }
    }
  });

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) {
        grid[r][c] = FILLER_LETTERS[Math.floor(rng() * FILLER_LETTERS.length)];
      }
    }
  }

  return { grid, placed };
}

function getLineCoords(start: Coord, end: Coord): Coord[] {
  const dr = end.r - start.r;
  const dc = end.c - start.c;
  const absR = Math.abs(dr);
  const absC = Math.abs(dc);

  if (dr === 0 && dc === 0) return [start];
  if (dr !== 0 && dc !== 0 && absR !== absC) return [];

  const steps = Math.max(absR, absC);
  const stepR = dr === 0 ? 0 : dr / absR;
  const stepC = dc === 0 ? 0 : dc / absC;
  const coords: Coord[] = [];
  for (let i = 0; i <= steps; i++) {
    coords.push({ r: start.r + stepR * i, c: start.c + stepC * i });
  }
  return coords;
}

export function WordSearchGame({
  themeId,
  wordbank,
  accent,
  speechRate,
  onChangeTheme,
  onAwardStar,
}: WordSearchGameProps) {
  const [seed, setSeed] = useState<number>(() => 101);
  const [allowReverse, setAllowReverse] = useState(false);
  const [hideFrench, setHideFrench] = useState(false);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [dragStart, setDragStart] = useState<Coord | null>(null);
  const [dragEnd, setDragEnd] = useState<Coord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hintTier, setHintTier] = useState<0 | 1 | 2 | 3>(0);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [starAwarded, setStarAwarded] = useState(false);

  const customCarnetEntries = useMemo<WordSearchEntry[]>(() => {
    return wordbank
      .map((item) => {
        const cleaned = item.en.replace(/[^a-zA-Z]/g, '').toUpperCase();
        return {
          word: cleaned,
          fr: item.fr,
          hintEn: item.en,
        };
      })
      .filter((e) => e.word.length >= 3 && e.word.length <= GRID_SIZE);
  }, [wordbank]);

  const activeWords = useMemo<WordSearchEntry[]>(() => {
    if (themeId === 'wordbank' && customCarnetEntries.length >= 4) {
      return customCarnetEntries.slice(0, 6);
    }
    const foundTheme =
      WORD_SEARCH_THEMES.find((t) => t.id === themeId) || WORD_SEARCH_THEMES[0];
    return foundTheme.words;
  }, [themeId, customCarnetEntries]);

  const { grid, placed } = useMemo(
    () => buildGrid(activeWords, seed, allowReverse),
    [activeWords, seed, allowReverse]
  );

  // Reset puzzle progress whenever theme or seed changes
  useEffect(() => {
    setFoundWords([]);
    setDragStart(null);
    setDragEnd(null);
    setIsDragging(false);
    setHintTier(0);
    setHintWord(null);
    setStatusMsg(null);
    setStarAwarded(false);
  }, [themeId, seed, allowReverse]);

  const activeSelection = useMemo(() => {
    if (!dragStart || !dragEnd) return [];
    return getLineCoords(dragStart, dragEnd);
  }, [dragStart, dragEnd]);

  const checkSelection = (start: Coord, end: Coord) => {
    const coords = getLineCoords(start, end);
    if (coords.length < 2) return;

    const selectedText = coords.map((c) => grid[c.r][c.c]).join('');
    const reversedText = selectedText.split('').reverse().join('');

    const matched = placed.find(
      (p) =>
        !foundWords.includes(p.entry.word) &&
        (p.entry.word === selectedText || p.entry.word === reversedText)
    );

    if (matched) {
      const nextFound = [...foundWords, matched.entry.word];
      setFoundWords(nextFound);
      setHintTier(0);
      setHintWord(null);
      setStatusMsg(`Trouvé : ${matched.entry.word} (${matched.entry.fr}) !`);
      speakEnglish(matched.entry.word.toLowerCase(), { accent, rate: speechRate });
      if (nextFound.length === placed.length) {
        playVictory();
        if (!starAwarded) {
          setStarAwarded(true);
          onAwardStar();
        }
      } else {
        playSuccess();
      }
    } else {
      playError();
      setStatusMsg(`« ${selectedText} » n’est pas dans la liste.`);
    }
  };

  useEffect(() => {
    const handlePointerUpGlobal = () => {
      if (isDragging && dragStart && dragEnd) {
        setIsDragging(false);
        if (dragStart.r !== dragEnd.r || dragStart.c !== dragEnd.c) {
          checkSelection(dragStart, dragEnd);
          setDragStart(null);
          setDragEnd(null);
        }
      }
    };
    window.addEventListener('pointerup', handlePointerUpGlobal);
    return () => window.removeEventListener('pointerup', handlePointerUpGlobal);
  });

  const handleCellPointerDown = (coord: Coord) => {
    // Support both drag-and-drop AND click-first -> click-last!
    if (dragStart && !isDragging && (dragStart.r !== coord.r || dragStart.c !== coord.c)) {
      const line = getLineCoords(dragStart, coord);
      if (line.length >= 2) {
        checkSelection(dragStart, coord);
        setDragStart(null);
        setDragEnd(null);
        return;
      }
    }
    playPop();
    setDragStart(coord);
    setDragEnd(coord);
    setIsDragging(true);
  };

  const handleCellPointerEnter = (coord: Coord) => {
    if (!isDragging || !dragStart) return;
    setDragEnd(coord);
  };

  const handleHint = () => {
    const remaining = placed.filter((p) => !foundWords.includes(p.entry.word));
    if (remaining.length === 0) return;

    const target =
      remaining.find((p) => p.entry.word === hintWord) || remaining[0];
    const nextTier =
      hintWord === target.entry.word ? (Math.min(3, hintTier + 1) as 1 | 2 | 3) : 1;

    setHintWord(target.entry.word);
    setHintTier(nextTier);
    speakEnglish(target.entry.word.toLowerCase(), { accent, rate: speechRate });
  };

  const activeHintObj = placed.find((p) => p.entry.word === hintWord);
  const allFound = placed.length > 0 && foundWords.length === placed.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 cols: 9x9 Interactive Word Search Grid */}
      <div className="lg:col-span-7 manga-panel p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold sb-text-accent">
              Mots mêlés · Clique et glisse (ou clique 1re puis dernière lettre)
            </div>
            <h2 className="text-xl font-bold tracking-wide sb-text-primary">
              Grille 9×9 ·{' '}
              <span className="tabular-nums sb-text-reward">
                {foundWords.length}/{placed.length} trouvés
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleHint}
              disabled={allFound}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-reward-btn text-xs font-bold disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
              Indice {hintTier > 0 ? `(${hintTier}/3)` : ''}
            </button>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 17)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-b-2 sb-chip-idle border-b-[var(--sb-border-3d)] text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Nouvelle grille
            </button>
          </div>
        </div>

        {/* Progressive Hint Banner */}
        {activeHintObj && hintTier > 0 && !foundWords.includes(activeHintObj.entry.word) && (
          <div className="p-3.5 rounded-2xl sb-status-warn border text-xs space-y-1">
            <div className="font-bold sb-text-reward">
              Indice 1 : Cherche « {activeHintObj.entry.word} » ({activeHintObj.entry.fr})
            </div>
            {hintTier >= 2 && (
              <div>Indice 2 : Sens → {activeHintObj.directionLabel}</div>
            )}
            {hintTier >= 3 && (
              <div>
                Indice 3 : La 1re lettre est surlignée sur la grille !
              </div>
            )}
          </div>
        )}

        {allFound && (
          <div
            role="status"
            className="p-4 rounded-2xl sb-status-success border flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold sb-text-success">
              <Sparkles className="w-5 h-5 sb-text-reward shrink-0" aria-hidden="true" />
              <span>Bravo ! Grille complétée à 100 % (+1 étoile) !</span>
            </div>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 23)}
              className="manga-btn-primary px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rejouer une grille
            </button>
          </div>
        )}

        {/* Interactive Letter Grid */}
        <div
          className="select-none touch-none mx-auto max-w-[460px]"
          role="grid"
          aria-label="Grille de mots mêlés"
          onPointerMove={(e) => {
            if (!isDragging || !dragStart) return;
            const target = document.elementFromPoint(e.clientX, e.clientY);
            const cellEl = target?.closest<HTMLElement>('[data-ws-r]');
            if (!cellEl) return;
            const r = Number(cellEl.dataset.wsR);
            const c = Number(cellEl.dataset.wsC);
            if (Number.isFinite(r) && Number.isFinite(c)) {
              setDragEnd({ r, c });
            }
          }}
        >
          <div className="grid grid-cols-9 gap-1.5">
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelected = activeSelection.some((s) => s.r === r && s.c === c);
                const foundOwners = placed.filter(
                  (p) =>
                    foundWords.includes(p.entry.word) &&
                    p.cells.some((cell) => cell.r === r && cell.c === c)
                );
                const isHintCell =
                  hintTier >= 3 &&
                  activeHintObj &&
                  !foundWords.includes(activeHintObj.entry.word) &&
                  activeHintObj.cells[0]?.r === r &&
                  activeHintObj.cells[0]?.c === c;

                let cellStyle =
                  'sb-surface hover:border-[var(--sb-accent)] hover:bg-[var(--sb-bg-panel)]';
                if (isSelected) {
                  cellStyle =
                    'bg-[var(--sb-danger)] border-[var(--sb-danger)] text-white scale-105 shadow-md';
                } else if (isHintCell) {
                  cellStyle =
                    'bg-[var(--sb-reward)] border-[var(--sb-reward-3d)] text-[var(--sb-reward-contrast)] ring-2 ring-[var(--sb-reward)]/70';
                } else if (foundOwners.length > 0) {
                  cellStyle = foundOwners[0].colorClass;
                }

                return (
                  <button
                    key={`ws-${r}-${c}`}
                    type="button"
                    data-ws-r={r}
                    data-ws-c={c}
                    onPointerDown={(e) => {
                      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      }
                      handleCellPointerDown({ r, c });
                    }}
                    onPointerEnter={() => handleCellPointerEnter({ r, c })}
                    className={`aspect-square min-h-[38px] sm:min-h-[44px] rounded-xl border-2 font-display text-base sm:text-lg font-extrabold flex items-center justify-center transition-all cursor-pointer ${cellStyle}`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {statusMsg && !allFound && (
          <p className="text-xs font-bold sb-text-reward text-center">{statusMsg}</p>
        )}
      </div>

      {/* Right 5 cols: Theme & Target Word List */}
      <aside className="lg:col-span-5 space-y-4">
        <div className="manga-panel p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold tracking-wide sb-text-primary">Thème de la grille</h3>
            <button
              type="button"
              onClick={() => setAllowReverse((v) => !v)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                allowReverse ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              {allowReverse ? 'Sens inversés : ON' : 'Mode standard'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {WORD_SEARCH_THEMES.map((t) => {
              const active = themeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTheme(t.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'sb-chip-danger-solid' : 'sb-chip-idle'
                  }`}
                >
                  {t.titleFr}
                </button>
              );
            })}
            {customCarnetEntries.length >= 4 && (
              <button
                type="button"
                onClick={() => onChangeTheme('wordbank')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  themeId === 'wordbank'
                    ? 'sb-chip-danger-solid'
                    : 'sb-reward-pill hover:bg-[var(--sb-reward)] hover:text-[var(--sb-reward-contrast)]'
                }`}
              >
                Mon Carnet ({Math.min(6, customCarnetEntries.length)})
              </button>
            )}
          </div>
        </div>

        <div className="manga-panel p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold tracking-wide sb-text-primary">
              Mots anglais à repérer
            </h3>
            <button
              type="button"
              onClick={() => setHideFrench((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-bold sb-text-accent hover:sb-text-primary cursor-pointer"
            >
              {hideFrench ? (
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {hideFrench ? 'Voir traduction' : 'Cacher français'}
            </button>
          </div>

          <div className="space-y-2">
            {placed.map((p) => {
              const found = foundWords.includes(p.entry.word);
              return (
                <div
                  key={p.entry.word}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors duration-300 ${
                    found ? p.colorClass : 'sb-surface-soft'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {found && (
                        <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={`font-mono text-sm font-bold tracking-wider ${
                          found ? 'line-through opacity-85' : ''
                        }`}
                      >
                        {p.entry.word}
                      </span>
                    </div>
                    <div className={`text-xs mt-0.5 ${found ? 'opacity-90' : 'sb-text-muted'}`}>
                      {hideFrench && !found ? 'Traduction masquée' : p.entry.fr}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      speakEnglish(p.entry.word.toLowerCase(), {
                        accent,
                        rate: speechRate,
                      })
                    }
                    aria-label={`Prononcer ${p.entry.word}`}
                    className="p-2 rounded-xl sb-audio-btn border shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
