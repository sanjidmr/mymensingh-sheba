'use client';
export default function GlobalError({ error }: { error: Error }) {
  return (
    <html><body style={{ padding: 20, fontFamily: 'monospace' }}>
      <h2>Error</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}{'\n\n'}{error.stack}</pre>
    </body></html>
  );
}