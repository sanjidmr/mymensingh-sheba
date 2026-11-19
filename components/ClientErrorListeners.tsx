'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/client-error-reporting';

export function ClientErrorListeners() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError(event.error ?? event.message, {
        source: 'window.error',
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      reportClientError(event.reason, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
