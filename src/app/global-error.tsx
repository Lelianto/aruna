'use client';

// Last-resort error boundary that also catches errors thrown in the root
// layout itself. It must render its own <html>/<body> because it replaces the
// root layout when triggered.

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html lang="id">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f7f8fa', color: '#0f172a' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              Aplikasi Perlu Dimuat Ulang
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
              Terjadi kesalahan tak terduga. Silakan muat ulang untuk melanjutkan.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#003049',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
