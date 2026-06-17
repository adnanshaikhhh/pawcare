'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😿</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1C1C1E', marginBottom: '0.5rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#6E6E73', marginBottom: '1.5rem' }}>
              PawCare hit an unexpected error. Your data is safe.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#AEAEB2', fontFamily: 'monospace', marginBottom: '1.5rem' }}>
                {error.digest}
              </p>
            )}
            <button
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '9999px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
