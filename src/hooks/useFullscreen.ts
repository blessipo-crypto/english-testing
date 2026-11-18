import { useCallback, useEffect, useState } from 'react';

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

function getActiveFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDocument;
  return (
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement ||
    null
  );
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0
  );
}

export function useFullscreen() {
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(() =>
    Boolean(getActiveFullscreenElement())
  );
  const [isDisplayModeFullscreen, setIsDisplayModeFullscreen] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(display-mode: fullscreen)').matches)
  );
  const [isImmersiveFallback, setIsImmersiveFallback] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null);

  const isFullscreen =
    isNativeFullscreen || isDisplayModeFullscreen || isImmersiveFallback;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleChange = () => {
      const active = Boolean(getActiveFullscreenElement());
      setIsNativeFullscreen(active);
      if (!active) {
        // Ensure immersive state stays synced when user exits with Esc or Android gesture
        setIsImmersiveFallback(false);
      }
    };

    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ] as const;

    events.forEach((evt) => document.addEventListener(evt, handleChange));
    return () => {
      events.forEach((evt) => document.removeEventListener(evt, handleChange));
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(display-mode: fullscreen)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      setIsDisplayModeFullscreen(e.matches);
    };
    setIsDisplayModeFullscreen(mq.matches);
    mq.addEventListener('change', handleDisplayChange);
    return () => mq.removeEventListener('change', handleDisplayChange);
  }, []);

  useEffect(() => {
    if (!isImmersiveFallback) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImmersiveFallback(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImmersiveFallback]);

  useEffect(() => {
    if (!fullscreenNotice) return;
    const timer = window.setTimeout(() => {
      setFullscreenNotice(null);
    }, 5500);
    return () => window.clearTimeout(timer);
  }, [fullscreenNotice]);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    setFullscreenNotice(null);

    const el = document.documentElement as FullscreenElement;

    const activateFallback = () => {
      setIsImmersiveFallback(true);
      setFullscreenNotice(
        isTouchDevice()
          ? 'Mode immersion activé (plein écran système complet disponible en ouvrant l’onglet directement dans Chrome).'
          : 'Mode immersion activé (plein écran navigateur restreint ici — appuyez sur F11 sous Windows pour masquer les onglets).'
      );
    };

    try {
      if (el.requestFullscreen) {
        try {
          // navigationUI: 'hide' hides Android tablet system bar & navigation buttons
          await el.requestFullscreen({ navigationUI: 'hide' });
          setIsNativeFullscreen(true);
          return;
        } catch (err) {
          // Retry without options if browser rejects FullscreenOptions dictionary
          if (err instanceof TypeError) {
            await el.requestFullscreen();
            setIsNativeFullscreen(true);
            return;
          }
          throw err;
        }
      }

      if (el.webkitRequestFullscreen) {
        await Promise.resolve(el.webkitRequestFullscreen());
        if (getActiveFullscreenElement()) {
          setIsNativeFullscreen(true);
          return;
        }
      }

      if (el.mozRequestFullScreen) {
        await Promise.resolve(el.mozRequestFullScreen());
        if (getActiveFullscreenElement()) {
          setIsNativeFullscreen(true);
          return;
        }
      }

      if (el.msRequestFullscreen) {
        await Promise.resolve(el.msRequestFullscreen());
        if (getActiveFullscreenElement()) {
          setIsNativeFullscreen(true);
          return;
        }
      }

      activateFallback();
    } catch {
      activateFallback();
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    setFullscreenNotice(null);
    setIsImmersiveFallback(false);

    if (isDisplayModeFullscreen && !getActiveFullscreenElement()) {
      setFullscreenNotice(
        'Le plein écran du navigateur a été activé via le système : appuyez sur F11 pour le quitter.'
      );
      return;
    }

    const doc = document as FullscreenDocument;
    try {
      if (doc.fullscreenElement && doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
        await Promise.resolve(doc.webkitExitFullscreen());
      } else if (doc.mozFullScreenElement && doc.mozCancelFullScreen) {
        await Promise.resolve(doc.mozCancelFullScreen());
      } else if (doc.msFullscreenElement && doc.msExitFullscreen) {
        await Promise.resolve(doc.msExitFullscreen());
      }
    } catch {
      // Ignore exit errors if browser already exited
    } finally {
      setIsNativeFullscreen(Boolean(getActiveFullscreenElement()));
    }
  }, [isDisplayModeFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, isFullscreen]);

  const dismissNotice = useCallback(() => {
    setFullscreenNotice(null);
  }, []);

  return {
    isFullscreen,
    isNativeFullscreen,
    isImmersiveFallback,
    fullscreenNotice,
    dismissNotice,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
