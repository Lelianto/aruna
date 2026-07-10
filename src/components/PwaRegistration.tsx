'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X, Plus } from 'lucide-react';

// Chrome/Edge fire this event when the app meets install criteria. It is not in
// the standard TS lib DOM types yet, so we describe the bit we use.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'aruna_pwa_install_dismissed';

export default function PwaRegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  // Register the service worker. Skipped in development: the SW's cache-first
  // fetch handler ends up intercepting Next's Fast Refresh / RSC requests,
  // which get aborted on every navigation and surface as noisy unhandled
  // "Failed to fetch" rejections in the console.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('Service worker registration failed:', error);
        });
      });
    }
  }, []);

  // Capture the install prompt (Chromium) and handle the iOS fallback.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed / running standalone -> never show the prompt.
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari exposes navigator.standalone
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // Respect a previous dismissal.
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const onBeforeInstallPrompt = (e: Event) => {
      // Stop the browser's own mini-infobar so we can show our own UI.
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only surface our custom install banner on mobile/tablet. On desktop the
      // browser already shows an install icon in the address bar, so an in-page
      // modal is unnecessary and intrusive.
      const isMobileViewport = window.matchMedia('(max-width: 1023px)').matches;
      if (isMobileViewport) {
        setShowBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);

    const onInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari never fires beforeinstallprompt. Detect it and show manual
    // "Add to Home Screen" instructions instead.
    const ua = window.navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (isIos && isSafari) {
      // Intentional: user-agent is only known after mount, so setting this in an
      // effect avoids an SSR hydration mismatch (server can't detect iOS).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const dismiss = () => {
    setShowBanner(false);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  if (!showBanner && !showIosHint) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 inset-x-4 z-[9998] flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 flex items-start gap-3 animate-fade-in">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white font-semibold">
          A
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">Pasang Aplikasi ARUNA</p>

          {showBanner ? (
            <>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Akses lebih cepat langsung dari layar utama, bekerja walau koneksi terbatas.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-3.5 py-2 text-xs font-semibold text-white hover:bg-brand-red/90 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" /> Pasang Sekarang
                </button>
                <button
                  onClick={dismiss}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Nanti
                </button>
              </div>
            </>
          ) : (
            // iOS manual instructions
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Ketuk tombol <Share className="inline h-3.5 w-3.5 -mt-0.5 text-brand-navy" />{' '}
              <span className="font-semibold">Bagikan</span> di Safari, lalu pilih{' '}
              <span className="font-semibold">
                Tambah ke Layar Utama <Plus className="inline h-3.5 w-3.5 -mt-0.5" />
              </span>
              .
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-slate-400 hover:text-slate-700 cursor-pointer"
          aria-label="Tutup"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
