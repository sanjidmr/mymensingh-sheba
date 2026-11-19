'use client';

import React from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/client-error-reporting';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportClientError(error, {
      source: 'react-error-boundary',
      componentStack: info.componentStack,
    });
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5 py-12 text-center">
          <h1 className="text-xl font-bold text-ink-900">দুঃখিত, একটি সমস্যা হয়েছে</h1>
          <p className="max-w-md text-sm text-ink-600">
            Something went wrong. Please try again or return to the home page.
          </p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={this.retry} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white">
              Try again
            </button>
            <Link href="/" className="font-semibold text-brand-700 underline">Home</Link>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
