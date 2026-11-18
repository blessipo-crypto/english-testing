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
              <h1 className="text-lg font-bold text-slate-900">
                Tableau blanc stylet & tactile
              </h1>
              <p className="text-xs text-slate-500">
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
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
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
                        ? 'border-slate-900 scale-110'
                        : 'border-white ring-1 ring-slate-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setIsEraser((v) => !v)}
                  aria-label="Gomme"
                  title="Gomme"
                  className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    isEraser
                      ? 'bg-rose-50 border-rose-600 text-rose-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Thickness */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBrushWidth(2)}
                  className={`px-2 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    brushWidth === 2
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Fin
                </button>
                <button
                  type="button"
                  onClick={() => setBrushWidth(4)}
                  className={`px-2 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    brushWidth === 4
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  Moyen
                </button>
                <button
                  type="button"
                  onClick={() => setBrushWidth(7)}
                  className={`px-2 py-1 text-xs font-medium rounded-md cursor-pointer ${
                    brushWidth === 7
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600'
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
                className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              {role === 'tutor' && (
                <button
                  type="button"
                  onClick={onClearStrokes}
                  disabled={strokes.length === 0}
                  aria-label="Effacer le tableau"
                  className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40 cursor-pointer"
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stylusOnly
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" aria-hidden="true" />
              {stylusOnly
                ? 'Stylet seul (anti-paume actif)'
                : 'Stylet + Doigt + Souris'}
            </button>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 border border-slate-200 rounded-lg">
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
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    paperStyle === opt.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-lg border-2 border-slate-900 bg-white overflow-hidden select-none"
            style={
              paperStyle === 'lined'
                ? {
                    backgroundImage:
                      'repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, #e2e8f0 39px, #e2e8f0 40px)',
                  }
                : paperStyle === 'dots'
                  ? {
                      backgroundImage:
                        'radial-gradient(#cbd5e1 1.25px, transparent 1.25px)',
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
            className="text-sm font-semibold text-slate-900 block"
          >
            Mémo grammaire & devoirs pour la prochaine fois
          </label>
          <textarea
            id="shared-board-note"
            rows={3}
            value={boardNote}
            onChange={(e) => onUpdateNote(e.target.value)}
            placeholder="Ex : Penser au -s à la 3e personne (He plays, She likes). À revoir : les questions avec Do / Does."
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Right: Session Wordbank & End-of-Class Recap (5 cols) */}
      <aside className="lg:col-span-5 space-y-4">
        <div className="manga-panel p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Carnet de vocabulaire
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedRecap ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Add new word form */}
          <form onSubmit={handleCreateWord} className="space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="Mot en anglais"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <input
                type="text"
                value={newFr}
                onChange={(e) => setNewFr(e.target.value)}
                placeholder="Traduction française"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Astuce prononciation / exemple (optionnel)"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={!newEn.trim() || !newFr.trim()}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Ajouter
              </button>
            </div>
          </form>

          {/* Wordbank List */}
          <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
            {wordbank.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
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
                      <span className="text-sm font-semibold text-slate-900">
                        {item.en}
                      </span>
                      <span className="text-xs text-indigo-700 font-medium">
                        {item.fr}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-500 break-words">
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
                      className="p-1.5 rounded-md text-indigo-700 hover:bg-indigo-50 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {role === 'tutor' && (
                      <button
                        type="button"
                        onClick={() => onRemoveWord(item.id)}
                        aria-label={`Supprimer ${item.en}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
