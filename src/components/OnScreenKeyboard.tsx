import { useEffect, useState } from 'react';
import { Delete, CornerDownLeft, Keyboard, X, ArrowUp } from 'lucide-react';

interface OnScreenKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type KeyboardLayout = 'azerty' | 'qwerty' | 'symbols';

const AZERTY_ROWS = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', "'", ',', '.', '?'],
];

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
];

const SYMBOL_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['é', 'è', 'ê', 'à', 'ç', 'ù', '-', ':', ';', '!'],
  ['(', ')', '"', '/', '+', '=', '%', '€', '£', '&'],
];

const QUICK_ENGLISH_CHIPS = ["I'm ", "don't ", "can't ", "o'clock ", 'because '];

function isTextEditable(
  el: Element | null
): el is HTMLInputElement | HTMLTextAreaElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return !el.disabled && !el.readOnly;
  if (el instanceof HTMLInputElement) {
    const type = (el.type || 'text').toLowerCase();
    return (
      !el.disabled &&
      !el.readOnly &&
      ['text', 'search', 'tel', 'url', 'email'].includes(type)
    );
  }
  return false;
}

function setNativeValueAndEmit(
  el: HTMLInputElement | HTMLTextAreaElement,
  nextVal: string
) {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor && typeof descriptor.set === 'function') {
    descriptor.set.call(el, nextVal);
  } else {
    el.value = nextVal;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

export function OnScreenKeyboard({ isOpen, onClose }: OnScreenKeyboardProps) {
  const [layout, setLayout] = useState<KeyboardLayout>('azerty');
  const [shift, setShift] = useState(false);
  const [targetEl, setTargetEl] = useState<
    HTMLInputElement | HTMLTextAreaElement | null
  >(null);

  useEffect(() => {
    const checkActive = () => {
      if (isTextEditable(document.activeElement)) {
        setTargetEl(document.activeElement);
      }
    };
    checkActive();

    const handleFocusIn = (e: FocusEvent) => {
      if (isTextEditable(e.target as Element)) {
        setTargetEl(e.target as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);

  if (!isOpen) return null;

  const getActiveTarget = (): HTMLInputElement | HTMLTextAreaElement | null => {
    if (isTextEditable(document.activeElement)) return document.activeElement;
    if (targetEl && document.contains(targetEl) && !targetEl.disabled) {
      return targetEl;
    }
    const fallback = document.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >('textarea:not([disabled]), input[type="text"]:not([disabled])');
    return fallback || null;
  };

  const insertText = (text: string) => {
    const el = getActiveTarget();
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const nextVal = el.value.slice(0, start) + text + el.value.slice(end);
    setNativeValueAndEmit(el, nextVal);
    const nextPos = start + text.length;
    try {
      el.setSelectionRange(nextPos, nextPos);
    } catch {
      // Ignore input types without selection range support
    }
    if (shift && text.length === 1) {
      setShift(false);
    }
  };

  const handleBackspace = () => {
    const el = getActiveTarget();
    if (!el) return;
    el.focus();
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    if (start === 0 && end === 0) return;

    let nextVal = el.value;
    let nextPos = start;
    if (start !== end) {
      nextVal = el.value.slice(0, start) + el.value.slice(end);
      nextPos = start;
    } else {
      nextVal = el.value.slice(0, start - 1) + el.value.slice(end);
      nextPos = start - 1;
    }
    setNativeValueAndEmit(el, nextVal);
    try {
      el.setSelectionRange(nextPos, nextPos);
    } catch {
      // Ignore
    }
  };

  const handleEnter = () => {
    const el = getActiveTarget();
    if (!el) return;
    if (el instanceof HTMLTextAreaElement) {
      insertText('\n');
    } else if (el.form) {
      el.form.requestSubmit();
    }
  };

  const rows =
    layout === 'azerty'
      ? AZERTY_ROWS
      : layout === 'qwerty'
        ? QWERTY_ROWS
        : SYMBOL_ROWS;

  const activeTarget = getActiveTarget();
  const activeHint = activeTarget?.placeholder || 'Zone de texte active';

  return (
    <div
      role="region"
      aria-label="Clavier tactile à l'écran"
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-slate-900 shadow-[0_-4px_0px_#0f172a] select-none"
      onPointerDown={(e) => e.preventDefault()}
    >
      <div className="max-w-4xl mx-auto px-3 py-2.5 space-y-2">
        {/* Keyboard Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Keyboard className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold text-slate-900 truncate max-w-[240px] sm:max-w-sm">
              {activeTarget
                ? `Saisie : ${activeHint}`
                : 'Touchez une zone de texte pour écrire'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 border border-slate-300 rounded-lg">
              {(
                [
                  { id: 'azerty', label: 'AZERTY' },
                  { id: 'qwerty', label: 'QWERTY' },
                  { id: 'symbols', label: '123 / FR' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`px-2 py-1 text-[11px] font-bold rounded-md cursor-pointer ${
                    layout === opt.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le clavier à l'écran"
              className="p-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick English Helper Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_ENGLISH_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => insertText(chip)}
              className="px-2.5 py-1 rounded-md border border-slate-300 bg-amber-50 text-xs font-bold text-slate-900 hover:bg-amber-100 active:scale-95 cursor-pointer"
            >
              {chip.trim()}
            </button>
          ))}
        </div>

        {/* Keys Grid */}
        <div className="space-y-1.5">
          {rows.map((row, rIdx) => (
            <div key={`krow-${rIdx}`} className="grid grid-cols-10 gap-1 sm:gap-1.5">
              {row.map((keyChar) => {
                const display =
                  shift && layout !== 'symbols' ? keyChar.toUpperCase() : keyChar;
                return (
                  <button
                    key={`key-${rIdx}-${keyChar}`}
                    type="button"
                    onClick={() => insertText(display)}
                    className="h-10 sm:h-11 rounded-lg border-2 border-slate-900 bg-white text-sm sm:text-base font-bold text-slate-900 hover:bg-slate-50 active:bg-rose-50 active:translate-y-0.5 flex items-center justify-center cursor-pointer"
                  >
                    {display}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Bottom Control Row */}
          <div className="grid grid-cols-12 gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setShift((s) => !s)}
              className={`col-span-2 h-10 sm:h-11 rounded-lg border-2 border-slate-900 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                shift ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Maj</span>
            </button>

            <button
              type="button"
              onClick={() => insertText(' ')}
              className="col-span-6 h-10 sm:h-11 rounded-lg border-2 border-slate-900 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:bg-rose-50 cursor-pointer"
            >
              Espace
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              aria-label="Effacer le caractère"
              className="col-span-2 h-10 sm:h-11 rounded-lg border-2 border-slate-900 bg-slate-100 text-slate-900 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
            >
              <Delete className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleEnter}
              aria-label="Valider ou retour à la ligne"
              className="col-span-2 h-10 sm:h-11 rounded-lg border-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
            >
              <CornerDownLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
