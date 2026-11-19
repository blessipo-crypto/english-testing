import { useEffect, useRef, useState } from 'react';
import {
  Undo2,
  Trash2,
  Volume2,
  Plus,
  Copy,
  Check,
  X,
  MessageCircle,
  PenTool,
  Eraser,
} from 'lucide-react';
import type {
  BoardStroke,
  StrokePoint,
  UserRole,
  VoiceAccent,
  WordbankItem,
} from '../types/lesson';
import { speakEnglish } from '../utils/speech';

interface BoardModuleProps {
  strokes: BoardStroke[];
  boardNote: string;
  wordbank: WordbankItem[];
  stars: number;
  role: UserRole;
  accent: VoiceAccent;
  speechRate: number;
  onAddStroke: (stroke: BoardStroke) => void;
  onUndoStroke: () => void;
  onClearStrokes: () => void;
  onUpdateNote: (note: string) => void;
  onAddWord: (item: Omit<WordbankItem, 'id' | 'addedAt'>) => void;
  onRemoveWord: (id: string) => void;
}

const LOGICAL_WIDTH = 900;
const LOGICAL_HEIGHT = 480;

const INK_COLORS = [
  { label: 'Encre noire', value: '#0F172A' },
  { label: 'Indigo', value: '#4338CA' },
  { label: 'Émeraude', value: '#059669' },
  { label: 'Corail', value: '#DC2626' },
];

type PaperStyle = 'dots' | 'lined' | 'blank';

export function BoardModule({
  strokes,
  boardNote,
  wordbank,
  stars,
  role,
  accent,
  speechRate,
  onAddStroke,
  onUndoStroke,
  onClearStrokes,
  onUpdateNote,
  onAddWord,
  onRemoveWord,
}: BoardModuleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [inkColor, setInkColor] = useState('#4338CA');
  const [isEraser, setIsEraser] = useState(false);
  const [brushWidth, setBrushWidth] = useState(3);
  const [stylusOnly, setStylusOnly] = useState(false);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('lined');
  const [lastPointerKind, setLastPointerKind] = useState<'pen' | 'touch' | 'mouse' | null>(null);
  const [activePoints, setActivePoints] = useState<StrokePoint[] | null>(null);

  const [newEn, setNewEn] = useState('');
  const [newFr, setNewFr] = useState('');
  const [newNote, setNewNote] = useState('');
  const [copiedRecap, setCopiedRecap] = useState(false);

  // Redraw transparent ink layer whenever synced strokes or active stroke change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    const drawStroke = (stroke: {
      color: string;
      width: number;
      points: StrokePoint[];
    }) => {
      if (stroke.points.length === 0) return;
      const erasing = stroke.color === 'ERASER';
      ctx.save();
      ctx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';
      ctx.strokeStyle = erasing ? 'rgba(0,0,0,1)' : stroke.color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length === 1) {
        const pt = stroke.points[0];
        ctx.lineWidth = stroke.width;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + 0.5, pt.y + 0.5);
        ctx.stroke();
        ctx.restore();
        return;
      }

      // Smooth quadratic Bezier curve with subtle stylus pressure scaling
      const avgPressure =
        stroke.points.reduce((acc, pt) => acc + (typeof pt.p === 'number' && pt.p > 0 ? pt.p : 0.5), 0) /
        stroke.points.length;
      const pressureScale = erasing ? 1 : 0.7 + avgPressure * 0.65;
      ctx.lineWidth = Math.max(1.5, stroke.width * pressureScale);

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length - 1; i++) {
        const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midX, midY);
      }
      const last = stroke.points[stroke.points.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.restore();
    };

    strokes.forEach(drawStroke);
    if (activePoints && activePoints.length > 0) {
      drawStroke({
        color: isEraser ? 'ERASER' : inkColor,
        width: isEraser ? Math.max(16, brushWidth * 4) : brushWidth,
        points: activePoints,
      });
    }
  }, [strokes, activePoints, inkColor, brushWidth, isEraser]);

  const toLogicalPoint = (clientX: number, clientY: number, pressure?: number): StrokePoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH,
      y: ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT,
      p: typeof pressure === 'number' && pressure > 0 ? Number(pressure.toFixed(2)) : undefined,
    };
  };

  const isAllowedPointer = (pointerType: string) => {
    if (stylusOnly && pointerType === 'touch') {
      return false;
    }
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return;
    if (!isAllowedPointer(e.pointerType)) return;
    setLastPointerKind(
      e.pointerType === 'pen' ? 'pen' : e.pointerType === 'touch' ? 'touch' : 'mouse'
    );
    e.currentTarget.setPointerCapture(e.pointerId);
    setActivePoints([toLogicalPoint(e.clientX, e.clientY, e.pressure)]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activePoints) return;
    if (!isAllowedPointer(e.pointerType)) return;
    const coalesced =
      typeof e.nativeEvent.getCoalescedEvents === 'function'
        ? e.nativeEvent.getCoalescedEvents()
        : null;
    const newPts =
      coalesced && coalesced.length > 0
        ? coalesced.map((ce) => toLogicalPoint(ce.clientX, ce.clientY, ce.pressure))
        : [toLogicalPoint(e.clientX, e.clientY, e.pressure)];
    setActivePoints((prev) => (prev ? [...prev, ...newPts] : newPts));
  };

  const handlePointerUp = () => {
    if (!activePoints || activePoints.length === 0) {
      setActivePoints(null);
      return;
    }
    const newStroke: BoardStroke = {
      id: `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      color: isEraser ? 'ERASER' : inkColor,
      width: isEraser ? Math.max(16, brushWidth * 4) : brushWidth,
      points: activePoints,
    };
    setActivePoints(null);
    onAddStroke(newStroke);
  };

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn.trim() || !newFr.trim()) return;
    onAddWord({
      en: newEn.trim(),
      fr: newFr.trim(),
      note: newNote.trim(),
    });
    setNewEn('');
    setNewFr('');
    setNewNote('');
  };

  const buildRecapSummary = () => {
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const wordLines =
      wordbank.length > 0
        ? wordbank
            .map(
              (w) =>
                `- ${w.en} : ${w.fr}${w.note ? ` (${w.note})` : ''}`
            )
            .join('\n')
        : '- Aucun mot ajouté pendant cette séance.';

    return [
      `Bilan du cours d'anglais — ${dateStr}`,
      `Étoiles gagnées : ${stars}`,
      '',
      'Vocabulaire retenu :',
      wordLines,
      boardNote.trim() ? `\nNotes du cours :\n${boardNote.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyRecap = async () => {
    const summary = buildRecapSummary();
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedRecap(true);
      window.setTimeout(() => setCopiedRecap(false), 2500);
    } catch {
      setCopiedRecap(false);
    }
  };

  const whatsappRecapUrl = `https://wa.me/?text=${encodeURIComponent(
    buildRecapSummary()
  )}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Shared Interactive Whiteboard & Scratchpad (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="manga-panel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold tracking-wide sb-text-primary">
                Tableau blanc stylet & tactile
              </h1>
              <p className="text-xs sb-text-muted">
                Écriture fluide au stylet Windows Ink, doigt ou souris ·{' '}
                {lastPointerKind === 'pen'
                  ? 'Stylet détecté'
                  : lastPointerKind === 'touch'
                    ? 'Tactile détecté'
                    : 'Prêt pour écrire'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Ink Color Buttons */}
              <div className="flex items-center gap-1.5 pr-2 border-r sb-divider">
                {INK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-label={c.label}
                    onClick={() => {
                      setIsEraser(false);
                      setInkColor(c.value);
                    }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      !isEraser && inkColor === c.value
                        ? 'border-[var(--sb-accent)] scale-110 ring-2 ring-[var(--sb-accent)]/40'
                        : 'border-slate-400 ring-1 ring-slate-500/40'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setIsEraser((v) => !v)}
                  aria-label="Gomme"
                  title="Gomme"
                  className={`p-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                    isEraser ? 'sb-status-danger' : 'sb-chip-idle'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Thickness */}
              <div className="flex items-center gap-1 sb-seg-track border p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBrushWidth(2)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                    brushWidth === 2 ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Fin
                </button>
                <button
                  type="button"
                  onClick={() => setBrushWidth(4)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                    brushWidth === 4 ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Moyen
                </button>
                <button
                  type="button"
                  onClick={() => setBrushWidth(7)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                    brushWidth === 7 ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  Épais
                </button>
              </div>

              <button
                type="button"
                onClick={onUndoStroke}
                disabled={strokes.length === 0}
                aria-label="Annuler le dernier trait"
                className="p-2 rounded-xl border sb-chip-idle hover:sb-text-accent disabled:opacity-40 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              {role === 'tutor' && (
                <button
                  type="button"
                  onClick={onClearStrokes}
                  disabled={strokes.length === 0}
                  aria-label="Effacer le tableau"
                  className="p-2 rounded-xl border sb-chip-idle hover:border-[var(--sb-danger)] hover:sb-text-danger disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stylus Palm-Rejection & Paper Guide Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => setStylusOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stylusOnly ? 'sb-chip-solid' : 'sb-chip-idle'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
              {stylusOnly
                ? 'Stylet seul (anti-paume actif)'
                : 'Stylet + Doigt + Souris'}
            </button>

            <div className="flex items-center gap-1 p-0.5 sb-seg-track border rounded-xl">
              {(
                [
                  { id: 'lined', label: 'Lignes cahier' },
                  { id: 'dots', label: 'Points' },
                  { id: 'blank', label: 'Vierge' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaperStyle(opt.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    paperStyle === opt.id ? 'sb-seg-active' : 'sb-seg-idle'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-2xl border-2 border-[var(--sb-accent)]/50 bg-slate-50 overflow-hidden select-none shadow-sm"
            style={
              paperStyle === 'lined'
                ? {
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, #cbd5e1 39px, #cbd5e1 40px)',
                  }
                : paperStyle === 'dots'
                  ? {
                      backgroundImage:
                        'radial-gradient(#94a3b8 1.25px, transparent 1.25px)',
                      backgroundSize: '24px 24px',
                    }
                  : undefined
            }
          >
            <canvas
              ref={canvasRef}
              width={LOGICAL_WIDTH}
              height={LOGICAL_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-auto block touch-none select-none cursor-crosshair"
            />
          </div>
        </div>

        {/* Shared Live Text Notes */}
        <div className="manga-panel p-5 space-y-2.5">
          <label
            htmlFor="shared-board-note"
            className="text-sm font-bold tracking-wide sb-text-primary block"
          >
            Mémo grammaire & devoirs pour la prochaine fois
          </label>
          <textarea
            id="shared-board-note"
            rows={3}
            value={boardNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            placeholder="Ex : Penser au -s à la 3e personne (He plays, She likes). À revoir : les questions avec Do / Does."
            className="w-full rounded-xl border sb-input px-3.5 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Right: Session Wordbank & End-of-Class Recap (5 cols) */}
      <aside className="lg:col-span-5 space-y-4">
        <div className="manga-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold tracking-wide sb-text-primary">
                Carnet de vocabulaire
              </h2>
              <p className="text-xs sb-text-accent tabular-nums">
                {wordbank.length} mot{wordbank.length > 1 ? 's' : ''} retenu
                {wordbank.length > 1 ? 's' : ''} aujourd’hui
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {role === 'tutor' && (
                <>
                  <button
                    type="button"
                    onClick={handleCopyRecap}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border sb-chip-idle text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedRecap ? (
                      <>
                        <Check className="w-3.5 h-3.5 sb-text-success" aria-hidden="true" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        Copier le bilan
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappRecapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 border-b-2 border-emerald-800 text-white text-xs font-bold hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Add new word form */}
          <form onSubmit={handleCreateWord} className="space-y-2 pt-3 border-t sb-divider">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="Mot en anglais"
                className="rounded-xl border sb-input px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newFr}
                onChange={(e) => setNewFr(e.target.value)}
                placeholder="Traduction française"
                className="rounded-xl border sb-input px-3 py-2 text-xs"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Astuce prononciation / exemple (optionnel)"
                className="flex-1 rounded-xl border sb-input px-3 py-2 text-xs"
              />
              <button
                type="submit"
                disabled={!newEn.trim() || !newFr.trim()}
                className="manga-btn-primary inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Ajouter
              </button>
            </div>
          </form>

          {/* Wordbank List */}
          <div className="divide-y sb-divide max-h-[420px] overflow-y-auto">
            {wordbank.length === 0 ? (
              <p className="py-6 text-center text-xs sb-text-muted">
                Aucun mot dans le carnet pour le moment.
              </p>
            ) : (
              wordbank.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-bold sb-text-primary">
                        {item.en}
                      </span>
                      <span className="text-xs sb-text-reward font-semibold">
                        {item.fr}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs sb-text-muted break-words">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        speakEnglish(item.en, { accent, rate: speechRate })
                      }
                      aria-label={`Écouter ${item.en}`}
                      className="p-1.5 rounded-lg sb-text-accent hover:bg-[var(--sb-accent-soft)] cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {role === 'tutor' && (
                      <button
                        type="button"
                        onClick={() => onRemoveWord(item.id)}
                        aria-label={`Supprimer ${item.en}`}
                        className="p-1.5 rounded-lg sb-text-muted hover:sb-text-danger hover:bg-[var(--sb-danger-soft)] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
