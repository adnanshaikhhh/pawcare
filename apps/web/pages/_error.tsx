// Custom error page to override the broken Next.js Pages Router fallback
// This file is never directly used (App Router handles errors) but its
// presence prevents Next.js from generating the broken default _error.js

function ErrorPage({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, color: '#FF6B6B', margin: 0 }}>
          {statusCode || 'Error'}
        </h1>
        <p style={{ color: '#6E6E73', marginTop: '1rem' }}>
          {statusCode === 404 ? 'Page not found' : 'Something went wrong'}
        </p>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
